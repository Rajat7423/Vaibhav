import React, { useState } from 'react';
import { X, Sparkles, Film, ArrowRight, Loader2, Check, Plus, AlertCircle } from 'lucide-react';
import { AiRecommendationItem, StreamingPlatformName, Movie } from '../types/movie';
import { MOOD_SEEDS } from '../data/moviesData';
import { fetchAiRecommendations } from '../services/geminiService';

interface AiRecommenderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMovieTitle: (title: string) => void;
  watchlist: string[];
  onToggleWatchlist: (movieId: string) => void;
  allMovies: Movie[];
}

export const AiRecommenderModal: React.FC<AiRecommenderModalProps> = ({
  isOpen,
  onClose,
  onSelectMovieTitle,
  watchlist,
  onToggleWatchlist,
  allMovies
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatformName | 'All'>('All');
  const [selectedPacing, setSelectedPacing] = useState<string>('Any');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AiRecommendationItem[]>([]);
  const [hasQueried, setHasQueried] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (overridePrompt?: string) => {
    const queryToUse = overridePrompt !== undefined ? overridePrompt : prompt;
    if (!queryToUse.trim()) return;

    setIsLoading(true);
    setHasQueried(true);
    try {
      const data = await fetchAiRecommendations({
        prompt: queryToUse,
        streamingPlatform: selectedPlatform,
        pacing: selectedPacing !== 'Any' ? selectedPacing : undefined
      });
      setResults(data.recommendations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedClick = (seedPrompt: string) => {
    setPrompt(seedPrompt);
    handleSearch(seedPrompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div
        className="relative w-full max-w-3xl bg-[#0D0E15] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl text-slate-100 max-h-[92vh] flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Gemini 3.8 Flash Cinephile AI</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              AI Taste Matchmaker
            </h2>
            <p className="text-xs text-zinc-400">
              Describe your exact movie craving, mood, or combination of films you enjoyed.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Natural Input Box */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                rows={3}
                placeholder="e.g. 'I want a mind-bending sci-fi mystery like Arrival and Inception, but with gorgeous cinematography and high stakes on Netflix or Prime...'"
                className="w-full bg-zinc-900 border border-zinc-700/80 focus:border-rose-500 rounded-xl p-3.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors resize-none leading-relaxed"
              />
              <button
                onClick={() => handleSearch()}
                disabled={isLoading || !prompt.trim()}
                className="absolute right-3 bottom-3 px-4 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Curating...</span>
                  </>
                ) : (
                  <>
                    <span>Match Films</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Mood Seeds */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-medium block">
                Instant Mood Seeds:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_SEEDS.map((seed) => (
                  <button
                    key={seed.label}
                    onClick={() => handleSeedClick(seed.prompt)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                  >
                    {seed.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Filter Modifiers (Platform & Pacing) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs">
            {/* Platform filter buttons */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400 mr-1 font-medium">Platform:</span>
              {(['All', 'Netflix', 'Prime Video'] as const).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setSelectedPlatform(plat)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedPlatform === plat
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            {/* Pacing filter buttons */}
            <div className="flex items-center gap-1">
              <span className="text-zinc-400 mr-1 font-medium">Pacing:</span>
              {(['Any', 'Slow-Burn', 'Balanced', 'High-Octane'] as const).map((pace) => (
                <button
                  key={pace}
                  onClick={() => setSelectedPacing(pace)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    selectedPacing === pace
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                  }`}
                >
                  {pace}
                </button>
              ))}
            </div>
          </div>

          {/* Results Area */}
          <div className="space-y-4">
            {isLoading && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
                <p className="text-sm font-medium text-zinc-300">
                  Scanning cinema taste vectors across Netflix and Prime Video...
                </p>
                <span className="text-xs text-zinc-500">
                  Analyzing narrative arcs, cinematography, directing pacing & themes
                </span>
              </div>
            )}

            {!isLoading && hasQueried && results.length === 0 && (
              <div className="py-8 text-center text-zinc-400 text-xs space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-zinc-500" />
                <p>No matching films found for that specific query. Try relaxing your filters or selecting a mood seed above.</p>
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-white">
                    Curated Recommendations ({results.length} Films)
                  </span>
                  <span>Sorted by Taste Match %</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {results.map((rec) => {
                    const matchedDbMovie = allMovies.find(
                      (m) => m.title.toLowerCase().includes(rec.title.toLowerCase()) ||
                             rec.title.toLowerCase().includes(m.title.toLowerCase())
                    );
                    const isWatchlisted = matchedDbMovie ? watchlist.includes(matchedDbMovie.id) : false;

                    return (
                      <div
                        key={rec.title}
                        className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all space-y-2.5 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3
                                onClick={() => onSelectMovieTitle(rec.title)}
                                className="text-sm font-bold text-white hover:text-rose-400 transition-colors cursor-pointer"
                              >
                                {rec.title}
                              </h3>
                              <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                                <span className="text-emerald-400 font-bold">{rec.matchScore}% Match</span>
                                <span aria-hidden="true">·</span>
                                <span>{rec.year}</span>
                                <span aria-hidden="true">·</span>
                                <span className="text-zinc-300">{rec.streamingPlatform}</span>
                              </div>
                            </div>

                            {matchedDbMovie && (
                              <button
                                onClick={() => onToggleWatchlist(matchedDbMovie.id)}
                                title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
                                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                  isWatchlisted
                                    ? 'bg-rose-950/40 text-rose-300'
                                    : 'bg-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                {isWatchlisted ? <Check className="w-3.5 h-3.5 text-rose-400" /> : <Plus className="w-3.5 h-3.5" />}
                              </button>
                            )}
                          </div>

                          {/* Unboxed Genres */}
                          <div className="text-[11px] text-zinc-400">
                            {rec.genres.join(' · ')}
                          </div>

                          {/* Reason */}
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {rec.reason}
                          </p>
                        </div>

                        {/* Footer Alignment & Comparable Films */}
                        <div className="pt-2 border-t border-zinc-800/80 space-y-1 text-[11px] text-zinc-400">
                          <div className="truncate">
                            <span className="text-zinc-500">Mood:</span> {rec.moodAlignment}
                          </div>
                          {rec.comparableFilms && rec.comparableFilms.length > 0 && (
                            <div className="truncate text-zinc-500">
                              <span>For fans of:</span>{' '}
                              <span className="text-zinc-400">{rec.comparableFilms.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
