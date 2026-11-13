/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { CategoryType, LocationPin } from '../types/accessibility';
import { calculateDistanceKm, getRatingColor } from '../utils/storage';
import {
  DEFAULT_CDO_CENTER,
  extractDistrictOrCity,
} from '../utils/routingAndSpatial';
import {
  Search,
  X,
  RotateCcw,
} from 'lucide-react';

export const CATEGORY_OPTIONS: Array<{ value: CategoryType | 'All'; label: string }> = [
  { value: 'All', label: 'All Venues' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Dining & Cafe', label: 'Dining & Cafe' },
  { value: 'Education', label: 'Education' },
  { value: 'Public Space', label: 'Public Space' },
];

interface MapSearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryType | 'All';
  onCategoryChange: (cat: CategoryType | 'All') => void;
  onResetFilters: () => void;
  filteredLocations: LocationPin[];
  totalLocationsCount: number;
  onSelectLocationFromSearch: (loc: LocationPin) => void;
  userCoords: { lat: number; lng: number } | null;
}

export const MapSearchFilterBar: React.FC<MapSearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onResetFilters,
  filteredLocations,
  totalLocationsCount,
  onSelectLocationFromSearch,
  userCoords,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'All' ||
    filteredLocations.length < totalLocationsCount;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refOrigin = userCoords || DEFAULT_CDO_CENTER;
  const searchSuggestions = filteredLocations.slice(0, 6);

  return (
    <div
      ref={containerRef}
      className="w-full max-w-xl mx-auto pointer-events-none flex flex-col gap-2"
    >
      {/* Primary Search Bar */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1.5 flex items-center gap-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500">
        <div className="pl-2.5 text-slate-400 flex items-center pointer-events-none shrink-0">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onChange={(e) => {
            onSearchChange(e.target.value);
            setIsSearchFocused(true);
          }}
          placeholder="Search places, ramps, elevators..."
          aria-label="Search accessible locations on the map"
          className="w-full min-w-0 bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5 px-1"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              searchInputRef.current?.focus();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            title="Clear search"
            aria-label="Clear search query"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Pills Row */}
      <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5 px-0.5">
        {CATEGORY_OPTIONS.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={`min-h-[30px] px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all shadow-xs cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-950'
                  : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90'
              }`}
            >
              {cat.label}
            </button>
          );
        })}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-[30px] px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Reset all active filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({filteredLocations.length}/{totalLocationsCount})</span>
          </button>
        )}
      </div>

      {/* Live Search Autocomplete Dropdown */}
      {isSearchFocused && searchQuery.trim().length > 0 && (
        <div className="pointer-events-auto bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-60 overflow-y-auto divide-y divide-slate-100">
          {searchSuggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              No accessible venues match your search.
            </div>
          ) : (
            searchSuggestions.map((loc) => {
              const colorMeta = getRatingColor(loc.averageRating, loc.totalReviews);
              const dist = calculateDistanceKm(refOrigin.lat, refOrigin.lng, loc.lat, loc.lng);
              const cityLabel = extractDistrictOrCity(loc.address);

              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => {
                    onSelectLocationFromSearch(loc);
                    setIsSearchFocused(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-50/60 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      {loc.name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {loc.category} • {cityLabel} • {dist} km
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-black text-white shrink-0"
                    style={{ backgroundColor: colorMeta.hex }}
                  >
                    {loc.averageRating > 0 ? `${loc.averageRating.toFixed(1)}★` : 'NEW'}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
