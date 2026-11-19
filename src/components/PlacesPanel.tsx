/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocationPin, CategoryType } from '../types/accessibility';
import {
  CityPreset,
  MINDANAO_CITY_PRESETS,
  ACCESSIBILITY_QUICK_FILTERS,
} from '../utils/routingAndSpatial';
import { PRESET_QUERIES, queryAIAgent, AIAgentResponse } from '../utils/aiAgent';
import { LocationCard } from './LocationCard';
import { useA11y } from '../context/A11yContext';
import {
  Search,
  X,
  MapPin,
  Map as MapIcon,
  ChevronDown,
  Plus,
  Check,
  RotateCcw,
  Sparkles,
  Camera,
  Bot,
  ArrowRight,
} from 'lucide-react';

export interface PlacesPanelProps {
  locations: LocationPin[];
  totalLocationsCount: number;
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  onRunAIScan: (loc: LocationPin) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryType | 'All';
  onCategoryChange: (cat: CategoryType | 'All') => void;
  activeA11yFilters: string[];
  onToggleA11yFilter: (filterId: string) => void;
  onClearFilters: () => void;
  userCoords: { lat: number; lng: number } | null;
  onResetData: () => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
  activeCity: CityPreset;
  onSelectCityPreset: (preset: CityPreset) => void;
  onOpenAddModal?: () => void;
  onToggleRoute?: (loc: LocationPin) => void;
  activeRouteLocationId?: string;
  onOpenAIAnalyzer?: () => void;
  aiMatchedIds?: string[];
  onSetAiMatchedIds?: (ids: string[]) => void;
}

const CATEGORIES: Array<{ value: CategoryType | 'All'; label: string }> = [
  { value: 'All', label: 'All' },
  { value: 'Shopping', label: 'Shopping' },
  { value: 'Dining & Cafe', label: 'Dining' },
  { value: 'Healthcare', label: 'Health' },
  { value: 'Public Space', label: 'Parks' },
  { value: 'Education', label: 'Education' },
];

