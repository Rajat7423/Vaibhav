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

const TMDB_IMAGE = 'https://image.tmdb.org/t/p/';
const movieFromTmdb = (m: any, genres: Record<number, string> = {}): Movie => ({
  id: String(m.id), title: m.title || m.name || 'Untitled', year: Number((m.release_date || '').slice(0, 4)) || 0,
  rating: 'PG-13', duration: m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m` : 'Feature film',
  matchScore: Math.round((m.vote_average || 0) * 10), imdbRating: Number(m.vote_average || 0), rottenTomatoes: 0,
  genres: (m.genres || m.genre_ids || []).map((g: any) => typeof g === 'number' ? genres[g] || 'Film' : g.name),
  platforms: [], logline: m.overview || 'Open to explore this film.', synopsis: m.overview || 'No synopsis is available yet.',
  director: (m.credits?.crew || []).find((p: any) => p.job === 'Director')?.name || '—',
  cast: (m.credits?.cast || []).slice(0, 8).map((p: any) => ({ name: p.name, role: p.character || '' })),
  moodTags: [], pacing: 'Balanced', tone: 'Thought-Provoking', complexity: 'Layered',
  backdropUrl: m.backdrop_path ? `${TMDB_IMAGE}w1280${m.backdrop_path}` : '',
  posterUrl: m.poster_path ? `${TMDB_IMAGE}w500${m.poster_path}` : '', trailerYoutubeId: '',
  awards: '', whyRecommended: 'A CINEVERSE pick based on your selected industry and taste.', audioVideo: [],
});

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
  const [region, setRegion] = useState<'hollywood'|'bollywood'|'tollywood'>('hollywood');
  const [liveMovies, setLiveMovies] = useState<Movie[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [recommendationMovies, setRecommendationMovies] = useState<Movie[]>([]);
  const [genreMap, setGenreMap] = useState<Record<number, string>>({});
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogPages, setCatalogPages] = useState(0);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [genreFilter, setGenreFilter] = useState<number|null>(null);
  const [mood, setMood] = useState('');
  const [tmdbConfigured, setTmdbConfigured] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login'|'register'>('login');
  const [account, setAccount] = useState<any>(null);
  const [csrf, setCsrf] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [savedLists, setSavedLists] = useState<any>({ favorites: [], watchlist: [] });
  const [detailBusy, setDetailBusy] = useState(false);

  useEffect(() => {
    Promise.all([fetch('/api/config').then(r=>r.json()), fetch('/api/genres').then(r=>r.ok?r.json():null), fetch('/api/session').then(r=>r.json()), fetch('/api/trending').then(r=>r.ok?r.json():null)])
      .then(([config, genres, session, trending]) => {
        setTmdbConfigured(Boolean(config.configured));
        if (genres?.genres) setGenreMap(Object.fromEntries(genres.genres.map((g:any)=>[g.id,g.name])));
        if (session?.user) { setAccount(session.user); setCsrf(session.csrf); setSavedLists(session.lists || {favorites:[],watchlist:[]}); setWatchlist((session.lists?.watchlist||[]).map((m:any)=>String(m.id))); setLikedMovies(Object.fromEntries((session.lists?.favorites||[]).map((m:any)=>[String(m.id),'like']))); }
        if (trending?.results) setTrendingMovies(trending.results.slice(0,12).map((m:any)=>movieFromTmdb(m)));
      }).catch(()=>{});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams({region, page:'1', sort: sortBy === 'rating' ? 'vote_average.desc' : sortBy === 'year' ? 'primary_release_date.desc' : 'popularity.desc'});
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      if (genreFilter) params.set('genre', String(genreFilter));
      fetch(`/api/movies?${params}`).then(async r=>{const data=await r.json(); if(!r.ok) throw new Error(data.error); return data;})
        .then(data=>{setLiveMovies((data.results||[]).map((m:any)=>movieFromTmdb(m,genreMap)));setCatalogPage(1);setCatalogPages(data.total_pages||0);setCatalogTotal(data.total_results||0);})
        .catch(()=>{setLiveMovies([]);setCatalogPage(0);});
    }, 260);
    return () => clearTimeout(timer);
  }, [region, searchQuery, genreFilter, sortBy, tmdbConfigured, genreMap]);

  useEffect(() => {
    const params = new URLSearchParams({region}); if (mood) params.set('mood', mood);
    fetch(`/api/recommendations?${params}`).then(r=>r.ok?r.json():null).then(data=>{if(data?.results)setRecommendationMovies(data.results.slice(0,12).map((m:any)=>movieFromTmdb(m,genreMap)));}).catch(()=>{});
  }, [region, mood, genreMap]);

  useEffect(() => {
    if (!selectedMovieModal || !/^\d+$/.test(selectedMovieModal.id)) return;
    setDetailBusy(true);
    fetch(`/api/movie/${selectedMovieModal.id}`).then(r=>r.ok?r.json():null).then(data=>{if(data)setSelectedMovieModal(movieFromTmdb(data,genreMap));}).catch(()=>{}).finally(()=>setDetailBusy(false));
  }, [selectedMovieModal?.id]);

  const submitAuth = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true); setAuthError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/${authMode}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.get('name'),email:form.get('email'),password:form.get('password')})});
      const data = await response.json(); if(!response.ok) throw new Error(data.error || 'Could not sign in.');
      setAccount(data.user);setCsrf(data.csrf);setSavedLists(data.lists || {favorites:[],watchlist:[]});setWatchlist((data.lists?.watchlist||[]).map((m:any)=>String(m.id)));setLikedMovies(Object.fromEntries((data.lists?.favorites||[]).map((m:any)=>[String(m.id),'like'])));setAuthOpen(false);
    } catch(e:any) { setAuthError(e.message); } finally { setAuthBusy(false); }
  };
  const saveMovie = async (movie: Movie, list_type: 'favorites'|'watchlist') => {
    if (!account) { setAuthOpen(true); return; }
    const existing = savedLists[list_type]?.some((m:any)=>String(m.id)===movie.id);
    const path = existing ? `/api/lists/${list_type}/${movie.id}` : '/api/lists';
    const genreIds=movie.genres.map(name=>Number(Object.entries(genreMap).find(([,label])=>label===name)?.[0])).filter(Number.isFinite);
    const response = await fetch(path,{method:existing?'DELETE':'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},...(existing?{}:{body:JSON.stringify({list_type,movie:{id:Number(movie.id),title:movie.title,poster_path:movie.posterUrl.split('/t/p/w500')[1] || '',backdrop_path:movie.backdropUrl.split('/t/p/w1280')[1] || '',overview:movie.synopsis,release_date:String(movie.year),vote_average:movie.imdbRating,genre_ids:genreIds}})})});
    const data=await response.json();if(!response.ok)throw new Error(data.error);setSavedLists(data.lists);
  };
  const loadMoreCatalog = async () => {
    if(catalogPage>=catalogPages)return;
    const next=catalogPage+1;const params=new URLSearchParams({region,page:String(next)});if(searchQuery.trim())params.set('q',searchQuery.trim());if(genreFilter)params.set('genre',String(genreFilter));
    const response=await fetch(`/api/movies?${params}`);const data=await response.json();if(!response.ok)return;
    setLiveMovies(prev=>[...prev,...data.results.map((m:any)=>movieFromTmdb(m,genreMap))]);setCatalogPage(next);
  };

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
    const movie = [...liveMovies,...trendingMovies].find(m=>m.id===movieId);
    if(movie) void saveMovie(movie, 'watchlist').catch((e:any)=>console.warn(e));
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
    const movie = [...liveMovies,...trendingMovies].find(m=>m.id===movieId);
    if(movie) void saveMovie(movie, 'favorites').catch((e:any)=>console.warn(e));
  };

  const handleOpenDetails = (movie: Movie) => {
    setSelectedMovieModal(movie);
  };

  const handlePlayTrailer = (movie: Movie) => {
    setSelectedMovieModal(movie);
  };

  const handleSelectMovieTitle = (title: string) => {
    const found = allAvailableMovies.find(
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
    const source = tmdbConfigured ? liveMovies : MOVIES_DATABASE;
    return source.filter((m) => {
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
  }, [searchQuery, selectedGenre, selectedPlatform, sortBy, tmdbConfigured, liveMovies]);
  const collectionMovies = tmdbConfigured ? liveMovies : filteredMovies;
  const collectionCount = tmdbConfigured ? catalogTotal : collectionMovies.length;

  // Specialized Curated Shelves
  const recommendedShelf = useMemo(() => {
    return tmdbConfigured && recommendationMovies.length ? recommendationMovies : MOVIES_DATABASE.filter((m) => m.matchScore >= 96);
  }, [tmdbConfigured, recommendationMovies]);

  const trendingShelf = useMemo(() => {
    return tmdbConfigured && trendingMovies.length ? trendingMovies : MOVIES_DATABASE.filter((m) => m.year >= 2023);
  }, [tmdbConfigured, trendingMovies]);

  const scifiShelf = useMemo(() => {
    return tmdbConfigured && liveMovies.length ? liveMovies.filter((m) => m.genres.includes('Science Fiction') || m.genres.includes('Sci-Fi')) : MOVIES_DATABASE.filter((m) => m.genres.includes('Sci-Fi'));
  }, [tmdbConfigured, liveMovies]);

  const noirThrillerShelf = useMemo(() => {
    return tmdbConfigured && liveMovies.length ? liveMovies.filter((m) => m.genres.some(g=>['Crime','Mystery','Thriller'].includes(g))) : MOVIES_DATABASE.filter((m) => m.genres.includes('Crime') || m.genres.includes('Neo-Noir') || m.genres.includes('Thriller'));
  }, [tmdbConfigured, liveMovies]);

  const primeExclusivesShelf = useMemo(() => {
    return tmdbConfigured ? [] : MOVIES_DATABASE.filter((m) => m.platforms.some((p) => p.name === 'Prime Video'));
  }, [tmdbConfigured]);

  const spotlightMovie = trendingMovies[0] || liveMovies[0] || MOVIES_DATABASE[0];
  const accountMovies = [...(savedLists.watchlist||[]),...(savedLists.favorites||[])].map((m:any)=>movieFromTmdb(m,genreMap));
  const allAvailableMovies = [...liveMovies, ...trendingMovies, ...recommendationMovies, ...accountMovies, ...MOVIES_DATABASE].filter((m,i,a)=>a.findIndex(x=>x.id===m.id)===i);

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

      <div className="fixed top-[68px] left-0 right-0 z-30 bg-zinc-950/95 border-b border-zinc-800 px-4 py-2 flex flex-wrap items-center justify-center gap-2 text-xs backdrop-blur-xl">
        {(['hollywood','bollywood','tollywood'] as const).map((key) => <button key={key} onClick={()=>setRegion(key)} className={`rounded-full px-4 py-2 border transition ${region===key?'border-fuchsia-300 bg-fuchsia-300/15 text-white':'border-zinc-700 text-zinc-400 hover:text-white'}`}>{key[0].toUpperCase()+key.slice(1)}</button>)}
        <button onClick={()=>setAuthOpen(true)} className="ml-2 rounded-full border border-zinc-700 px-4 py-2 text-zinc-200 hover:border-fuchsia-300">{account?.name || 'Sign in'}</button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 pt-28">
        {!tmdbConfigured && <div className="mx-auto max-w-6xl px-5 pb-3 text-xs text-amber-200">Connect TMDB: add <code>TMDB_READ_ACCESS_TOKEN</code> to the server environment. Sample titles remain available until configured.</div>}
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

            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
              <div className="flex flex-wrap items-center gap-2"><span className="mr-2 text-xs uppercase tracking-[.22em] text-zinc-500">Find your feeling</span>{[['feel-good','Feel-good'],['mind-bending','Mind-bending'],['adrenaline','Adrenaline'],['romance','Romance'],['comfort','Comfort'],['dark-and-intense','Dark & intense']].map(([key,label])=><button key={key} onClick={()=>setMood(mood===key?'':key)} className={`rounded-full border px-3 py-2 text-xs ${mood===key?'border-fuchsia-300 bg-fuchsia-300/15 text-white':'border-zinc-700 text-zinc-400 hover:text-white'}`}>{label}</button>)}</div>
              <div className="flex flex-wrap gap-2"><span className="mr-2 text-xs uppercase tracking-[.22em] text-zinc-500">Genres</span>{Object.entries(genreMap).map(([id,name])=><button key={id} onClick={()=>setGenreFilter(genreFilter===Number(id)?null:Number(id))} className={`rounded-full border px-3 py-1.5 text-[11px] ${genreFilter===Number(id)?'border-rose-300 bg-rose-300/15 text-white':'border-zinc-800 text-zinc-500 hover:text-white'}`}>{name}</button>)}</div>
              {tmdbConfigured && <p className="text-[11px] text-zinc-500">Live TMDB catalog · {catalogTotal.toLocaleString()} results · page {catalogPage} of {catalogPages} · region results can be browsed up to TMDB’s 500-page limit.</p>}
            </section>

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
                {recommendationMovies.length > 0 && <MovieShelf title="CINEVERSE AI · picked for your mood" subtitle={mood ? `Personalized for ${mood.replaceAll('-',' ')}` : 'Personalized from your selected film universe'} movies={recommendationMovies} onOpenDetails={handleOpenDetails} onPlayTrailer={handlePlayTrailer} watchlist={watchlist} onToggleWatchlist={toggleWatchlist} likedMovies={likedMovies} onToggleLike={toggleLike} watchProgress={watchProgress} />}
                <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                  <div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] tracking-[.25em] text-rose-300">{tmdbConfigured?'THE LIVE COLLECTION':'CINEVERSE PREVIEW PICKS'}</p><h2 className="mt-1 text-2xl font-bold">{tmdbConfigured?`Explore ${region[0].toUpperCase()+region.slice(1)}`:'Explore movies'}</h2></div><span className="text-xs text-zinc-500">{collectionCount.toLocaleString()} titles</span></div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{collectionMovies.map(movie=><button key={movie.id} onClick={()=>handleOpenDetails(movie)} className="group text-left"><div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-900"><img className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" src={movie.posterUrl || movie.backdropUrl} alt={movie.title}/></div><div className="mt-2 truncate text-sm font-semibold text-zinc-100">{movie.title}</div><div className="text-xs text-zinc-500">✦ {movie.imdbRating.toFixed(1)} · {movie.year || '—'}</div></button>)}</div>
                  {tmdbConfigured && catalogPage < catalogPages && <button onClick={()=>void loadMoreCatalog()} className="mx-auto mt-8 block rounded-lg border border-zinc-700 px-6 py-3 text-xs text-zinc-200 hover:border-fuchsia-300">Load more movies · page {catalogPage+1} / {catalogPages}</button>}
                  {!tmdbConfigured && <p className="mt-6 text-center text-[11px] text-zinc-500">Preview data only. Add your TMDB token to load real posters and 1,000+ titles per region.</p>}
                </section>
              </div>
            )}
          </div>
        ) : activeTab === 'taste-matrix' ? (
          <TasteDnaMixer
            allMovies={allAvailableMovies}
            onOpenDetails={handleOpenDetails}
            onPlayTrailer={handlePlayTrailer}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            likedMovies={likedMovies}
            onToggleLike={toggleLike}
          />
        ) : activeTab === 'blender' ? (
          <MovieBlender
            allMovies={allAvailableMovies}
            onOpenDetails={handleOpenDetails}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
          />
        ) : (
          <WatchlistView
            allMovies={allAvailableMovies}
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
        allMovies={allAvailableMovies}
        onSelectMovie={(m) => setSelectedMovieModal(m)}
      />

      {/* AI Cinephile Matchmaker Modal */}
      <AiRecommenderModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onSelectMovieTitle={handleSelectMovieTitle}
        watchlist={watchlist}
        onToggleWatchlist={toggleWatchlist}
        allMovies={allAvailableMovies}
      />

      {authOpen && <div className="fixed inset-0 z-[80] grid place-items-center bg-black/80 p-4 backdrop-blur-sm" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthOpen(false)}}><section className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-[#111116] p-7 shadow-2xl"><button onClick={()=>setAuthOpen(false)} className="absolute right-4 top-3 text-2xl text-zinc-500">×</button><p className="text-[10px] tracking-[.25em] text-fuchsia-300">CINEVERSE AI · MEMBER ACCESS</p><h2 className="mt-2 text-3xl font-bold">{account?'Your universe':authMode==='login'?'Welcome back.':'Join CINEVERSE.'}</h2>{account ? <><p className="mt-2 text-sm text-zinc-400">Signed in as {account.email}. Your saved movies sync to your account.</p><div className="mt-5 flex gap-3"><button onClick={()=>{setActiveTab('watchlist');setAuthOpen(false)}} className="flex-1 rounded-lg bg-zinc-800 p-3 text-sm">Watchlist ({savedLists.watchlist?.length||0})</button><button onClick={()=>{setActiveTab('watchlist');setAuthOpen(false)}} className="flex-1 rounded-lg bg-zinc-800 p-3 text-sm">Favorites ({savedLists.favorites?.length||0})</button></div><button className="mt-6 w-full rounded-lg border border-zinc-700 p-3 text-sm" onClick={async()=>{await fetch('/api/logout',{method:'POST',headers:{'X-CSRF-Token':csrf}});setAccount(null);setCsrf('');setSavedLists({favorites:[],watchlist:[]});setAuthOpen(false)}}>Sign out</button></>:<><div className="mt-5 flex gap-4 border-b border-zinc-800"><button onClick={()=>setAuthMode('login')} className={`pb-2 text-sm ${authMode==='login'?'border-b-2 border-fuchsia-300 text-white':'text-zinc-500'}`}>Sign in</button><button onClick={()=>setAuthMode('register')} className={`pb-2 text-sm ${authMode==='register'?'border-b-2 border-fuchsia-300 text-white':'text-zinc-500'}`}>Create account</button></div><form onSubmit={submitAuth} className="mt-5 space-y-3">{authMode==='register'&&<input name="name" required maxLength={60} placeholder="Your name" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm"/>}<input name="email" type="email" required placeholder="Email address" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm"/><input name="password" type="password" minLength={10} required placeholder="Password (10+ characters)" className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm"/>{authError&&<p className="text-xs text-rose-300">{authError}</p>}<button disabled={authBusy} className="w-full rounded-lg bg-fuchsia-200 p-3 text-sm font-bold text-zinc-900">{authBusy?'Please wait…':authMode==='login'?'Sign in':'Create account'}</button></form><p className="mt-4 text-center text-[10px] text-zinc-500">Your private collection stays yours.</p></>}</section></div>}

      <section className="border-y border-zinc-800 bg-[#101016] px-6 py-12 text-center"><p className="text-[10px] tracking-[.3em] text-fuchsia-300">ABOUT THE TEAM</p><h2 className="mt-3 text-3xl font-bold">For the love of the story.</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-400">CINEVERSE AI brings Hollywood, Bollywood and Tollywood cinema into one universe. Discover films by industry, mood and taste, with live movie data from TMDB.</p><p className="mt-6 text-sm font-extrabold tracking-[.22em] text-white">MADE BY VAIBHAV &amp; TEAM</p></section>
      {/* Clean Anti-Slop Footer */}
      <footer className="border-t border-zinc-800/80 bg-[#06070A] py-8 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white tracking-tight">CINEVERSE AI</span>
            <span>·</span>
            <span>AI Cinema Recommendation Platform</span>
          </div>

          <div className="flex items-center gap-4 text-zinc-400">
            <span className="font-semibold text-fuchsia-200">MADE BY VAIBHAV &amp; TEAM</span>
            <span>·</span>
            <span>Movie data & imagery by TMDB · Not endorsed by TMDB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
