/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STANDARD_ACCESSIBILITY_TAGS } from '../prompts/storefrontPrompt';
import { getTagIcon } from '../utils/tagHelpers';
import { useA11y } from '../context/A11yContext';
import { CategoryType } from '../types/accessibility';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Sparkles,
  Check,
  ArrowUpDown,
} from 'lucide-react';

export type MatchMode = 'and' | 'or';
export type SortOption = 'rating_desc' | 'rating_asc' | 'reviews_desc' | 'distance' | 'name';

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: CategoryType | 'All';
  onCategoryChange: (cat: CategoryType | 'All') => void;
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  matchMode: MatchMode;
  onMatchModeChange: (mode: MatchMode) => void;
  minRating: number; // 0 for all, 4.0, 3.0, etc.
  onMinRatingChange: (rating: number) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalFiltered: number;
  totalTotal: number;
}

const CATEGORIES: (CategoryType | 'All')[] = [
  'All',
  'Shopping',
  'Dining & Cafe',
  'Healthcare',
  'Education',
  'Public Space',
  'Hotel & Lodging',
];

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedTags,
  onToggleTag,
  onClearTags,
  matchMode,
  onMatchModeChange,
  minRating,
  onMinRatingChange,
  sortBy,
  onSortChange,
  totalFiltered,
  totalTotal,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { announce } = useA11y();

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    selectedTags.length +
    (minRating > 0 ? 1 : 0);

  return (
    <div className="w-full bg-white border-b border-slate-200 shadow-xs z-20">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 flex flex-col gap-2.5">
        {/* Main Search Row */}
        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="search-input" className="sr-only">
              Search locations by name, category, or address
            </label>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search places in Cagayan de Oro (e.g. ramp, cafe, clinic)..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-2 focus:outline-sky-600"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  announce('Search cleared');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                title="Clear search"
                aria-label="Clear search input"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative shrink-0">
            <label htmlFor="sort-select" className="sr-only">
              Sort locations
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="py-2 pl-3 pr-8 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer focus:outline-2 focus:outline-sky-600 appearance-none"
            >
              <option value="rating_desc">Highest Rated</option>
              <option value="rating_asc">Lowest Rated</option>
              <option value="reviews_desc">Most Reviewed</option>
              <option value="distance">Nearest Distance</option>
              <option value="name">Alphabetical</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`py-2 px-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
              activeFilterCount > 0
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            aria-expanded={showAdvanced}
            aria-label={`Toggle tag filters. ${activeFilterCount} active filters`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-sky-600 text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-[11px] uppercase tracking-wider text-slate-600 font-bold mr-1 shrink-0">
            Category:
          </span>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  onCategoryChange(cat);
                  announce(`Filtered category: ${cat}`);
                }}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-pressed={isSelected}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Expanded Tag & Advanced Filter Panel */}
        {showAdvanced && (
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-3 animate-fade-in">
            {/* Tag Selection Header & AND/OR toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  Filter by Accessibility Tags:
                </span>
                {/* Match Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      onMatchModeChange('and');
                      announce('Matching ALL selected tags');
                    }}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                      matchMode === 'and'
                        ? 'bg-white text-sky-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Show locations that have ALL selected tags"
                  >
                    Match ALL (AND)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onMatchModeChange('or');
                      announce('Matching ANY selected tag');
                    }}
                    className={`px-2 py-0.5 rounded font-semibold transition-colors cursor-pointer ${
                      matchMode === 'or'
                        ? 'bg-white text-sky-700 shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Show locations that have ANY selected tag"
                  >
                    Match ANY (OR)
                  </button>
                </div>
              </div>

              {/* Clear filters */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onClearTags();
                    onCategoryChange('All');
                    onMinRatingChange(0);
                    announce('All filters cleared');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Accessibility Tag Chips */}
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_ACCESSIBILITY_TAGS.map((tagName) => {
                const isSelected = selectedTags.includes(tagName);
                return (
                  <button
                    key={tagName}
                    type="button"
                    onClick={() => {
                      onToggleTag(tagName);
                      announce(`${isSelected ? 'Removed' : 'Added'} tag filter: ${tagName}`);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {getTagIcon(tagName)}
                    <span>{tagName}</span>
                    {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>

            {/* Rating Filter Slider/Chips */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-600 font-semibold">Minimum Rating:</span>
              {[0, 3.0, 4.0, 4.5].map((stars) => (
                <button
                  key={stars}
                  type="button"
                  onClick={() => onMinRatingChange(stars)}
                  className={`px-2.5 py-1 rounded-md font-medium border cursor-pointer ${
                    minRating === stars
                      ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {stars === 0 ? 'Any' : `${stars}+ ★`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status & Results Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
          <span>
            Showing <strong className="text-slate-900">{totalFiltered}</strong> of{' '}
            <strong className="text-slate-900">{totalTotal}</strong> locations in Cagayan de Oro
          </span>
          {activeFilterCount > 0 && (
            <span className="text-sky-700 font-medium bg-sky-50 px-2 py-0.5 rounded">
              {selectedTags.length} tag(s) active ({matchMode.toUpperCase()})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
