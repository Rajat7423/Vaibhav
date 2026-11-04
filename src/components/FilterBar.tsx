import React from 'react';
import { GENRES_LIST } from '../data/moviesData';
import { StreamingPlatformName } from '../types/movie';

interface FilterBarProps {
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
  selectedPlatform: StreamingPlatformName | 'All';
  setSelectedPlatform: (platform: StreamingPlatformName | 'All') => void;
  sortBy: 'match' | 'rating' | 'year';
  setSortBy: (sort: 'match' | 'rating' | 'year') => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  selectedGenre,
  setSelectedGenre,
  selectedPlatform,
  setSelectedPlatform,
  sortBy,
  setSortBy
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/80">
        {/* Platform Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-xs text-zinc-500 font-medium mr-1 whitespace-nowrap">
            Platform:
          </span>
          {(['All', 'Netflix', 'Prime Video', 'Apple TV+', 'Max'] as const).map((platform) => (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedPlatform === platform
                  ? 'bg-white text-zinc-950 shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {platform}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <span className="text-xs text-zinc-500 whitespace-nowrap">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 outline-none focus:border-rose-500 cursor-pointer"
          >
            <option value="match">Match Score %</option>
            <option value="rating">IMDb Rating</option>
            <option value="year">Release Year</option>
          </select>
        </div>
      </div>

      {/* Genre Filter Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {GENRES_LIST.map((genre) => (
          <button
            key={genre}
            onClick={() => setSelectedGenre(genre)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedGenre === genre
                ? 'bg-rose-600 text-white'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800/60'
            }`}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};
