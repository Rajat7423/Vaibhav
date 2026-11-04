import React, { useState } from 'react';
import { Sparkles, Dna, ArrowRight, Loader2, Plus, Check } from 'lucide-react';
import { Movie, AiBlendResult } from '../types/movie';
import { fetchFilmBlend } from '../services/geminiService';

interface MovieBlenderProps {
  allMovies: Movie[];
  onOpenDetails: (movie: Movie) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string) => void;
}

export const MovieBlender: React.FC<MovieBlenderProps> = ({
  allMovies,
  onOpenDetails,
  watchlist,
  onToggleWatchlist
}) => {
  const [movieAId, setMovieAId] = useState<string>(allMovies[0]?.id || '');
  const [movieBId, setMovieBId] = useState<string>(allMovies[1]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [blendResult, setBlendResult] = useState<AiBlendResult | null>(null);

  const movieA = allMovies.find((m) => m.id === movieAId) || allMovies[0];
  const movieB = allMovies.find((m) => m.id === movieBId) || allMovies[1];

  const handleBlend = async () => {
    if (!movieA || !movieB) return;
    setIsLoading(true);
    try {
      const data = await fetchFilmBlend(movieA.title, movieB.title);
      setBlendResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div className="border-b border-zinc-800 pb-6 space-y-1">
        <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
          <Dna className="w-4 h-4" />
          <span>Cross-Breed Cinema Synthesis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Film DNA Blender
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-xl">
          Select any two movies to splice their directorial genes, thematic DNA, and tonal pacing. Gemini 3.8 Flash synthesizes the hybrid offspring.
        </p>
      </div>

      {/* Film Selection Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {/* Parent Film A */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
              Film Chromosome Alpha
            </span>
            <select
              value={movieAId}
              onChange={(e) => setMovieAId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none focus:border-rose-500 cursor-pointer"
            >
              {allMovies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.year} · {m.director})
                </option>
              ))}
            </select>
          </div>

          {movieA && (
            <div className="space-y-3 pt-2">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative">
                <img
                  src={movieA.backdropUrl}
                  alt={movieA.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-xs text-zinc-200 font-medium">
                  {movieA.genres.join(' · ')}
                </div>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {movieA.logline}
              </p>
            </div>
          )}
        </div>

        {/* Parent Film B */}
        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
              Film Chromosome Beta
            </span>
            <select
              value={movieBId}
              onChange={(e) => setMovieBId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium outline-none focus:border-rose-500 cursor-pointer"
            >
              {allMovies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.year} · {m.director})
                </option>
              ))}
            </select>
          </div>

          {movieB && (
            <div className="space-y-3 pt-2">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black relative">
                <img
                  src={movieB.backdropUrl}
                  alt={movieB.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-xs text-zinc-200 font-medium">
                  {movieB.genres.join(' · ')}
                </div>
              </div>
              <p className="text-xs text-zinc-400 line-clamp-2">
                {movieB.logline}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Blend Action Trigger */}
      <div className="flex justify-center">
        <button
          onClick={handleBlend}
          disabled={isLoading || movieAId === movieBId}
          className="px-8 py-3 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:opacity-95 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-xl shadow-rose-950/40 transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Synthesizing Film DNA...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Splice & Blend Films</span>
            </>
          )}
        </button>
      </div>

      {/* Blend Results */}
      {blendResult && (
        <div className="p-6 sm:p-8 rounded-2xl bg-zinc-900 border border-rose-900/40 shadow-2xl space-y-6 animate-fadeIn">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-rose-400">
              Synthesized Offspring Premise
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {blendResult.blendedTitle}
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
              {blendResult.conceptSummary}
            </p>
          </div>

          {/* Shared DNA Traits */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-400">
              Shared Genetic Traits:
            </span>
            <div className="flex flex-wrap gap-2">
              {blendResult.sharedDnaElements.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-medium text-rose-300"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          {/* Matching Films to Watch Now */}
          <div className="space-y-3 pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-bold text-white">
              Recommended Hybrid Films Available on Streaming:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {blendResult.topRecommendations.map((rec) => {
                const matchedDbMovie = allMovies.find(
                  (m) => m.title.toLowerCase().includes(rec.title.toLowerCase()) ||
                         rec.title.toLowerCase().includes(m.title.toLowerCase())
                );
                const isWatchlisted = matchedDbMovie ? watchlist.includes(matchedDbMovie.id) : false;

                return (
                  <div
                    key={rec.title}
                    className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          onClick={() => matchedDbMovie && onOpenDetails(matchedDbMovie)}
                          className={`text-sm font-bold text-white ${
                            matchedDbMovie ? 'hover:text-rose-400 cursor-pointer' : ''
                          }`}
                        >
                          {rec.title}
                        </h4>

                        {matchedDbMovie && (
                          <button
                            onClick={() => onToggleWatchlist(matchedDbMovie.id)}
                            className={`p-1 rounded cursor-pointer ${
                              isWatchlisted ? 'text-rose-400' : 'text-zinc-500 hover:text-white'
                            }`}
                          >
                            {isWatchlisted ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </button>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                        <span className="text-emerald-400 font-bold">{rec.matchScore}% Match</span>
                        <span>·</span>
                        <span>{rec.year}</span>
                        <span>·</span>
                        <span className="text-zinc-300">{rec.streamingPlatform}</span>
                      </div>

                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {rec.reason}
                      </p>
                    </div>

                    <div className="text-[10px] text-zinc-500 italic truncate">
                      Mood: {rec.moodAlignment}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
