import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../types/movie';
import { MovieCard } from './MovieCard';

interface MovieShelfProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onOpenDetails: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string) => void;
  likedMovies?: Record<string, 'like' | 'dislike' | 'superlike'>;
  onToggleLike?: (movieId: string) => void;
  watchProgress?: Record<string, number>;
}

export const MovieShelf: React.FC<MovieShelfProps> = ({
  title,
  subtitle,
  movies,
  onOpenDetails,
  onPlayTrailer,
  watchlist,
  onToggleWatchlist,
  likedMovies,
  onToggleLike,
  watchProgress
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = direction === 'left' ? -680 : 680;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="relative py-4 space-y-3 group/shelf">
      {/* Shelf Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5 font-normal">
              {subtitle}
            </p>
          )}
        </div>

        {/* Desktop Carousel Controls */}
        <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover/shelf:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={rowRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4 sm:px-6 lg:px-8 pb-3"
      >
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            onOpenDetails={onOpenDetails}
            onPlayTrailer={onPlayTrailer}
            isInWatchlist={watchlist.includes(movie.id)}
            onToggleWatchlist={onToggleWatchlist}
            isLiked={likedMovies?.[movie.id] === 'like'}
            onToggleLike={onToggleLike}
            watchProgress={watchProgress?.[movie.id]}
          />
        ))}
      </div>
    </div>
  );
};
