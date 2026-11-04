import React, { useState, useEffect, useMemo } from 'react';
import { MOVIES_DATABASE } from './data/moviesData';
import { Movie, StreamingPlatformName } from './types/movie';
import { Navbar } from './components/Navbar';
import { HeroBillboard } from './components/HeroBillboard';
import { MovieShelf } from './components/MovieShelf';
import { MovieModal } from './components/MovieModal';
import { AiRecommenderModal } from './components/AiRecommenderModal';
import { TasteDnaMixer } from './components/TasteDnaMixer';
import { MovieBlender } from './components/MovieBlenderModal';
import { WatchlistView } from './components/WatchlistView';
import { FilterBar } from './components/FilterBar';
import { Search, Film, Sparkles, Tv } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'browse' | 'taste-matrix' | 'blender' | 'watchlist'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All Genres');
  const [selectedPlatform, setSelectedPlatform] = useState<StreamingPlatformName | 'All'>('All');
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'year'>('match');

  // Persistence in localStorage
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cineverse_watchlist');
      return saved ? JSON.parse(saved) : ['interstellar-voyage', 'cyberpunk-neo-tokyo', 'arrival-linguistics'];
    } catch {
      return ['interstellar-voyage', 'cyberpunk-neo-tokyo'];
    }
  });

  const [watched, setWatched] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cineverse_watched');
      return saved ? JSON.parse(saved) : ['oppenheimer-atomic'];
    } catch {
      return [];
    }
  });

  const [watchProgress, setWatchProgress] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('cineverse_watch_progress');
      return saved ? JSON.parse(saved) : {
        'interstellar-voyage': 65,
        'cyberpunk-neo-tokyo': 35,
        'oppenheimer-atomic': 100
      };
    } catch {
      return {
        'interstellar-voyage': 65,
        'cyberpunk-neo-tokyo': 35,
        'oppenheimer-atomic': 100
      };
    }
  });

  const [likedMovies, setLikedMovies] = useState<Record<string, 'like' | 'dislike' | 'superlike'>>(() => {
    try {
      const saved = localStorage.getItem('cineverse_likes');
      return saved ? JSON.parse(saved) : { 'interstellar-voyage': 'like', 'oppenheimer-atomic': 'like' };
    } catch {
      return {};
    }
  });

  const [selectedMovieModal, setSelectedMovieModal] = useState<Movie | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cineverse_watchlist', JSON.stringify(watchlist));
    } catch {}
  }, [watchlist]);

  useEffect(() => {
    try {
      localStorage.setItem('cineverse_watched', JSON.stringify(watched));
    } catch {}
  }, [watched]);

  useEffect(() => {
    try {
      localStorage.setItem('cineverse_watch_progress', JSON.stringify(watchProgress));
    } catch {}
  }, [watchProgress]);

  useEffect(() => {
    try {
      localStorage.setItem('cineverse_likes', JSON.stringify(likedMovies));
    } catch {}
  }, [likedMovies]);

  // Scroll listener for Navbar transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleWatchlist = (movieId: string) => {
    setWatchlist((prev) =>
      prev.includes(movieId) ? prev.filter((id) => id !== movieId) : [...prev, movieId]
    );
  };

  const handleUpdateProgress = (movieId: string, progress: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(progress)));
    setWatchProgress((prev) => ({
      ...prev,
      [movieId]: clamped
    }));

    if (clamped === 100) {
      setWatched((prev) => (prev.includes(movieId) ? prev : [...prev, movieId]));
    } else {
      setWatched((prev) => prev.filter((id) => id !== movieId));
    }
  };

  const toggleWatched = (movieId: string) => {
    const isCurrentlyWatched = watched.includes(movieId);
    if (isCurrentlyWatched) {
      setWatched((prev) => prev.filter((id) => id !== movieId));
      setWatchProgress((prev) => ({ ...prev, [movieId]: 0 }));
    } else {
      setWatched((prev) => [...prev, movieId]);
      setWatchProgress((prev) => ({ ...prev, [movieId]: 100 }));
    }
  };

  const toggleLike = (movieId: string) => {
    setLikedMovies((prev) => {
      const current = prev[movieId];
      if (current === 'like') {
        const next = { ...prev };
        delete next[movieId];
        return next;
      }
      return { ...prev, [movieId]: 'like' };
    });
  };

  const handleOpenDetails = (movie: Movie) => {
    setSelectedMovieModal(movie);
  };

  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovieModal(movie);
  };

  const handleSelectMovieTitle = (title: string) => {
    const found = MOVIES_DATABASE.find(
      (m) => m.title.toLowerCase().includes(title.toLowerCase()) ||
             title.toLowerCase().includes(m.title.toLowerCase())
    );
    if (found) {
      setSelectedMovieModal(found);
      setIsAiModalOpen(false);
    }
  };

  // Filtered & Sorted master list
  const filteredMovies = useMemo(() => {
    return MOVIES_DATABASE.filter((m) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDirector = m.director.toLowerCase().includes(q);
        const matchesGenre = m.genres.some((g) => g.toLowerCase().includes(q));
        const matchesCast = m.cast.some((c) => c.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDirector && !matchesGenre && !matchesCast) return false;
      }

      // Genre
      if (selectedGenre !== 'All Genres') {
        if (!m.genres.includes(selectedGenre)) return false;
      }

      // Platform
      if (selectedPlatform !== 'All') {
        if (!m.platforms.some((p) => p.name === selectedPlatform)) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.imdbRating - a.imdbRating;
      if (sortBy === 'year') return b.year - a.year;
      return b.matchScore - a.matchScore;
    });
  }, [searchQuery, selectedGenre, selectedPlatform, sortBy]);

  // Specialized Curated Shelves
  const recommendedShelf = useMemo(() => {
    return MOVIES_DATABASE.filter((m) => m.matchScore >= 96);
  }, []);

  const trendingShelf = useMemo(() => {
    return MOVIES_DATABASE.filter((m) => m.year >= 2023);
  }, []);

  const scifiShelf = useMemo(() => {
    return MOVIES_DATABASE.filter((m) => m.genres.includes('Sci-Fi'));
  }, []);

  const noirThrillerShelf = useMemo(() => {
    return MOVIES_DATABASE.filter((m) => m.genres.includes('Crime') || m.genres.includes('Neo-Noir') || m.genres.includes('Thriller'));
  }, []);

  const primeExclusivesShelf = useMemo(() => {
    return MOVIES_DATABASE.filter((m) => m.platforms.some((p) => p.name === 'Prime Video'));
  }, []);

  const spotlightMovie = MOVIES_DATABASE[0];

  return (
    <div className="min-h-screen bg-[#08090D] text-slate-100 flex flex-col font-sans selection:bg-rose-600 selection:text-white">
      {/* Strict 3-Zone Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAiRecommender={() => setIsAiModalOpen(true)}
        watchlistCount={watchlist.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isScrolled={isScrolled}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-16">
        {/* If user is searching or active query exists, show instant search view */}
        {searchQuery.trim() ? (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Search Results for "{searchQuery}"
                </h1>
                <p className="text-xs text-zinc-400 mt-1">
                  Found {filteredMovies.length} matching films in the CineVerse streaming catalog.
                </p>
              </div>

              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Search className="w-10 h-10 mx-auto text-zinc-600" />
                <h3 className="text-base font-bold text-zinc-300">No movies match "{searchQuery}"</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Try searching for a different title, director (e.g. Christopher Nolan, Denis Villeneuve), or genre.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMovies.map((movie) => (
                  <div key={movie.id} className="flex justify-center">
                    <div
                      onClick={() => handleOpenDetails(movie)}
                      className="group w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-zinc-950 relative">
                        <img
                          src={movie.backdropUrl}
                          alt={movie.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-zinc-200">
                          {movie.platforms[0]?.name}
                        </div>
                      </div>
                      <div className="p-3 space-y-1.5">
                        <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                          {movie.title}
                        </h4>
                        <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                          <span className="text-emerald-400 font-bold">{movie.matchScore}%</span>
                          <span>·</span>
                          <span>{movie.year}</span>
                          <span>·</span>
                          <span>{movie.duration}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {movie.genres.join(' · ')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'browse' ? (
          <div className="space-y-6 pb-16">
            {/* Cinematic Hero Billboard (Featured Original) */}
            <HeroBillboard
              movie={spotlightMovie}
              onOpenDetails={handleOpenDetails}
              onPlayTrailer={handlePlayTrailer}
              isInWatchlist={watchlist.includes(spotlightMovie.id)}
              onToggleWatchlist={toggleWatchlist}
            />

            {/* Quick Filter Bar */}
            <FilterBar
              selectedGenre={selectedGenre}
              setSelectedGenre={setSelectedGenre}
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              sortBy={sortBy}
              setSortBy={setSortBy}
            />

            {/* If filtered by genre or platform, show direct results grid */}
            {selectedGenre !== 'All Genres' || selectedPlatform !== 'All' ? (
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-bold text-white text-base">
                    Filtered Selection: {selectedGenre} ({selectedPlatform})
                  </span>
                  <span>{filteredMovies.length} Titles Found</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredMovies.map((movie) => (
                    <div key={movie.id} className="flex justify-center">
                      <div
                        onClick={() => handleOpenDetails(movie)}
                        className="group w-full rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer"
                      >
                        <div className="aspect-video w-full overflow-hidden bg-zinc-950 relative">
                          <img
                            src={movie.backdropUrl}
                            alt={movie.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-semibold text-zinc-200">
                            {movie.platforms[0]?.name}
                          </div>
                        </div>
                        <div className="p-3 space-y-1.5">
                          <h4 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                            {movie.title}
                          </h4>
                          <div className="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                            <span className="text-emerald-400 font-bold">{movie.matchScore}%</span>
                            <span>·</span>
                            <span>{movie.year}</span>
                            <span>·</span>
                            <span>{movie.duration}</span>
                          </div>
                          <div className="text-[11px] text-zinc-500 truncate">
                            {movie.genres.join(' · ')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Netflix and Prime Video Horizontal Shelves */
              <div className="space-y-4">
                <MovieShelf
                  title="Recommended For You"
                  subtitle="Based on your taste profile and high affinity for mind-bending narrative fiction"
                  movies={recommendedShelf}
                  onOpenDetails={handleOpenDetails}
                  onPlayTrailer={handlePlayTrailer}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  likedMovies={likedMovies}
                  onToggleLike={toggleLike}
                  watchProgress={watchProgress}
                />

                <MovieShelf
                  title="Trending Worldwide on Netflix & Prime Video"
                  subtitle="Most watched titles across streaming services this week"
                  movies={trendingShelf}
                  onOpenDetails={handleOpenDetails}
                  onPlayTrailer={handlePlayTrailer}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  likedMovies={likedMovies}
                  onToggleLike={toggleLike}
                  watchProgress={watchProgress}
                />

                <MovieShelf
                  title="Mind-Bending & Existential Sci-Fi"
                  subtitle="Cosmic wormholes, synthetic humanity, and non-linear reality puzzles"
                  movies={scifiShelf}
                  onOpenDetails={handleOpenDetails}
                  onPlayTrailer={handlePlayTrailer}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  likedMovies={likedMovies}
                  onToggleLike={toggleLike}
                  watchProgress={watchProgress}
                />

                <MovieShelf
                  title="Rainy Night Neo-Noir & Psychological Thrillers"
                  subtitle="Meticulous detectives, neon reflections, and high-tension investigations"
                  movies={noirThrillerShelf}
                  onOpenDetails={handleOpenDetails}
                  onPlayTrailer={handlePlayTrailer}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  likedMovies={likedMovies}
                  onToggleLike={toggleLike}
                  watchProgress={watchProgress}
                />

                <MovieShelf
                  title="Included on Prime Video"
                  subtitle="Watch with Prime membership in 4K Ultra HD & HDR"
                  movies={primeExclusivesShelf}
                  onOpenDetails={handleOpenDetails}
                  onPlayTrailer={handlePlayTrailer}
                  watchlist={watchlist}
                  onToggleWatchlist={toggleWatchlist}
                  likedMovies={likedMovies}
                  onToggleLike={toggleLike}
                  watchProgress={watchProgress}
                />
              </div>
            )}
          </div>
        ) : activeTab === 'taste-matrix' ? (
          <TasteDnaMixer
            allMovies={MOVIES_DATABASE}
            onOpenDetails={handleOpenDetails}
            onPlayTrailer={handlePlayTrailer}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            likedMovies={likedMovies}
            onToggleLike={toggleLike}
          />
        ) : activeTab === 'blender' ? (
          <MovieBlender
            allMovies={MOVIES_DATABASE}
            onOpenDetails={handleOpenDetails}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
          />
        ) : (
          <WatchlistView
            allMovies={MOVIES_DATABASE}
            watchlist={watchlist}
            watched={watched}
            watchProgress={watchProgress}
            onUpdateProgress={handleUpdateProgress}
            onToggleWatchlist={toggleWatchlist}
            onToggleWatched={toggleWatched}
            onOpenDetails={handleOpenDetails}
            onPlayTrailer={handlePlayTrailer}
            likedMovies={likedMovies}
            onToggleLike={toggleLike}
          />
        )}
      </main>

      {/* Film Inspection Modal */}
      <MovieModal
        movie={selectedMovieModal}
        onClose={() => setSelectedMovieModal(null)}
        isInWatchlist={selectedMovieModal ? watchlist.includes(selectedMovieModal.id) : false}
        onToggleWatchlist={toggleWatchlist}
        isLiked={selectedMovieModal ? likedMovies[selectedMovieModal.id] === 'like' : false}
        onToggleLike={toggleLike}
        allMovies={MOVIES_DATABASE}
        onSelectMovie={(m) => setSelectedMovieModal(m)}
      />

      {/* AI Cinephile Matchmaker Modal */}
      <AiRecommenderModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectMovieTitle={handleSelectMovieTitle}
        watchlist={watchlist}
        onToggleWatchlist={toggleWatchlist}
        allMovies={MOVIES_DATABASE}
      />

      {/* Clean Anti-Slop Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#06070A] py-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">CINEVERSE</span>
            <span>·</span>
            <span>AI Cinema Recommendation Platform</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span>Powered by Gemini 3.8 Flash</span>
            <span>·</span>
            <span>Stream on Netflix, Prime Video & Apple TV+</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