export const PlacesPanel: React.FC<PlacesPanelProps> = ({
  locations,
  totalLocationsCount,
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
  onRunAIScan,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  activeA11yFilters,
  onToggleA11yFilter,
  onClearFilters,
  userCoords,
  onResetData,
  isOpen,
  onCloseMobile,
  activeCity,
  onSelectCityPreset,
  onOpenAddModal,
  onToggleRoute,
  activeRouteLocationId,
  onOpenAIAnalyzer,
  aiMatchedIds,
  onSetAiMatchedIds,
}) => {
  const { announce } = useA11y();
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(true);
  const [aiAgentResponse, setAiAgentResponse] = useState<AIAgentResponse | null>(null);

  const handleAskAI = (promptText: string) => {
    announce(`Asking AI Agent: ${promptText}`);
    const res = queryAIAgent(promptText, locations, activeCity);
    setAiAgentResponse(res);
    if (onSetAiMatchedIds) {
      onSetAiMatchedIds(res.matchedLocationIds);
    }
    if (res.suggestedCity) {
      onSelectCityPreset(res.suggestedCity);
    }
    announce(`AI Agent found ${res.matchedLocationIds.length} matching places`);
  };

  const handleClearAIQuery = () => {
    setAiAgentResponse(null);
    if (onSetAiMatchedIds) {
      onSetAiMatchedIds([]);
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'All' ||
    activeA11yFilters.length > 0 ||
    aiAgentResponse !== null;

  // No saved places at all (as opposed to no matches for the current filters).
  const isCompletelyEmpty = totalLocationsCount === 0 && !hasActiveFilters;

  return (
    <aside
      aria-label="Locations list and filters"
      className={`${
        isOpen ? 'flex' : 'hidden md:flex'
      } absolute inset-y-0 left-0 right-0 z-30 w-auto flex-col bg-white border-r border-slate-200 shadow-xs select-none md:static md:inset-auto md:h-full md:w-[360px] md:shrink-0 lg:w-[390px]`}
    >
      {/* Top Header: Map return, City Selector & Add Place */}
      <div className="p-3.5 pb-2.5 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
              title="Back to map"
              aria-label="Back to map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
          )}

          {/* City Dropdown Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCityPicker(!showCityPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              title="Switch city or region"
              aria-expanded={showCityPicker}
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span className="truncate max-w-[150px]">{activeCity.shortName || activeCity.name}</span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
            </button>

            {showCityPicker && (
              <div className="absolute top-11 left-0 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-[700] space-y-0.5 animate-scale-up">
                <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Select Region
                </span>
                {MINDANAO_CITY_PRESETS.map((city) => {
                  const isSelected = activeCity.id === city.id;
                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => {
                        onSelectCityPreset(city);
                        setShowCityPicker(false);
                        announce(`Selected ${city.name}`);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50 text-teal-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{city.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Action Button: Add Place */}
        {onOpenAddModal && (
          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex shrink-0 items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
            title="Contribute a new accessible place"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Place</span>
          </button>
        )}
      </div>

      {/* Prominent AI Agent Hub Card */}
      <div className="p-3 pb-2 shrink-0">
        <div className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-teal-50/50 to-white p-3 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="whitespace-nowrap text-xs font-bold text-slate-900">TanAW AI Agent</h3>
                  <span className="hidden sm:flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Online
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] text-slate-500">Gemini Vision & Semantic Assistant</p>
              </div>
            </div>

            {onOpenAIAnalyzer && (
              <button
                type="button"
                onClick={onOpenAIAnalyzer}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                title="Scan storefront photo with Gemini Vision"
              >
                <Camera className="w-3 h-3 text-amber-200" />
                <span>Scan Photo</span>
              </button>
            )}
          </div>

          {/* Quick AI Prompts */}
          <div className="mt-2.5 pt-2 border-t border-indigo-100/80">
            <span className="block text-[10px] font-bold text-indigo-900 uppercase tracking-wider mb-1.5">
              Ask AI Agent:
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESET_QUERIES.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => handleAskAI(q.prompt)}
                  className="px-2 py-0.5 rounded-md bg-white hover:bg-indigo-50 border border-indigo-200 text-[10.5px] font-medium text-slate-700 hover:text-indigo-900 transition-colors cursor-pointer"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* AI Response Box (Visible when a query is executed) */}
          {aiAgentResponse && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-indigo-200 text-xs shadow-xs animate-slide-up">
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  AI Analysis
                </span>
                <button
                  type="button"
                  onClick={handleClearAIQuery}
                  className="text-[10px] text-slate-400 hover:text-rose-600 font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
              <p className="text-[11px] text-slate-800 leading-relaxed">
                {aiAgentResponse.answer}
              </p>
              <div className="mt-2 flex items-center justify-between text-[10px] text-indigo-900 font-semibold bg-indigo-50/70 px-2 py-1 rounded">
                <span>{aiAgentResponse.matchedLocationIds.length} venues recommended</span>
                <span>Filtered on map</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search places, addresses..."
            className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-2 focus:outline-teal-600 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Clean Horizontal Scroll) */}
      <div className="px-3 py-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onCategoryChange(cat.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Quick Accessibility Filter Chips */}
      <div className="px-3 py-1.5 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {ACCESSIBILITY_QUICK_FILTERS.slice(0, 4).map((filter) => {
          const isActive = activeA11yFilters.includes(filter.id);
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onToggleA11yFilter(filter.id)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1 ${
                isActive
                  ? 'bg-teal-50 border-teal-300 text-teal-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {isActive && <Check className="w-2.5 h-2.5 text-teal-600" />}
              <span>{filter.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Subheader: Results count & Reset */}
      <div className="px-3 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 shrink-0">
        <span>
          <b className="font-semibold text-slate-800">{locations.length}</b>{' '}
          {locations.length === 1 ? 'place' : 'places'} found
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              onClearFilters();
              handleClearAIQuery();
            }}
            className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset filters</span>
          </button>
        )}
      </div>

      {/* Places List */}
      <div className="flex-1 overflow-y-auto p-3 pb-36 md:pb-3 space-y-2.5">
        {locations.length === 0 ? (
          isCompletelyEmpty ? (
            <div className="p-8 text-center bg-teal-50/40 rounded-2xl border border-dashed border-teal-200 space-y-2 mt-4">
              <div className="mx-auto w-10 h-10 rounded-xl bg-teal-100 text-teal-700 grid place-items-center">
                <MapPin className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Your map is empty</p>
              <p className="text-xs text-slate-500">
                Add your first accessible place to start building your map.
              </p>
              {onOpenAddModal && (
                <button
                  type="button"
                  onClick={onOpenAddModal}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add your first place</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2 mt-4">
              <p className="text-sm font-semibold text-slate-700">No places match your criteria</p>
              <p className="text-xs text-slate-400">
                Try choosing a different city or clearing the filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    onClearFilters();
                    handleClearAIQuery();
                  }}
                  className="mt-2 px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )
        ) : (
          locations.map((loc) => (
            <LocationCard
              key={loc.id}
              location={loc}
              isSelected={selectedLocation?.id === loc.id}
              onSelect={onSelectLocation}
              onOpenDetails={onOpenDetails}
              onRunAIScan={onRunAIScan}
              userCoords={userCoords}
              onToggleRoute={onToggleRoute}
              isRouteActive={activeRouteLocationId === loc.id}
            />
          ))
        )}
      </div>
    </aside>
  );
};
