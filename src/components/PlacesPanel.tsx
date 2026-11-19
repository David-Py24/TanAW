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
      className="hidden md:flex w-full sm:w-[380px] md:w-[420px] lg:w-[440px] dot-grid-bg border-r-[1.8px] border-[#0F172A] flex-col h-full shrink-0 z-30 select-none shadow-[4px_0px_0px_#0F172A] font-space animate-slide-in-left"
    >
      {/* If viewing details and a location is selected, display fused details in the left sidebar */}
      {isViewingDetails && selectedLocation ? (
        <div className="flex flex-col h-full overflow-hidden animate-fade-in dot-grid-bg font-space">
          {/* Fused Details Header matching sidebar page top row */}
          <div className="p-3.5 sm:p-4 border-b-[1.8px] border-[#0F172A] bg-white flex items-center justify-between gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsViewingDetails(false);
                onSelectLocation(null);
                announce('Returned to locations list');
              }}
              className="btn-neo text-xs px-3.5 py-1.5"
              title="Back to all locations"
            >
              <ArrowLeft className="w-4 h-4 text-[#0F172A]" />
              <span>Back to Places</span>
            </button>

            <div className="flex items-center gap-2 shrink-0">
              {/* Direct Pin Button */}
              <button
                type="button"
                onClick={() => onTogglePin?.(selectedLocation.id)}
                className={`btn-neo text-xs px-3 py-1.5 ${
                  selectedLocation.isPinnedByMe ? 'btn-neo-accent' : ''
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
                className="btn-neo w-8 h-8 p-0"
                title="Share place"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Close Sidebar Button */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-neo w-8 h-8 p-0"
                  title="Close sidebar"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {copySuccess && (
            <div className="bg-[#21524B] text-white text-[11px] py-1.5 text-center font-bold border-b border-[#0F172A]">
              ✓ Copied location details to clipboard!
            </div>
          )}

          {/* Details Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <LocationOverviewCard location={selectedLocation} onTogglePin={onTogglePin} />

            <AiAnalysisSection
              summary={selectedLocation.aiSummary}
              barriers={selectedLocation.aiBarriers}
            />

            {/* AI Scan Action Button */}
            <button
              type="button"
              onClick={() => onRunAIScan(selectedLocation)}
              className="btn-neo btn-neo-accent btn-neo-glow w-full py-3 px-4 text-xs sm:text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
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
        /* Normal Locations List matching Contribution History feed */
        <div className="flex flex-col h-full overflow-hidden font-space">
          {/* Top Header matching reference */}
          <div className="p-4 sm:p-5 pb-3 border-b-[1.5px] border-[#0F172A] bg-white flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A]">
                Locations
              </h2>
              <span className="inline-flex items-center gap-1.5 bg-[#E7F2F0] text-[#13332E] border border-[#21524B] rounded-full text-[11px] font-bold px-2.5 py-0.5 shadow-[0_1px_0_#21524B]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#21524B]"></span>
                <span>{tabFilteredLocations.length} places</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`btn-neo w-8 h-8 p-0 ${
                  selectedTags.length > 0 || showFilters ? 'btn-neo-accent' : ''
                }`}
                title="Filter by accessibility tags"
                aria-label="Filter by accessibility tags"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onResetData}
                className="btn-neo w-8 h-8 p-0"
                title="Reset to Cagayan de Oro seed places"
                aria-label="More options"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    announce('Location details panel closed');
                  }}
                  className="btn-neo w-8 h-8 p-0"
                  title="Close location details panel"
                  aria-label="Close location details panel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Sidebar Tabs matching TanAW-Contribution-History-Page */}
          <div className="bg-white border-b-[1.5px] border-[#0F172A] px-4 pt-1 flex items-center gap-1 shrink-0 overflow-x-auto">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'all'}
              onClick={() => {
                setActiveTab('all');
                announce('Showing all locations');
              }}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-[3px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'all'
                  ? 'text-[#0F172A] border-[#21524B]'
                  : 'text-[#7B8AA0] hover:text-[#0F172A] border-transparent'
              }`}
            >
              All Places <em className="not-italic text-[11px] text-[#475569]">({locations.length})</em>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'verified'}
              onClick={() => {
                setActiveTab('verified');
                announce('Showing community verified locations');
              }}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-[3px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'verified'
                  ? 'text-[#0F172A] border-[#21524B]'
                  : 'text-[#7B8AA0] hover:text-[#0F172A] border-transparent'
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
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-[3px] transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'barriers'
                  ? 'text-[#0F172A] border-[#21524B]'
                  : 'text-[#7B8AA0] hover:text-[#0F172A] border-transparent'
              }`}
            >
              Barriers
            </button>
          </div>

          {/* Integrated Search Row matching .search pill */}
          <div className="p-3 bg-white/80 border-b border-[#D5E5EC] shrink-0">
            <label className="flex items-center gap-2 border-[1.5px] border-[#0F172A] bg-white rounded-full px-3.5 py-1.5 shadow-[0_2px_0_#0F172A] cursor-text">
              <Search className="w-4 h-4 text-[#475569] shrink-0" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search CDO locations or tags..."
                className="w-full bg-transparent text-xs sm:text-sm text-[#0F172A] placeholder:text-[#475569]/70 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="p-0.5 text-[#475569] hover:text-[#0F172A] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </label>

            {/* Expandable Tag Filters Accordion */}
            {showFilters && (
              <div className="mt-3 pt-2.5 border-t border-[#D5E5EC] space-y-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">
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

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {STANDARD_ACCESSIBILITY_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold flex items-center gap-1 border-[1.2px] border-[#0F172A] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#21524B] text-white shadow-[0_1px_0_#0F172A]'
                            : 'bg-[#EAF3F7] text-[#0F172A] hover:bg-white'
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
          <div ref={listContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 dot-grid-bg">
            {tabFilteredLocations.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-[16px] border-[1.8px] border-dashed border-[#0F172A] shadow-[0_3px_0_#0F172A] space-y-2">
                <p className="text-sm font-bold text-[#0F172A]">No matching places</p>
                <p className="text-xs text-[#475569]">
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
