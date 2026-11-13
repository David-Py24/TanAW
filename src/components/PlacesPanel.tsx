/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocationPin, CategoryType } from '../types/accessibility';
import { STANDARD_ACCESSIBILITY_TAGS } from '../prompts/storefrontPrompt';
import { LocationCard } from './LocationCard';
import { getTagIcon } from '../utils/tagHelpers';
import { useA11y } from '../context/A11yContext';
import {
  RotateCcw,
  Search,
  X,
  SlidersHorizontal,
  Check,
  Map as MapIcon,
  Info,
} from 'lucide-react';

export type PlacesTab = 'all' | 'verified' | 'barriers';

interface PlacesPanelProps {
  locations: LocationPin[];
  selectedLocation: LocationPin | null;
  savedPlaceIds?: string[];
  onToggleSavePlace?: (locationId: string) => void;
  onSelectLocation: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  activeTab: PlacesTab;
  onTabChange: (tab: PlacesTab) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryType | 'All';
  onCategoryChange: (cat: CategoryType | 'All') => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  userCoords: { lat: number; lng: number } | null;
  onResetData: () => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

const CATEGORIES: (CategoryType | 'All')[] = [
  'All',
  'Shopping',
  'Dining & Cafe',
  'Healthcare',
  'Education',
  'Public Space',
];

export const PlacesPanel: React.FC<PlacesPanelProps> = ({
  locations,
  selectedLocation,
  savedPlaceIds = [],
  onToggleSavePlace,
  onSelectLocation,
  onOpenDetails,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onToggleTag,
  onClearTags,
  userCoords,
  onResetData,
  isOpen,
  onCloseMobile,
}) => {
  const { announce } = useA11y();
  const [showFilters, setShowFilters] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState<boolean>(() => {
    return localStorage.getItem('accessmap_hide_panel_guide') !== 'true';
  });

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Locations list and filters"
      className="fixed inset-x-0 top-0 bottom-16 z-[600] md:static md:inset-auto md:z-30 flex w-full md:w-[350px] lg:w-[380px] bg-[#f8fafc] border-r border-slate-200 flex-col md:h-full shrink-0 select-none shadow-xl md:shadow-xs"
    >
      {/* Top Header */}
      <div className="p-4 pb-3 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900 truncate">
            Accessible Places
          </h2>
          <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {locations.length}
          </span>
        </div>

        {/* Filter, Reset & Mobile View Map Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`h-9 px-2.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-colors cursor-pointer ${
              selectedTags.length > 0 || showFilters
                ? 'bg-sky-50 border-sky-300 text-sky-700'
                : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
            }`}
            title="Filter by accessibility tags"
            aria-label="Filter by accessibility tags"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Features</span>
            {selectedTags.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-sky-600 text-white text-[10px]">
                {selectedTags.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onResetData}
            className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
            title="Reset to Cagayan de Oro seed places"
            aria-label="Reset seed places"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden h-9 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              aria-label="Close list and return to map"
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Dismissible Quick-Understand Guide Banner */}
      {showQuickGuide && (
        <div className="mx-4 mt-3 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-slate-700 flex items-start justify-between gap-2 shrink-0">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-snug">
              <p className="font-bold text-slate-900">How to use TanAW:</p>
              <p className="text-[11px] text-slate-600">
                Select any place to inspect ramps, elevators, and entrances. Open details to vote{' '}
                <strong className="text-emerald-700">Confirm</strong> or{' '}
                <strong className="text-rose-700">Dispute</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowQuickGuide(false);
              localStorage.setItem('accessmap_hide_panel_guide', 'true');
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer shrink-0"
            title="Dismiss guide"
            aria-label="Dismiss guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Segmented Control Pill Switcher + Search + Category Pills */}
      <div className="px-4 py-3 bg-white/70 border-b border-slate-200/60 shrink-0">
        <div
          role="tablist"
          aria-label="Location status tabs"
          className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200/80"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'all'}
            onClick={() => {
              onTabChange('all');
              announce('Showing all locations on list and map');
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'all'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Places
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'verified'}
            onClick={() => {
              onTabChange('verified');
              announce('Showing community verified locations on list and map');
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'verified'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Verified (4★+)
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'barriers'}
            onClick={() => {
              onTabChange('barriers');
              announce('Showing reported barriers on list and map');
            }}
            className={`flex-1 py-1.5 px-2.5 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
              activeTab === 'barriers'
                ? 'bg-slate-950 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Barriers
          </button>
        </div>

        {/* Clean Integrated Search Input */}
        <div className="relative mt-2.5">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search places, streets, or ramps..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-2 focus:outline-sky-600 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Horizontal Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5 pb-0.5">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'All' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* Expandable Tag Filters Accordion */}
        {showFilters && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Filter by Accessibility Feature:
              </span>
              {selectedTags.length > 0 && (
                <button
                  type="button"
                  onClick={onClearTags}
                  className="text-[11px] text-rose-600 font-bold hover:underline cursor-pointer"
                >
                  Clear ({selectedTags.length})
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1 max-h-36 overflow-y-auto pr-1">
              {STANDARD_ACCESSIBILITY_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {getTagIcon(tag)}
                    <span className="truncate max-w-[140px]">{tag}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {locations.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
            <p className="text-sm font-bold text-slate-700">No matching places</p>
            <p className="text-xs text-slate-400">
              Try switching back to All Places or clearing your search filter.
            </p>
          </div>
        ) : (
          locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              isSelected={selectedLocation?.id === loc.id}
              isSaved={savedPlaceIds.includes(loc.id)}
              onToggleSave={onToggleSavePlace}
              onSelect={(selected) => {
                onSelectLocation(selected);
                if (onCloseMobile && window.innerWidth < 768) {
                  onCloseMobile();
                }
              }}
              onOpenDetails={onOpenDetails}
              userCoords={userCoords}
            />
          ))
        )}
      </div>
    </aside>
  );
};
