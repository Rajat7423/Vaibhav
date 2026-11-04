import React from 'react';
import { Play, Plus, Check, Info, ThumbsUp, Star } from 'lucide-react';
import { Movie } from '../types/movie';

interface MovieCardProps {
  movie: Movie;
  onOpenDetails: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (movieId: string) => void;
  isLiked?: boolean;
  onToggleLike?: (movieId: string) => void;
  watchProgress?: number;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  onOpenDetails,
  onPlayTrailer,
  isInWatchlist,
  onToggleWatchlist,
  isLiked,
  onToggleLike,
  watchProgress
}) => {
  return (
    <div className="group relative flex-none w-[260px] sm:w-[290px] md:w-[320px] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 hover:shadow-2xl hover:shadow-rose-950/20 hover:-translate-y-1">
      {/* Thumbnail Aspect 16:9 */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        <img
          src={movie.backdropUrl}
          alt={movie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Subtle bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />

        {/* Platform badge on card top right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-950/80 backdrop-blur-md border border-zinc-800 text-[10px] font-semibold text-zinc-200">
          <span>{movie.platforms[0]?.name || 'Stream'}</span>
        </div>

        {/* Quick Play Overlay Button */}
        <button
          onClick={() => onPlayTrailer(movie)}
          title="Play Trailer Preview"
          className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-rose-600/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 scale-75 group-hover:scale-100 shadow-xl cursor-pointer hover:bg-rose-500"
        >
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </button>

        {/* Visual Progress Bar (Netflix/Prime style) */}
        {watchProgress !== undefined && watchProgress > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-zinc-950/80 z-20 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                watchProgress >= 100 ? 'bg-emerald-500' : 'bg-rose-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, watchProgress))}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-3.5 space-y-2">
        {/* Title and Action bar */}
        <div className="flex items-start justify-between gap-2">
          <h3
            onClick={() => onOpenDetails(movie)}
            className="text-sm font-bold text-white hover:text-rose-400 transition-colors line-clamp-1 cursor-pointer"
          >
            {movie.title}
          </h3>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleWatchlist(movie.id)}
              title={isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isInWatchlist
                  ? 'text-rose-400 bg-rose-950/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>

            {onToggleLike && (
              <button
                onClick={() => onToggleLike(movie.id)}
                title={isLiked ? 'Liked' : 'Rate this'}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  isLiked
                    ? 'text-rose-500 bg-rose-950/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500' : ''}`} />
              </button>
            )}

            <button
              onClick={() => onOpenDetails(movie)}
              title="More Details"
              className="p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Unboxed Metadata metrics with separators */}
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <span className="text-emerald-400 font-bold">{movie.matchScore}% Match</span>
          <span aria-hidden="true">·</span>
          <span>{movie.year}</span>
          <span aria-hidden="true">·</span>
          <span className="text-zinc-500">{movie.duration}</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-0.5 text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{movie.imdbRating}</span>
          </span>
        </div>

        {/* Unboxed Genres list (NO PILLS) */}
        <div className="text-[11px] text-zinc-400 truncate">
          {movie.genres.join(' · ')}
        </div>

        {/* Mood Tags */}
        <div className="text-[10px] text-zinc-500 truncate italic">
          {movie.moodTags.slice(0, 2).join(' · ')}
        </div>
      </div>
    </div>
  );
};
