/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { CategoryType, LocationPin } from '../types/accessibility';
import { calculateDistanceKm, getRatingColor } from '../utils/storage';
import {
  CityPreset,
  DEFAULT_CDO_CENTER,
  MINDANAO_CITY_PRESETS,
  extractDistrictOrCity,
} from '../utils/routingAndSpatial';
import {
  Search,
  X,
  SlidersHorizontal,
  Compass,
  RotateCcw,
  Sparkles,
  Check,
  MapPin,
} from 'lucide-react';

export interface AccessibilityQuickFilter {
  id: string;
  label: string;
  shortLabel: string;
  tagKeyword?: string;
  minRating?: number;
}

export const ACCESSIBILITY_QUICK_FILTERS: AccessibilityQuickFilter[] = [
  {
    id: 'high-rated',
    label: 'High Accessibility (4.0★+)',
    shortLabel: '4.0★+ Rated',
    minRating: 4.0,
  },
  {
    id: 'wheelchair',
    label: 'Wheelchair Entrance',
    shortLabel: 'Wheelchair Entry',
    tagKeyword: 'wheelchair',
  },
  {
    id: 'ramp',
    label: 'Ramp Available',
    shortLabel: 'Ramp',
    tagKeyword: 'ramp',
  },
  {
    id: 'elevator',
    label: 'Elevator Access',
    shortLabel: 'Elevator',
    tagKeyword: 'elevator',
  },
  {
    id: 'restroom',
    label: 'Accessible Restroom',
    shortLabel: 'Restroom',
    tagKeyword: 'restroom',
  },
  {
    id: 'quiet',
    label: 'Quiet / Low-Sensory',
    shortLabel: 'Quiet Zone',
    tagKeyword: 'quiet',
  },
  {
    id: 'parking',
    label: 'Accessible Parking',
    shortLabel: 'Parking',
    tagKeyword: 'parking',
  },
];

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
  activeA11yFilters: string[];
  onToggleA11yFilter: (filterId: string) => void;
  onResetFilters: () => void;
  filteredLocations: LocationPin[];
  totalLocationsCount: number;
  onSelectLocationFromSearch: (loc: LocationPin) => void;
  activeCityId: string;
  onSelectCityPreset: (preset: CityPreset) => void;
  userCoords: { lat: number; lng: number } | null;
  nearbyRadiusKm: number | null;
}

export const MapSearchFilterBar: React.FC<MapSearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  activeA11yFilters,
  onToggleA11yFilter,
  onResetFilters,
  filteredLocations,
  totalLocationsCount,
  onSelectLocationFromSearch,
  activeCityId,
  onSelectCityPreset,
  userCoords,
  nearbyRadiusKm,
}) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showTagDrawer, setShowTagDrawer] = useState(false);
  const [showCityPills, setShowCityPills] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'All' ||
    activeA11yFilters.length > 0 ||
    nearbyRadiusKm !== null;

  // Global '/' shortcut to focus map search
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
        setShowTagDrawer(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
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
      className="absolute top-20 sm:top-5 left-4 right-4 sm:left-auto sm:right-auto sm:w-[440px] md:w-[500px] sm:mx-auto z-[500] pointer-events-none flex flex-col gap-2"
      style={{ left: '50%', transform: 'translateX(-50%)' }}
    >
      {/* Primary Search & Filter Trigger Bar */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/90 p-1.5 flex items-center gap-1.5 transition-all focus-within:ring-2 focus-within:ring-emerald-500/40 focus-within:border-emerald-500">
        <div className="pl-2.5 text-slate-400 flex items-center pointer-events-none">
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
          placeholder="Search venues, cities, or features (Press '/')"
          aria-label="Search accessible locations on the map"
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none py-1.5 px-1"
        />

        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              searchInputRef.current?.focus();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Clear search"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Accessibility Tags Filter Drawer Button */}
        <button
          type="button"
          onClick={() => setShowTagDrawer((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
            showTagDrawer || activeA11yFilters.length > 0
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-transparent'
          }`}
          title="Filter by accessibility tags"
          aria-label="Toggle accessibility tag filters"
          aria-expanded={showTagDrawer}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">A11y Tags</span>
          {activeA11yFilters.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-black">
              {activeA11yFilters.length}
            </span>
          )}
        </button>

        {/* Regional City Jump Toggle */}
        <button
          type="button"
          onClick={() => setShowCityPills((prev) => !prev)}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 border ${
            showCityPills
              ? 'bg-slate-900 text-white border-slate-950'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-transparent'
          }`}
          title="Jump to Mindanao city"
          aria-label="Toggle Mindanao city quick-jump bar"
          aria-expanded={showCityPills}
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Cities</span>
        </button>
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
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap transition-all shadow-xs cursor-pointer border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-950 scale-[1.02]'
                  : 'bg-white/95 hover:bg-white text-slate-700 border-slate-200/90'
              }`}
            >
              {cat.label}
            </button>
          );
        })}

        {/* Active Filter Count & Reset Pill */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-2.5 py-1 rounded-full text-[11px] font-extrabold whitespace-nowrap bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 shadow-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Reset all active filters"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({filteredLocations.length}/{totalLocationsCount})</span>
          </button>
        )}
      </div>

      {/* Expandable Accessibility Feature Filter Chips */}
      {showTagDrawer && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-3 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Filter by Verified Accessibility Features
            </span>
            <span className="text-[11px] font-bold text-slate-600">
              {filteredLocations.length} of {totalLocationsCount} matching
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ACCESSIBILITY_QUICK_FILTERS.map((item) => {
              const active = activeA11yFilters.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleA11yFilter(item.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {active && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Expandable Regional Mindanao City Switcher */}
      {showCityPills && (
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-2.5 animate-fade-in">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
            Jump to Mindanao Region / City Viewport
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MINDANAO_CITY_PRESETS.map((city) => {
              const isCurrent = activeCityId === city.id;
              return (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelectCityPreset(city);
                    setShowCityPills(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{city.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Live Search Autocomplete Dropdown */}
      {isSearchFocused && (searchQuery.trim().length > 0 || filteredLocations.length > 0) && (
        <div className="pointer-events-auto bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100">
          <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span>
              {searchQuery.trim()
                ? `Search Results (${filteredLocations.length})`
                : `Quick Jump Venues (${filteredLocations.length})`}
            </span>
            <span>Click to Fly To</span>
          </div>

          {searchSuggestions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-medium">
              No accessible venues match your current filter criteria.
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

