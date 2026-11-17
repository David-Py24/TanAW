/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { LocationPin, CategoryType, Review } from '../types/accessibility';
import { STANDARD_ACCESSIBILITY_TAGS } from '../prompts/storefrontPrompt';
import { LocationCard } from './LocationCard';
import { LocationOverviewCard } from './location-detail/LocationOverviewCard';
import { AiAnalysisSection } from './location-detail/AiAnalysisSection';
import { TagVotingList } from './location-detail/TagVotingList';
import { ReviewSection } from './location-detail/ReviewSection';
import { getTagIcon } from '../utils/tagHelpers';
import { useA11y } from '../context/A11yContext';
import {
  MoreVertical,
  Search,
  X,
  SlidersHorizontal,
  Check,
  ArrowLeft,
  Share2,
  Sparkles,
} from 'lucide-react';

export type PlacesTab = 'all' | 'verified' | 'barriers';

interface PlacesPanelProps {
  locations: LocationPin[];
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin | null) => void;
  onOpenDetails: (loc: LocationPin) => void;
  onRunAIScan: (loc: LocationPin) => void;
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
  onClose?: () => void;
  onTogglePin?: (pinId: string) => void;
  onVoteTag?: (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => void;
  onAddReview?: (pinId: string, review: Omit<Review, 'id' | 'date'>) => void;
}

export const PlacesPanel: React.FC<PlacesPanelProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
  onRunAIScan,
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
  onClose,
  onTogglePin,
  onVoteTag,
  onAddReview,
}) => {
  const { announce } = useA11y();
  const [activeTab, setActiveTab] = useState<PlacesTab>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const listContainerRef = useRef<HTMLDivElement>(null);

  // When selectedLocation changes from outside (e.g. pin clicked), show fused details view
  useEffect(() => {
    if (selectedLocation) {
      setIsViewingDetails(true);
    }
  }, [selectedLocation?.id]);

  // Automatically scroll to the selected location card when list is active
  useEffect(() => {
    if (isOpen && !isViewingDetails && selectedLocation && listContainerRef.current) {
      const el = listContainerRef.current.querySelector(
        `[data-location-id="${selectedLocation.id}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [isOpen, isViewingDetails, selectedLocation?.id]);

  const handleShare = () => {
    if (!selectedLocation) return;
    const shareText = `Check out accessibility ratings for ${selectedLocation.name} on TanAW!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `${shareText} (${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)})`
      );
      setCopySuccess(true);
      announce('Location details copied to clipboard');
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  // Tab filtering logic
  const tabFilteredLocations = locations.filter((loc) => {
    if (activeTab === 'verified') {
      return (
        loc.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
        loc.averageRating >= 4.0
      );
    }
    if (activeTab === 'barriers') {
      return (
        (loc.aiBarriers && loc.aiBarriers.length > 0) ||
        (loc.averageRating > 0 && loc.averageRating < 3.0)
      );
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Locations list and filters"
      className="w-full sm:w-[380px] md:w-[420px] lg:w-[440px] bg-[#f8fafc] border-r border-slate-200/90 flex flex-col h-full shrink-0 z-30 select-none shadow-xl md:shadow-xs animate-slide-in-left"
    >
      {/* If viewing details and a location is selected, display fused details in the left sidebar */}
      {isViewingDetails && selectedLocation ? (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in bg-white">
          {/* Fused Details Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200/90 bg-slate-50/90 backdrop-blur-sm flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsViewingDetails(false);
                onSelectLocation(null);
                announce('Returned to locations list');
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 px-2 py-1 rounded-xl hover:bg-slate-200/70 transition-colors cursor-pointer"
              title="Back to all locations"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Places</span>
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Direct Pin Button */}
              <button
                type="button"
                onClick={() => onTogglePin?.(selectedLocation.id)}
                className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
                  selectedLocation.isPinnedByMe
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                }`}
                title={selectedLocation.isPinnedByMe ? 'Pinned (Click to unpin)' : 'Click to pin this place'}
              >
                <span>📌</span>
                <span>{selectedLocation.isPinnedByMe ? 'Pinned' : 'Pin'}</span>
                <span className="text-[10px] opacity-80">({selectedLocation.pinCount ?? 1})</span>
              </button>

              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Share place"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Close Sidebar Button */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {copySuccess && (
            <div className="bg-emerald-600 text-white text-[11px] py-1 text-center font-bold">
              ✓ Copied location details to clipboard!
            </div>
          )}

          {/* Details Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            <LocationOverviewCard location={selectedLocation} onTogglePin={onTogglePin} />

            <AiAnalysisSection
              summary={selectedLocation.aiSummary}
              barriers={selectedLocation.aiBarriers}
            />

            {/* AI Scan Action Button */}
            <button
              type="button"
              onClick={() => onRunAIScan(selectedLocation)}
              className="w-full py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Scan Storefront Photo with Gemini</span>
            </button>

            {onVoteTag && (
              <TagVotingList
                location={selectedLocation}
                onVoteTag={onVoteTag}
                onAnnounce={announce}
              />
            )}

            {onAddReview && (
              <ReviewSection
                location={selectedLocation}
                onAddReview={onAddReview}
                onAnnounce={announce}
              />
            )}
          </div>
        </div>
      ) : (
        /* Normal Locations List */
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Header matching reference "Packages" */}
          <div className="p-4 sm:p-5 pb-3 border-b border-slate-200/80 bg-white/70 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Locations
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {tabFilteredLocations.length}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                  selectedTags.length > 0 || showFilters
                    ? 'bg-sky-50 border-sky-300 text-sky-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
                title="Filter by accessibility tags"
                aria-label="Filter by accessibility tags"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onResetData}
                className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                title="Reset to Cagayan de Oro seed places"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    announce('Location details panel closed');
                  }}
                  className="w-9 h-9 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Close location details panel"
                  aria-label="Close location details panel"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Segmented Control Pill Switcher */}
          <div className="px-4 sm:px-5 py-3 bg-white/70 border-b border-slate-200/60 shrink-0">
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
                  setActiveTab('all');
                  announce('Showing all locations');
                }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
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
                  setActiveTab('verified');
                  announce('Showing community verified locations');
                }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
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
                  setActiveTab('barriers');
                  announce('Showing reported barriers');
                }}
                className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer text-center ${
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
                placeholder="Search CDO locations or tags..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-2 focus:outline-sky-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Expandable Tag Filters Accordion */}
            {showFilters && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200 space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Filter by Tag:
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

          {/* Cards List matching reference list spacing */}
          <div ref={listContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {tabFilteredLocations.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                <p className="text-sm font-bold text-slate-700">No matching places</p>
                <p className="text-xs text-slate-400">
                  Try adjusting your tab or clearing the search keyword.
                </p>
              </div>
            ) : (
              tabFilteredLocations.map((loc) => (
                <LocationCard
                  key={loc.id}
                  location={loc}
                  isSelected={selectedLocation?.id === loc.id}
                  onSelect={(l) => {
                    onSelectLocation(l);
                    setIsViewingDetails(true);
                  }}
                  onOpenDetails={(l) => {
                    onOpenDetails(l);
                    setIsViewingDetails(true);
                  }}
                  onRunAIScan={onRunAIScan}
                  onTogglePin={onTogglePin}
                  userCoords={userCoords}
                />
              ))
            )}
          </div>
        </div>
      )}
    </aside>
  );
};
