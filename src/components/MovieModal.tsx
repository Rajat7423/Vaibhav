import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Check, ThumbsUp, Star, Award, Film, ExternalLink, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { Movie } from '../types/movie';

interface MovieModalProps {
  movie: Movie | null;
  onClose: () => void;
  isInWatchlist: boolean;
  onToggleWatchlist: (movieId: string) => void;
  isLiked?: boolean;
  onToggleLike?: (movieId: string) => void;
  allMovies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const MovieModal: React.FC<MovieModalProps> = ({
  movie,
  onClose,
  isInWatchlist,
  onToggleWatchlist,
  isLiked,
  onToggleLike,
  allMovies,
  onSelectMovie
}) => {
  const [isPlayingTrailer, setIsPlayingTrailer] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsPlayingTrailer(false);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movie, onClose]);

  if (!movie) return null;

  const similarMovies = allMovies
    .filter((m) => m.id !== movie.id && m.genres.some((g) => movie.genres.includes(g)))
    .slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-4xl bg-[#0D0E15] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer border border-zinc-700/60"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Scrollable Container */}
        <div className="overflow-y-auto overflow-x-hidden">
          {/* Header Video / Backdrop area */}
          <div className="relative aspect-video w-full bg-black overflow-hidden max-h-[460px]">
            {isPlayingTrailer && movie.trailerVideoUrl ? (
              <video
                src={movie.trailerVideoUrl}
                autoPlay
                controls
                muted={isMuted}
                className="w-full h-full object-cover"
              />
            ) : (
              <>
                <img
                  src={movie.backdropUrl}
                  alt={movie.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0D0E15] via-[#0D0E15]/30 to-transparent" />
                
                {/* Play Trailer Floating Trigger */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <button
                    onClick={() => setIsPlayingTrailer(true)}
                    className="p-4 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white shadow-2xl transition-transform hover:scale-110 flex items-center justify-center cursor-pointer"
                    title="Play Official Trailer"
                  >
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </button>
                  <span className="text-xs font-semibold tracking-wider uppercase text-zinc-200 drop-shadow">
                    Play Preview Trailer
                  </span>
                </div>
              </>
            )}

            {/* Bottom Floating Title Strip */}
            <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between pointer-events-none">
              <div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-lg">
                  {movie.title}
                </h2>
              </div>
              <div className="pointer-events-auto">
                {isPlayingTrailer && (
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 rounded-full bg-zinc-900/80 border border-zinc-700 text-zinc-300 hover:text-white"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-rose-400" />}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body Information Section */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Metadata Bar & Primary CTAs */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
              {/* Left: Metadata list with typographic separators */}
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-zinc-300">
                <span className="text-emerald-400 font-bold">{movie.matchScore}% Match</span>
                <span aria-hidden="true">·</span>
                <span>{movie.year}</span>
                <span aria-hidden="true">·</span>
                <span className="px-1.5 py-0.2 border border-zinc-700 rounded text-xs font-mono">
                  {movie.rating}
                </span>
                <span aria-hidden="true">·</span>
                <span>{movie.duration}</span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{movie.imdbRating} IMDb</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400 font-medium">
                  {movie.rottenTomatoes}% RT
                </span>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => onToggleWatchlist(movie.id)}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border ${
                    isInWatchlist
                      ? 'bg-rose-950/40 text-rose-300 border-rose-800/80'
                      : 'bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700'
                  }`}
                >
                  {isInWatchlist ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isInWatchlist ? 'Watchlisted' : 'Add to Watchlist'}</span>
                </button>

                {onToggleLike && (
                  <button
                    onClick={() => onToggleLike(movie.id)}
                    className={`p-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      isLiked
                        ? 'bg-rose-950/40 text-rose-400 border-rose-800'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                    }`}
                    title={isLiked ? 'Liked' : 'Rate Thumbs Up'}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-rose-500' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Audio / Video Formats */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
              <span className="text-zinc-500 font-medium">Stream Quality:</span>
              {movie.audioVideo.map((item, idx) => (
                <span key={item} className="px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700/60 font-mono text-zinc-300">
                  {item}
                </span>
              ))}
            </div>

            {/* AI Recommendation Reasoning Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/20 via-zinc-900 to-zinc-900 border border-rose-900/30 text-xs sm:text-sm text-zinc-300 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-400">
                <Sparkles className="w-4 h-4" />
                <span>Why CineVerse Curators Recommend This</span>
              </div>
              <p className="leading-relaxed text-zinc-200">
                {movie.whyRecommended}
              </p>
              <div className="pt-1 text-[11px] text-zinc-400 flex items-center gap-2">
                <span>Pacing: <strong className="text-zinc-200">{movie.pacing}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Tone: <strong className="text-zinc-200">{movie.tone}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Complexity: <strong className="text-zinc-200">{movie.complexity}</strong></span>
              </div>
            </div>

            {/* Two column grid: Synopsis vs Cast & Director */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                  Storyline
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {movie.synopsis}
                </p>

                {movie.awards && (
                  <div className="flex items-center gap-2 pt-2 text-xs text-amber-300/90 font-medium">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>{movie.awards}</span>
                  </div>
                )}
              </div>

              {/* Cast & Director */}
              <div className="space-y-4 text-xs text-zinc-300 border-l border-zinc-800/80 pl-0 md:pl-6">
                <div>
                  <span className="text-zinc-500 block mb-1">Director</span>
                  <span className="font-semibold text-white">{movie.director}</span>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Cast</span>
                  <div className="space-y-1.5">
                    {movie.cast.map((actor) => (
                      <div key={actor.name} className="flex justify-between text-zinc-300">
                        <span className="font-medium text-white">{actor.name}</span>
                        <span className="text-zinc-500 truncate ml-2">{actor.role}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 block mb-1">Where to Watch</span>
                  <div className="flex flex-col gap-1.5">
                    {movie.platforms.map((plat) => (
                      <div
                        key={plat.name}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs"
                      >
                        <span className="font-semibold text-white">{plat.name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{plat.quality} Included</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Similar Titles Shelf */}
            {similarMovies.length > 0 && (
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <h3 className="text-sm font-bold text-white tracking-tight">
                  More Like This
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {similarMovies.map((sim) => (
                    <div
                      key={sim.id}
                      onClick={() => onSelectMovie(sim)}
                      className="group/sim p-2.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex gap-3 items-center"
                    >
                      <img
                        src={sim.backdropUrl}
                        alt={sim.title}
                        referrerPolicy="no-referrer"
                        className="w-16 h-12 object-cover rounded-md shrink-0 group-hover/sim:scale-105 transition-transform"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover/sim:text-rose-400 truncate">
                          {sim.title}
                        </h4>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                          <span className="text-emerald-400">{sim.matchScore}%</span>
                          <span>·</span>
                          <span>{sim.year}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
