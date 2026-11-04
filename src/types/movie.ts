export type StreamingPlatformName = 'Netflix' | 'Prime Video' | 'Apple TV+' | 'Max' | 'Disney+';

export interface PlatformAvailability {
  name: StreamingPlatformName;
  quality: '4K UHD' | 'HD';
  deepLink?: string;
}

export interface CastMember {
  name: string;
  role: string;
}

export type PacingType = 'Slow-Burn' | 'Balanced' | 'High-Octane';
export type ComplexityType = 'Mind-Bending' | 'Layered' | 'Accessible';
export type ToneType = 
  | 'Dark & Gritty' 
  | 'Atmospheric' 
  | 'Thought-Provoking' 
  | 'Inspiring' 
  | 'Adrenaline' 
  | 'Emotional' 
  | 'Witty & Fun';

export interface Movie {
  id: string;
  title: string;
  year: number;
  rating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17' | 'TV-MA' | 'TV-14';
  duration: string;
  matchScore: number;
  imdbRating: number;
  rottenTomatoes: number;
  genres: string[];
  platforms: PlatformAvailability[];
  logline: string;
  synopsis: string;
  director: string;
  cast: CastMember[];
  moodTags: string[];
  pacing: PacingType;
  tone: ToneType;
  complexity: ComplexityType;
  backdropUrl: string;
  posterUrl: string;
  trailerVideoUrl?: string;
  trailerYoutubeId?: string;
  awards?: string;
  whyRecommended: string;
  audioVideo: string[];
}

export interface UserTasteProfile {
  preferredGenres: string[];
  pacingPreference: PacingType | 'Any';
  tonePreference: string | 'Any';
  complexityPreference: ComplexityType | 'Any';
  activePlatform: StreamingPlatformName | 'All';
  watchlist: string[];
  watched: string[];
  ratings: Record<string, 'like' | 'dislike' | 'superlike'>;
}

export interface AiRecommendationItem {
  id?: string;
  title: string;
  year: number;
  matchScore: number;
  genres: string[];
  reason: string;
  moodAlignment: string;
  streamingPlatform: StreamingPlatformName;
  comparableFilms: string[];
}

export interface AiBlendResult {
  blendedTitle: string;
  conceptSummary: string;
  topRecommendations: AiRecommendationItem[];
  sharedDnaElements: string[];
}
