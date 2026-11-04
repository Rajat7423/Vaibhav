import React from 'react';
import { Sliders, RefreshCw, Sparkles, Filter } from 'lucide-react';
import { Movie, PacingType, ToneType, ComplexityType, StreamingPlatformName } from '../types/movie';
import { GENRES_LIST } from '../data/moviesData';
import { MovieCard } from './MovieCard';

interface TasteDnaMixerProps {
  allMovies: Movie[];
  onOpenDetails: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string) => void;
  likedMovies: Record<string, 'like' | 'dislike' | 'superlike'>;
  onToggleLike: (movieId: string) => void;
}

const TONES: ToneType[] = [
  'Dark & Gritty',
  'Atmospheric',
  'Thought-Provoking',
  'Inspiring',
  'Adrenaline',
  'Emotional',
  'Witty & Fun'
];

export const TasteDnaMixer: React.FC<TasteDnaMixerProps> = ({
  allMovies,
  onOpenDetails,
  onPlayTrailer,
  watchlist,
  onToggleWatchlist,
  likedMovies,
  onToggleLike
}) => {
  const [selectedPacing, setSelectedPacing] = React.useState<PacingType | 'Any'>('Any');
  const [selectedTone, setSelectedTone] = React.useState<ToneType | 'Any'>('Any');
  const [selectedComplexity, setSelectedComplexity] = React.useState<ComplexityType | 'Any'>('Any');
  const [selectedGenre, setSelectedGenre] = React.useState<string>('All Genres');
  const [selectedPlatform, setSelectedPlatform] = React.useState<StreamingPlatformName | 'All'>('All');

  const resetFilters = () => {
    setSelectedPacing('Any');
    setSelectedTone('Any');
    setSelectedComplexity('Any');
    setSelectedGenre('All Genres');
    setSelectedPlatform('All');
  };

  // Score movies dynamically based on current slider / preference vectors
  const rankedMovies = React.useMemo(() => {
    return allMovies
      .map((movie) => {
        let score = movie.matchScore;

        // Platform filter check
        if (selectedPlatform !== 'All') {
          const hasPlatform = movie.platforms.some((p) => p.name === selectedPlatform);
          if (!hasPlatform) return { movie, calculatedScore: 0 };
        }

        // Genre filter check
        if (selectedGenre !== 'All Genres') {
          if (!movie.genres.includes(selectedGenre)) {
            score -= 20;
          } else {
            score += 4;
          }
        }

        // Pacing match
        if (selectedPacing !== 'Any') {
          if (movie.pacing === selectedPacing) {
            score += 5;
          } else {
            score -= 10;
          }
        }

        // Tone match
        if (selectedTone !== 'Any') {
          if (movie.tone === selectedTone) {
            score += 6;
          } else {
            score -= 8;
          }
        }

        // Complexity match
        if (selectedComplexity !== 'Any') {
          if (movie.complexity === selectedComplexity) {
            score += 5;
          } else {
            score -= 8;
          }
        }

        // User like bonus
        if (likedMovies[movie.id] === 'like') {
          score += 10;
        }

        const clamped = Math.max(50, Math.min(99, score));
        return { movie, calculatedScore: clamped };
      })
      .filter((item) => item.calculatedScore > 0)
      .sort((a, b) => b.calculatedScore - a.calculatedScore);
  }, [allMovies, selectedPacing, selectedTone, selectedComplexity, selectedGenre, selectedPlatform, likedMovies]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Interactive Algorithmic Synthesizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Taste Matrix & DNA Tuner
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
            Fine-tune narrative velocity, philosophical complexity, and atmospheric tone. CineVerse dynamically recalculates matching scores in real-time.
          </p>
        </div>

        <button
          onClick={resetFilters}
          className="self-start md:self-auto px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Parameters</span>
        </button>
      </div>

      {/* Control Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800">
        {/* Control 1: Pacing */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">
            Pacing Velocity
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            {(['Any', 'Slow-Burn', 'Balanced', 'High-Octane'] as const).map((pace) => (
              <button
                key={pace}
                onClick={() => setSelectedPacing(pace)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer truncate ${
                  selectedPacing === pace
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {pace}
              </button>
            ))}
          </div>
        </div>

        {/* Control 2: Complexity */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">
            Narrative Complexity
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            {(['Any', 'Accessible', 'Layered', 'Mind-Bending'] as const).map((comp) => (
              <button
                key={comp}
                onClick={() => setSelectedComplexity(comp)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer truncate ${
                  selectedComplexity === comp
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {comp}
              </button>
            ))}
          </div>
        </div>

        {/* Control 3: Platform */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">
            Streaming Platform
          </label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-800">
            {(['All', 'Netflix', 'Prime Video', 'Apple TV+'] as const).map((plat) => (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer truncate ${
                  selectedPlatform === plat
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {plat}
              </button>
            ))}
          </div>
        </div>

        {/* Control 4: Genre */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300 block">
            Primary Genre
          </label>
          <select
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-rose-500 cursor-pointer"
          >
            {GENRES_LIST.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Tone Selector Pill Ribbon */}
        <div className="col-span-full pt-2 border-t border-zinc-800/80 space-y-2">
          <span className="text-xs font-semibold text-zinc-300 block">
            Atmospheric Tone & Mood:
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedTone('Any')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                selectedTone === 'Any'
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
              }`}
            >
              Any Tone
            </button>
            {TONES.map((tone) => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedTone === tone
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white'
                }`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Recommendation Results Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-bold text-white text-sm">
            {rankedMovies.length} Calibrated Matches
          </span>
          <span>Sorted by Re-computed Match Vector</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {rankedMovies.map(({ movie, calculatedScore }) => {
            const displayMovie = { ...movie, matchScore: calculatedScore };
            return (
              <MovieCard
                key={movie.id}
                movie={displayMovie}
                onOpenDetails={onOpenDetails}
                onPlayTrailer={onPlayTrailer}
                isInWatchlist={watchlist.includes(movie.id)}
                onToggleWatchlist={onToggleWatchlist}
                isLiked={likedMovies[movie.id] === 'like'}
                onToggleLike={onToggleLike}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
