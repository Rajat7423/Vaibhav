import React, { useState } from 'react';
import { Play, Plus, Check, Info, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { Movie } from '../types/movie';

interface HeroBillboardProps {
  movie: Movie;
  onOpenDetails: (movie: Movie) => void;
  onPlayTrailer: (movie: Movie) => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (movieId: string) => void;
}

export const HeroBillboard: React.FC<HeroBillboardProps> = ({
  movie,
  onOpenDetails,
  onPlayTrailer,
  isInWatchlist,
  onToggleWatchlist
}) => {
  const [isMuted, setIsMuted] = useState(true);

  return (
    <div className="relative w-full h-[78vh] min-h-[580px] max-h-[860px] overflow-hidden select-none">
      {/* Background Image / Backdrop */}
      <img
        src={movie.backdropUrl}
        alt={movie.title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
      />

      {/* Cinematic Scrims (Measured contrast scrim for WCAG compliance) */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090D] via-[#08090D]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090D] via-[#08090D]/75 to-transparent w-full md:w-3/4" />
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#08090D]/80 to-transparent" />

      {/* Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-20 md:pb-24">
        <div className="max-w-2xl space-y-4">
          {/* Platform & Quality indicator */}
          <div className="flex items-center gap-2.5 text-xs text-zinc-300">
            <span className="font-semibold tracking-wider text-rose-500 uppercase text-[11px]">
              Spotlight Feature
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-semibold">{movie.matchScore}% Match</span>
            <span aria-hidden="true">·</span>
            <span>{movie.year}</span>
            <span aria-hidden="true">·</span>
            <span>{movie.duration}</span>
            <span aria-hidden="true">·</span>
            <span className="px-1.5 py-0.2 border border-zinc-600 rounded text-[10px] text-zinc-300">
              {movie.rating}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-zinc-400">4K Ultra HD</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none text-balance drop-shadow-md">
            {movie.title}
          </h1>

          {/* Unboxed Genres metadata */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
            {movie.genres.map((genre, idx) => (
              <React.Fragment key={genre}>
                <span>{genre}</span>
                {idx < movie.genres.length - 1 && <span aria-hidden="true">·</span>}
              </React.Fragment>
            ))}
            <span aria-hidden="true">·</span>
            <span className="text-zinc-300 font-normal">Dir. {movie.director}</span>
          </div>

          {/* Logline */}
          <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
            {movie.logline}
          </p>

          {/* AI Match Insight Callout */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm max-w-xl text-xs text-zinc-300">
            <Sparkles className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="text-white font-medium">Cinephile Match Reason:</strong>{' '}
              {movie.whyRecommended}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlayTrailer(movie)}
              className="px-6 py-2.5 bg-white text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 shadow-lg shadow-black/40 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-zinc-950" />
              <span>Trailer Preview</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(movie.id)}
              className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 cursor-pointer border ${
                isInWatchlist
                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/80'
                  : 'bg-zinc-900/80 text-white border-zinc-700/80 hover:bg-zinc-800'
              }`}
            >
              {isInWatchlist ? <Check className="w-4 h-4 text-rose-400" /> : <Plus className="w-4 h-4" />}
              <span>{isInWatchlist ? 'In Watchlist' : 'Watchlist'}</span>
            </button>

            <button
              onClick={() => onOpenDetails(movie)}
              className="px-5 py-2.5 bg-zinc-800/80 hover:bg-zinc-700/90 text-zinc-200 font-medium text-sm rounded-lg transition-colors flex items-center gap-2 border border-zinc-700/60 cursor-pointer"
            >
              <Info className="w-4 h-4" />
              <span>Details & Cast</span>
            </button>

            {/* Audio Ambience Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute trailer atmosphere' : 'Mute trailer atmosphere'}
              className="ml-auto p-2.5 rounded-full bg-zinc-900/70 border border-zinc-700/60 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
