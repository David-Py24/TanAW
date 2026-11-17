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
  extractDistrictOrCity,
} from '../utils/routingAndSpatial';
import { Search, X } from 'lucide-react';

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
  selectedCategory?: CategoryType | 'All';
  onCategoryChange?: (cat: CategoryType | 'All') => void;
  activeA11yFilters?: string[];
  onToggleA11yFilter?: (filterId: string) => void;
  onResetFilters?: () => void;
  filteredLocations: LocationPin[];
  totalLocationsCount?: number;
  onSelectLocationFromSearch: (loc: LocationPin) => void;
  activeCityId?: string;
  onSelectCityPreset?: (preset: CityPreset) => void;
  userCoords: { lat: number; lng: number } | null;
  nearbyRadiusKm?: number | null;
}

export const MapSearchFilterBar: React.FC<MapSearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  filteredLocations,
  onSelectLocationFromSearch,
  userCoords,
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(Boolean(searchQuery));
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Global '/' shortcut to focus map search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsSearchExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        if (!searchQuery) {
          setIsSearchExpanded(false);
        }
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Close dropdown or collapse search when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
        if (!searchQuery) {
          setIsSearchExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchQuery]);

  const refOrigin = userCoords || DEFAULT_CDO_CENTER;
  const searchSuggestions = filteredLocations.slice(0, 6);

  return (
    <div
      ref={containerRef}
      className="absolute top-4 left-4 sm:top-4.5 sm:left-5 z-[500] pointer-events-none flex flex-col items-start gap-2 max-w-[calc(100vw-2rem)] sm:max-w-md"
    >
      {/* Top Map Area: Collapsible Search Bar */}
      <div className="pointer-events-auto flex items-center justify-start">
        {!isSearchExpanded ? (
          <button
            type="button"
            onClick={() => {
              setIsSearchExpanded(true);
              setTimeout(() => searchInputRef.current?.focus(), 50);
            }}
            className={`h-9 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer border shrink-0 ${
              searchQuery
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white/95 hover:bg-white text-slate-800 border-slate-300 hover:border-slate-800'
            }`}
            title="Search locations (Press '/')"
            aria-label="Expand location search"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-semibold">
              {searchQuery ? `"${searchQuery}"` : "Search ('/')"}
            </span>
            {searchQuery && (
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ) : (
          <div className="bg-white/98 rounded-full shadow-xl border-2 border-slate-900 p-1 flex items-center gap-1.5 w-64 sm:w-72 shrink-0 animate-scale-up">
            <div className="pl-2 text-slate-400 flex items-center pointer-events-none shrink-0">
              <Search className="w-3.5 h-3.5" />
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
              placeholder="Search venues, tags..."
              aria-label="Search accessible locations on the map"
              className="w-full bg-transparent text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none py-1 px-1"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title="Clear query"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsSearchExpanded(false);
                setIsSearchFocused(false);
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full border border-slate-300 transition-colors cursor-pointer shrink-0"
              title="Collapse search"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Live Search Autocomplete Dropdown */}
      {isSearchFocused && (searchQuery.trim().length > 0 || filteredLocations.length > 0) && (
        <div className="pointer-events-auto w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden max-h-64 overflow-y-auto divide-y divide-slate-100 animate-scale-up">
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
              No accessible venues match your search query.
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


