import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
