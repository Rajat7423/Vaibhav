import React from 'react';
import { Sparkles, Search, Bookmark } from 'lucide-react';

interface NavbarProps {
  activeTab: 'browse' | 'taste-matrix' | 'blender' | 'watchlist';
  setActiveTab: (tab: 'browse' | 'taste-matrix' | 'blender' | 'watchlist') => void;
  onOpenAiRecommender: () => void;
  watchlistCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isScrolled: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiRecommender,
  watchlistCount,
  searchQuery,
  setSearchQuery,
  isScrolled
}) => {
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#08090D]/95 backdrop-blur-md border-b border-zinc-800/80 shadow-2xl py-3.5'
          : 'bg-gradient-to-b from-[#08090D]/90 via-[#08090D]/50 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <button
          onClick={() => setActiveTab('browse')}
          className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <span className="text-rose-500 font-black">CINE</span>VERSE
        </button>

        {/* Zone 2: 4-5 Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            onClick={() => setActiveTab('browse')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'browse'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab('taste-matrix')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'taste-matrix'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Taste Matrix
          </button>
          <button
            onClick={() => setActiveTab('blender')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeTab === 'blender'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Film DNA Blender
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 flex items-center gap-1.5 ${
              activeTab === 'watchlist'
                ? 'text-white border-b-2 border-rose-500 font-semibold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Watchlist</span>
            {watchlistCount > 0 && (
              <span className="text-xs bg-zinc-800 text-rose-400 px-1.5 py-0.2 rounded font-mono">
                {watchlistCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (with search input accessory) */}
        <div className="flex items-center gap-3 shrink-0">
          <button type="button" aria-label="Search movies" onClick={() => { const query = window.prompt('Search movies'); if (query !== null) setSearchQuery(query); }} className="lg:hidden rounded-full border border-zinc-700 p-2 text-zinc-300 hover:border-rose-400">
            <Search className="h-4 w-4" />
          </button>
          <div className="relative hidden lg:block w-48 xl:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, genre..."
              className="w-full bg-zinc-900/90 border border-zinc-800 focus:border-rose-500/80 rounded-full pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={onOpenAiRecommender}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-950/40 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Cinephile Match</span>
          </button>
        </div>
      </div>
    </header>
  );
};
