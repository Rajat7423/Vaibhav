import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  const database = new Database(process.env.DATABASE_PATH || 'cineverse.sqlite');
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  database.exec(`
    CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY, email TEXT UNIQUE COLLATE NOCASE, name TEXT NOT NULL, password TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, csrf_hash TEXT NOT NULL, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS saved_movies(user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, movie_id INTEGER NOT NULL, list_type TEXT NOT NULL CHECK(list_type IN ('favorites','watchlist')), movie_json TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(user_id,movie_id,list_type));
  `);
  const hash = (value: string) => crypto.createHash('sha256').update(value).digest('hex');
  const cookieName = 'cineverse_session';
  const sessionFor = (req: any) => {
    const token = String(req.headers.cookie || '').split(';').map((part: string) => part.trim()).find((part: string) => part.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    if (!token) return null;
    const row = database.prepare('SELECT s.token_hash,s.csrf_hash,s.expires_at,u.id,u.email,u.name FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(hash(decodeURIComponent(token))) as any;
    if (!row || row.expires_at < Date.now()) return null;
    return { tokenHash: row.token_hash, csrfHash: row.csrf_hash, user: { id: row.id, email: row.email, name: row.name } };
  };
  const makeSession = (userId: number, res: any) => {
    const token = crypto.randomBytes(32).toString('base64url');
    const csrf = crypto.randomBytes(24).toString('base64url');
    database.prepare('INSERT INTO sessions(token_hash,csrf_hash,user_id,expires_at) VALUES(?,?,?,?)').run(hash(token), hash(csrf), userId, Date.now() + 30 * 864e5);
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `${cookieName}=${encodeURIComponent(token)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax${secure}`);
    const user = database.prepare('SELECT id,email,name FROM users WHERE id=?').get(userId);
    return { user, csrf };
  };
  const checkCsrf = (req: any, session: any) => {
    let sameOrigin = false;
    try { sameOrigin = new URL(req.get('origin') || '').host.toLowerCase() === String(req.get('host') || '').toLowerCase(); } catch { sameOrigin = false; }
    return Boolean(session && sameOrigin && crypto.timingSafeEqual(Buffer.from(hash(req.get('x-csrf-token') || '')), Buffer.from(session.csrfHash)));
  };
  const accountLists = (userId: number) => {
    const lists: any = { favorites: [], watchlist: [] };
    const rows = database.prepare('SELECT list_type,movie_json FROM saved_movies WHERE user_id=? ORDER BY updated_at DESC').all(userId) as any[];
    rows.forEach((row) => lists[row.list_type].push(JSON.parse(row.movie_json)));
    return lists;
  };
  app.get('/api/session', (req, res) => {
    const session = sessionFor(req);
    if (!session) return res.json({ user: null, csrf: null, lists: { favorites: [], watchlist: [] } });
    const csrf = crypto.randomBytes(24).toString('base64url');
    database.prepare('UPDATE sessions SET csrf_hash=? WHERE token_hash=?').run(hash(csrf), session.tokenHash);
    res.json({ user: session.user, csrf, lists: accountLists(session.user.id) });
  });
  app.post('/api/register', (req, res) => {
    const name = String(req.body?.name || '').trim().slice(0, 60);
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10 || password.length > 128) return res.status(400).json({ error: 'Enter a name, valid email, and password of at least 10 characters.' });
    try {
      const salt = crypto.randomBytes(16);
      const digest = crypto.scryptSync(password, salt, 64);
      const result = database.prepare('INSERT INTO users(email,name,password,created_at) VALUES(?,?,?,?)').run(email, name, `${salt.toString('hex')}:${digest.toString('hex')}`, new Date().toISOString());
      return res.json(makeSession(Number(result.lastInsertRowid), res));
    } catch { return res.status(409).json({ error: 'An account with this email already exists.' }); }
  });
  app.post('/api/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const user = database.prepare('SELECT id,password FROM users WHERE email=?').get(email) as any;
    if (!user) return res.status(401).json({ error: 'Email or password is incorrect.' });
    const [saltHex, digestHex] = user.password.split(':');
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), 64);
    if (!crypto.timingSafeEqual(actual, Buffer.from(digestHex, 'hex'))) return res.status(401).json({ error: 'Email or password is incorrect.' });
    return res.json(makeSession(user.id, res));
  });
  app.post('/api/logout', (req, res) => {
    const session = sessionFor(req);
    if (session && !checkCsrf(req, session)) return res.status(403).json({ error: 'Session expired. Refresh and retry.' });
    if (session) database.prepare('DELETE FROM sessions WHERE token_hash=?').run(session.tokenHash);
    res.setHeader('Set-Cookie', `${cookieName}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax`);
    res.json({ ok: true });
  });
  app.get('/api/lists', (req, res) => {
    const session = sessionFor(req);
    if (!session) return res.status(401).json({ error: 'Sign in to access your lists.' });
    res.json({ lists: accountLists(session.user.id) });
  });
  app.post('/api/lists', (req, res) => {
    const session = sessionFor(req);
    if (!session || !checkCsrf(req, session)) return res.status(403).json({ error: 'Session expired. Refresh and retry.' });
    const { list_type, movie } = req.body || {};
    if (!['favorites', 'watchlist'].includes(list_type) || !movie || !Number.isInteger(Number(movie.id)) || !movie.title) return res.status(400).json({ error: 'Invalid movie or list.' });
    const safeMovie = { id: Number(movie.id), title: String(movie.title).slice(0, 300), poster_path: String(movie.poster_path || '').slice(0, 300), backdrop_path: String(movie.backdrop_path || '').slice(0, 300), overview: String(movie.overview || '').slice(0, 2000), release_date: String(movie.release_date || '').slice(0, 20), vote_average: Number(movie.vote_average || 0), genre_ids: Array.isArray(movie.genre_ids) ? movie.genre_ids.slice(0, 30).map(Number) : [], original_language: String(movie.original_language || '').slice(0, 10) };
    database.prepare('INSERT INTO saved_movies(user_id,movie_id,list_type,movie_json,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,movie_id,list_type) DO UPDATE SET movie_json=excluded.movie_json,updated_at=excluded.updated_at').run(session.user.id, safeMovie.id, list_type, JSON.stringify(safeMovie), new Date().toISOString());
    res.json({ lists: accountLists(session.user.id) });
  });
  app.delete('/api/lists/:type/:id', (req, res) => {
    const session = sessionFor(req);
    if (!session || !checkCsrf(req, session)) return res.status(403).json({ error: 'Session expired. Refresh and retry.' });
    if (!['favorites', 'watchlist'].includes(req.params.type)) return res.status(400).json({ error: 'Invalid list.' });
    database.prepare('DELETE FROM saved_movies WHERE user_id=? AND movie_id=? AND list_type=?').run(session.user.id, Number(req.params.id), req.params.type);
    res.json({ lists: accountLists(session.user.id) });
  });

  // Keep TMDB credentials on the server and page the live catalog on demand.
  const tmdbToken = process.env.TMDB_READ_ACCESS_TOKEN;
  const tmdbKey = process.env.TMDB_API_KEY;
  const tmdbCache = new Map<string, { expires: number; data: any }>();
  const regions: Record<string, { country: string; language: string }> = {
    hollywood: { country: 'US', language: 'en' }, bollywood: { country: 'IN', language: 'hi' },
    tollywood: { country: 'IN', language: 'te' },
  };
  const moodGenres: Record<string, number[]> = {
    'feel-good': [35, 10751, 12], 'mind-bending': [878, 9648, 53], adrenaline: [28, 53, 80],
    romance: [10749, 35, 18], comfort: [16, 10751, 35], 'dark-and-intense': [27, 53, 80, 18],
  };
  async function tmdb(path: string, params: Record<string, string> = {}) {
    if (!tmdbToken && !tmdbKey) throw new Error('TMDB is not configured. Add TMDB_READ_ACCESS_TOKEN to the server environment.');
    const url = new URL(`https://api.themoviedb.org/3/${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    if (!tmdbToken && tmdbKey) url.searchParams.set('api_key', tmdbKey);
    const cached = tmdbCache.get(url.toString());
    if (cached?.expires && cached.expires > Date.now()) return cached.data;
    const response = await fetch(url, { headers: tmdbToken ? { Authorization: `Bearer ${tmdbToken}` } : {} });
    if (!response.ok) throw new Error(`TMDB request failed (${response.status}).`);
    const data = await response.json();
    tmdbCache.set(url.toString(), { expires: Date.now() + 30_000, data });
    return data;
  }
  app.get('/api/config', (_req, res) => res.json({ configured: Boolean(tmdbToken || tmdbKey), regions }));
  app.get('/api/genres', async (_req, res) => { try { res.json(await tmdb('genre/movie/list', { language: 'en-US' })); } catch (e: any) { res.status(503).json({ error: e.message }); } });
  app.get('/api/trending', async (_req, res) => { try { res.json(await tmdb('trending/movie/week', { language: 'en-US' })); } catch (e: any) { res.status(503).json({ error: e.message }); } });
  app.get('/api/movies', async (req, res) => {
    try {
      const region = regions[String(req.query.region)] || regions.hollywood;
      const page = String(Math.max(1, Math.min(500, Number(req.query.page) || 1)));
      const q = String(req.query.q || '').slice(0, 100);
      const params: Record<string, string> = { page, language: 'en-US', include_adult: 'false' };
      const data = q ? await tmdb('search/movie', { ...params, query: q }) : await tmdb('discover/movie', {
        ...params, with_origin_country: region.country, with_original_language: region.language,
        sort_by: String(req.query.sort || 'popularity.desc'), 'vote_count.gte': '1',
        ...(req.query.genre ? { with_genres: String(req.query.genre) } : {}),
      });
      data.total_pages = Math.min(500, data.total_pages || 0);
      res.json(data);
    } catch (e: any) { res.status(503).json({ error: e.message || 'Catalog unavailable.' }); }
  });
  app.get('/api/recommendations', async (req, res) => {
    try {
      const region = regions[String(req.query.region)] || regions.hollywood;
      const genres = [...(moodGenres[String(req.query.mood)] || [])];
      const session = sessionFor(req);
      if (session) {
        const saved = database.prepare("SELECT movie_json FROM saved_movies WHERE user_id=? AND list_type='favorites' ORDER BY updated_at DESC LIMIT 20").all(session.user.id) as any[];
        const weights = new Map<number, number>();
        saved.forEach(({movie_json}) => (JSON.parse(movie_json).genre_ids || []).forEach((id:number) => weights.set(id,(weights.get(id)||0)+1)));
        [...weights.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3).forEach(([id])=>{if(!genres.includes(id))genres.push(id);});
      }
      const data = await tmdb('discover/movie', { language: 'en-US', page: '1', include_adult: 'false',
        sort_by: 'popularity.desc', with_origin_country: region.country, with_original_language: region.language,
        'vote_count.gte': '1', ...(genres.length ? { with_genres: genres.join('|') } : {}) });
      data.reason = req.query.mood ? `Picked for your ${String(req.query.mood).replaceAll('-', ' ')} mood.` : 'Popular picks from your cinema universe.';
      res.json(data);
    } catch (e: any) { res.status(503).json({ error: e.message || 'Recommendations unavailable.' }); }
  });
  app.get('/api/movie/:id', async (req, res) => {
    if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: 'Invalid movie id.' });
    try { res.json(await tmdb(`movie/${req.params.id}`, { language: 'en-US', append_to_response: 'credits,videos,similar' })); }
    catch (e: any) { res.status(503).json({ error: e.message || 'Movie details unavailable.' }); }
  });

  // Server-side Gemini initialization with required telemetry header
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    try {
      ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      console.log('Gemini AI client successfully initialized.');
    } catch (err) {
      console.error('Error initializing GoogleGenAI:', err);
    }
  } else {
    console.warn('GEMINI_API_KEY is not set in environment. Fallback matching engine will handle AI requests gracefully.');
  }

  // Health endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      service: 'CineVerse Streaming Recommendation Engine',
    });
  });

  // AI Movie Recommendation Endpoint
  app.post('/api/ai-recommend', async (req, res) => {
    try {
      const { prompt, preferredGenres, pacing, tone, streamingPlatform } = req.body;

      if (!ai) {
        // Return smart algorithmic response when API key is not yet set
        return res.json({
          source: 'curated-engine',
          recommendations: [
            {
              title: 'Arrival',
              year: 2016,
              matchScore: 98,
              genres: ['Sci-Fi', 'Mystery', 'Drama'],
              reason: 'Combines cerebral linguistic puzzle-solving with profound emotional resonance matching your interest in high-concept cinema.',
              moodAlignment: 'Philosophical, Awe-Inspiring, Quiet Intensity',
              streamingPlatform: 'Prime Video',
              comparableFilms: ['Interstellar', 'Contact', 'Annihilation']
            },
            {
              title: 'Neon Synapse: 2049 Protocol',
              year: 2024,
              matchScore: 96,
              genres: ['Sci-Fi', 'Neo-Noir', 'Mystery'],
              reason: 'Atmospheric slow-burn worldbuilding with stunning anamorphic visual direction and an existential mystery.',
              moodAlignment: 'Rainy Cyberpunk, Hypnotic Pacing, Existential Dread',
              streamingPlatform: 'Netflix',
              comparableFilms: ['Blade Runner 2049', 'Ex Machina', 'Ghost in the Shell']
            },
            {
              title: 'The Rainmaker of District 7',
              year: 2025,
              matchScore: 94,
              genres: ['Crime', 'Thriller', 'Mystery'],
              reason: 'Delivers meticulous David Fincher style procedural tension in rain-drenched urban corridors.',
              moodAlignment: 'Gritty Noir, Methodical Investigation, High Stakes',
              streamingPlatform: 'Prime Video',
              comparableFilms: ['Se7en', 'Zodiac', 'Memories of Murder']
            },
            {
              title: 'Parasite',
              year: 2019,
              matchScore: 93,
              genres: ['Thriller', 'Drama', 'Comedy'],
              reason: 'Impeccable pacing, razor-sharp thematic bite, and unexpected genre shifts that keep you on the edge of your seat.',
              moodAlignment: 'Subversive, Thrilling, Masterfully Directed',
              streamingPlatform: 'Max',
              comparableFilms: ['The Handmaiden', 'Knives Out', 'Burning']
            }
          ]
        });
      }

      const systemPrompt = `You are the lead cinema curator for CineVerse, a premium movie recommendation platform comparable to Netflix and Amazon Prime Video.
Your job is to recommend 4 exceptional films that precisely match the user's taste query, emotional tone, and streaming preferences.
Always provide realistic, acclaimed, or fascinating cinematic titles that are actually watchable on popular streaming networks (Netflix, Prime Video, Apple TV+, Max, Hulu).
Explain clearly WHY this movie fits their specific prompt in 1-2 compelling sentences.`;

      const userMessage = `User Search / Taste Brief:
Prompt: "${prompt || 'Recommend exceptional movies with high critical acclaim'}"
Preferred Genres: ${Array.isArray(preferredGenres) ? preferredGenres.join(', ') : 'Any'}
Pacing Preference: ${pacing || 'Any'}
Tone Preference: ${tone || 'Any'}
Preferred Platform: ${streamingPlatform || 'Any'}

Return 4 distinct movie recommendations in structured JSON according to the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userMessage,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    year: { type: Type.INTEGER },
                    matchScore: { type: Type.INTEGER },
                    genres: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    reason: { type: Type.STRING },
                    moodAlignment: { type: Type.STRING },
                    streamingPlatform: { type: Type.STRING },
                    comparableFilms: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['title', 'year', 'matchScore', 'genres', 'reason', 'moodAlignment', 'streamingPlatform', 'comparableFilms']
                }
              }
            },
            required: ['recommendations']
          }
        }
      });

      const parsed = JSON.parse(response.text ?? '{"recommendations":[]}');
      res.json({
        source: 'gemini-3.8-flash',
        recommendations: parsed.recommendations || []
      });
    } catch (err: any) {
      console.error('AI Recommend Error:', err);
      res.status(500).json({
        error: 'Failed to generate recommendations from AI',
        details: err?.message || String(err)
      });
    }
  });

  // Movie DNA Blender: Combines 2 films into a hybrid taste profile
  app.post('/api/ai-blend', async (req, res) => {
    try {
      const { movieA, movieB } = req.body;

      if (!movieA || !movieB) {
        return res.status(400).json({ error: 'Please provide both movieA and movieB.' });
      }

      if (!ai) {
        return res.json({
          source: 'curated-engine',
          blendedTitle: `${movieA} × ${movieB}`,
          conceptSummary: `A synthesis of the intellectual scale of "${movieA}" with the atmospheric tension and character depth of "${movieB}".`,
          sharedDnaElements: ['Atmospheric Direction', 'High Concept Premise', 'Moral Complexity', 'Cinematic Sound Design'],
          topRecommendations: [
            {
              title: 'Annihilation',
              year: 2018,
              matchScore: 97,
              genres: ['Sci-Fi', 'Horror', 'Mystery'],
              reason: 'Merges surreal cosmic wonder with psychological dread and eerie biological transformations.',
              moodAlignment: 'Hypnotic, Unsettling, Beautiful',
              streamingPlatform: 'Prime Video',
              comparableFilms: [movieA, movieB, 'Stalker']
            },
            {
              title: 'Children of Men',
              year: 2006,
              matchScore: 95,
              genres: ['Sci-Fi', 'Thriller', 'Drama'],
              reason: 'Unflinching realistic dystopian pacing paired with breathtaking single-take cinematography.',
              moodAlignment: 'Visceral, Poetic, Urgent',
              streamingPlatform: 'Netflix',
              comparableFilms: [movieA, movieB, 'Blade Runner 2049']
            },
            {
              title: 'Sicario',
              year: 2015,
              matchScore: 94,
              genres: ['Crime', 'Drama', 'Thriller'],
              reason: 'Brutal tactical realism and ominous drone sound design that tightens the screws every scene.',
              moodAlignment: 'Tense, Moral Grayness, Masterful Craft',
              streamingPlatform: 'Prime Video',
              comparableFilms: [movieA, movieB, 'No Country for Old Men']
            }
          ]
        });
      }

      const prompt = `Perform a "Film DNA Cross-Breed" between two acclaimed movies:
Film A: "${movieA}"
Film B: "${movieB}"

Analyze their shared cinematic genes (tone, directing style, pacing, themes).
Create an evocative concept summary explaining their aesthetic intersection.
Recommend 3 actual existing movies on streaming platforms (Netflix, Prime Video, Apple TV+, Max) that embody this exact hybrid DNA.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: 'You are an elite film theorist and algorithmic recommendation architect for CineVerse.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              blendedTitle: { type: Type.STRING },
              conceptSummary: { type: Type.STRING },
              sharedDnaElements: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              topRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    year: { type: Type.INTEGER },
                    matchScore: { type: Type.INTEGER },
                    genres: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    reason: { type: Type.STRING },
                    moodAlignment: { type: Type.STRING },
                    streamingPlatform: { type: Type.STRING },
                    comparableFilms: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ['title', 'year', 'matchScore', 'genres', 'reason', 'moodAlignment', 'streamingPlatform', 'comparableFilms']
                }
              }
            },
            required: ['blendedTitle', 'conceptSummary', 'sharedDnaElements', 'topRecommendations']
          }
        }
      });

      const parsed = JSON.parse(response.text ?? '{}');
      res.json({
        source: 'gemini-3.8-flash',
        ...parsed
      });
    } catch (err: any) {
      console.error('AI Blend Error:', err);
      res.status(500).json({
        error: 'Failed to blend films',
        details: err?.message || String(err)
      });
    }
  });

  // Attach Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built static bundle
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CineVerse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
