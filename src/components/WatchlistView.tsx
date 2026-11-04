import React, { useState } from 'react';
import { Bookmark, CheckCircle2, Play, Trash2, Film, RotateCcw, Clock } from 'lucide-react';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface WatchlistViewProps {
  allMovies: Movie[];
  watchlist: string[];
  watched: string[];
  watchProgress: Record<string, number>;
  onUpdateProgress: (movieId: string, progress: number) => void;
  onToggleWatchlist: (movieId: string) => void;
  onToggleWatched: (movieId: string) => void;
  onOpenDetails: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  likedMovies: Record<string, 'like' | 'dislike' | 'superlike'>;
  onToggleLike: (movieId: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  allMovies,
  watchlist,
  watched,
  watchProgress,
  onUpdateProgress,
  onToggleWatchlist,
  onToggleWatched,
  onOpenDetails,
  onPlayTrailer,
  likedMovies,
  onToggleLike
}) => {
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'unwatched' | 'watched' | 'netflix' | 'prime'>('all');

  const savedMovies = allMovies.filter((m) => watchlist.includes(m.id));

  const filteredMovies = savedMovies.filter((m) => {
    const prog = watchProgress[m.id] ?? (watched.includes(m.id) ? 100 : 0);
    if (filter === 'in-progress') return prog > 0 && prog < 100;
    if (filter === 'unwatched') return prog === 0 && !watched.includes(m.id);
    if (filter === 'watched') return prog === 100 || watched.includes(m.id);
    if (filter === 'netflix') return m.platforms.some((p) => p.name === 'Netflix');
    if (filter === 'prime') return m.platforms.some((p) => p.name === 'Prime Video');
    return true;
  });

  // Calculate taste & watching statistics
  const topGenres = React.useMemo(() => {
    const counts: Record<string, number> = {};
    savedMovies.forEach((m) => {
      m.genres.forEach((g) => {
        counts[g] = (counts[g] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([g]) => g);
  }, [savedMovies]);

  const inProgressCount = savedMovies.filter((m) => {
    const p = watchProgress[m.id] ?? (watched.includes(m.id) ? 100 : 0);
    return p > 0 && p < 100;
  }).length;

  const completedCount = savedMovies.filter((m) => {
    const p = watchProgress[m.id] ?? (watched.includes(m.id) ? 100 : 0);
    return p === 100 || watched.includes(m.id);
  }).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Bookmark className="w-4 h-4" />
            <span>Curated Collection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My Watchlist & Progress
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Track playback completion, resume where you left off, and adjust finish percentages manually.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            All ({savedMovies.length})
          </button>
          <button
            onClick={() => setFilter('in-progress')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'in-progress' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            onClick={() => setFilter('unwatched')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'unwatched' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Unstarted
          </button>
          <button
            onClick={() => setFilter('watched')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'watched' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Finished ({completedCount})
          </button>
          <button
            onClick={() => setFilter('netflix')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'netflix' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Netflix
          </button>
          <button
            onClick={() => setFilter('prime')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              filter === 'prime' ? 'bg-rose-600 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Prime Video
          </button>
        </div>
      </div>

      {/* Taste & Progress Stats Row */}
      {savedMovies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Watchlist Queue</span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">{savedMovies.length}</span>
            <span className="text-xs text-zinc-400 block">Total saved films</span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">In Progress</span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{inProgressCount}</span>
            <span className="text-xs text-zinc-400 block">Mid-stream playback</span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Completed</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{completedCount}</span>
            <span className="text-xs text-zinc-400 block">100% finished</span>
          </div>
          <div>
            <span className="text-[11px] text-zinc-500 uppercase tracking-wider block">Favorite Genre</span>
            <span className="text-sm sm:text-base font-bold text-white truncate block">
              {topGenres[0] || 'Eclectic'}
            </span>
            <span className="text-xs text-zinc-400 block">Top affinity gene</span>
          </div>
        </div>
      )}

      {/* Grid of Saved Movies with Progress Sliders */}
      {filteredMovies.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Film className="w-10 h-10 mx-auto text-zinc-600" />
          <h3 className="text-base font-bold text-zinc-300">
            {savedMovies.length === 0
              ? 'Your Watchlist is empty'
              : 'No movies match this filter'}
          </h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Browse our curated recommendations, explore the AI Cinephile Matchmaker, or click the bookmark button on any movie card to add it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
          {filteredMovies.map((movie) => {
            const currentProgress = watchProgress[movie.id] ?? (watched.includes(movie.id) ? 100 : 0);
            const isCompleted = currentProgress === 100 || watched.includes(movie.id);

            return (
              <div
                key={movie.id}
                className="flex flex-col rounded-2xl bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 transition-all overflow-hidden shadow-lg"
              >
                {/* Movie Card with Visual Thumbnail Progress Bar */}
                <MovieCard
                  movie={movie}
                  onOpenDetails={onOpenDetails}
                  onPlayTrailer={onPlayTrailer}
                  isInWatchlist={true}
                  onToggleWatchlist={onToggleWatchlist}
                  isLiked={likedMovies[movie.id] === 'like'}
                  onToggleLike={onToggleLike}
                  watchProgress={currentProgress}
                />

                {/* Progress Control & Tracker Pane */}
                <div className="p-3.5 space-y-3 bg-zinc-950/60 border-t border-zinc-800/80">
                  {/* Progress Header Status */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-zinc-300">Completion</span>
                    </div>

                    <div className="font-mono text-xs font-bold">
                      {isCompleted ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Finished (100%)</span>
                        </span>
                      ) : currentProgress > 0 ? (
                        <span className="text-rose-400">
                          {currentProgress}% watched
                        </span>
                      ) : (
                        <span className="text-zinc-500">Not started (0%)</span>
                      )}
                    </div>
                  </div>

                  {/* Manual Completion Slider */}
                  <div className="space-y-1.5">
                    <div className="relative flex items-center">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={currentProgress}
                        onChange={(e) => onUpdateProgress(movie.id, Number(e.target.value))}
                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                        aria-label={`Completion percentage for ${movie.title}`}
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center justify-between gap-1 pt-0.5 text-[10px] text-zinc-400 font-mono">
                      <button
                        onClick={() => onUpdateProgress(movie.id, 0)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          currentProgress === 0
                            ? 'bg-zinc-800 text-white font-bold'
                            : 'hover:text-zinc-200'
                        }`}
                        title="Reset to 0%"
                      >
                        0%
                      </button>
                      <button
                        onClick={() => onUpdateProgress(movie.id, 25)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          currentProgress === 25
                            ? 'bg-zinc-800 text-rose-400 font-bold'
                            : 'hover:text-zinc-200'
                        }`}
                        title="Set to 25%"
                      >
                        25%
                      </button>
                      <button
                        onClick={() => onUpdateProgress(movie.id, 50)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          currentProgress === 50
                            ? 'bg-zinc-800 text-rose-400 font-bold'
                            : 'hover:text-zinc-200'
                        }`}
                        title="Set to 50% (Halfway)"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => onUpdateProgress(movie.id, 75)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          currentProgress === 75
                            ? 'bg-zinc-800 text-rose-400 font-bold'
                            : 'hover:text-zinc-200'
                        }`}
                        title="Set to 75%"
                      >
                        75%
                      </button>
                      <button
                        onClick={() => onUpdateProgress(movie.id, 100)}
                        className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                          currentProgress === 100
                            ? 'bg-emerald-950/60 text-emerald-400 font-bold border border-emerald-800/60'
                            : 'hover:text-emerald-300'
                        }`}
                        title="Mark 100% Finished"
                      >
                        100%
                      </button>
                    </div>
                  </div>

                  {/* Actions row: Mark Finished / Reset & Remove */}
                  <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                    <button
                      onClick={() => onToggleWatched(movie.id)}
                      className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                        isCompleted
                          ? 'text-emerald-400 font-semibold hover:text-emerald-300'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isCompleted ? 'Finished' : 'Mark as Finished'}</span>
                    </button>

                    <button
                      onClick={() => onToggleWatchlist(movie.id)}
                      title="Remove from queue"
                      className="text-zinc-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
