import { AiRecommendationItem, AiBlendResult, StreamingPlatformName } from '../types/movie';

export interface RecommendParams {
  prompt: string;
  preferredGenres?: string[];
  pacing?: string;
  tone?: string;
  streamingPlatform?: StreamingPlatformName | 'All';
}

export async function fetchAiRecommendations(params: RecommendParams): Promise<{
  source: string;
  recommendations: AiRecommendationItem[];
}> {
  try {
    const res = await fetch('/api/ai-recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('API error, using local recommendation fallback:', err);
    return {
      source: 'offline-curator',
      recommendations: [
        {
          title: 'Arrival',
          year: 2016,
          matchScore: 98,
          genres: ['Sci-Fi', 'Mystery', 'Drama'],
          reason: 'Matches your interest in deeply intelligent science fiction with emotional weight and an unforgettable non-linear puzzle.',
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
        }
      ]
    };
  }
}

export async function fetchFilmBlend(movieA: string, movieB: string): Promise<AiBlendResult> {
  try {
    const res = await fetch('/api/ai-blend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieA, movieB }),
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn('API error, using fallback blend:', err);
    return {
      blendedTitle: `${movieA} × ${movieB}`,
      conceptSummary: `A synthesis blending the conceptual ambition of "${movieA}" with the visceral mood and narrative tension of "${movieB}".`,
      sharedDnaElements: ['Atmospheric Direction', 'High Concept Premise', 'Moral Ambiguity', 'Soundtrack Mastery'],
      topRecommendations: [
        {
          title: 'Annihilation',
          year: 2018,
          matchScore: 97,
          genres: ['Sci-Fi', 'Horror', 'Mystery'],
          reason: 'Surreal visual beauty paired with psychological dread and existential curiosity.',
          moodAlignment: 'Hypnotic, Unsettling, Beautiful',
          streamingPlatform: 'Prime Video',
          comparableFilms: [movieA, movieB, 'Stalker']
        },
        {
          title: 'Children of Men',
          year: 2006,
          matchScore: 95,
          genres: ['Sci-Fi', 'Thriller', 'Drama'],
          reason: 'Bracing procedural tension with breathtaking single-take cinematography.',
          moodAlignment: 'Visceral, Poetic, Urgent',
          streamingPlatform: 'Netflix',
          comparableFilms: [movieA, movieB, 'Blade Runner 2049']
        }
      ]
    };
  }
}
