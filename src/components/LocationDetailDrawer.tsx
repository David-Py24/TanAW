/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocationPin, Review } from '../types/accessibility';
import { useA11y } from '../context/A11yContext';
import { LocationOverviewCard } from './location-detail/LocationOverviewCard';
import { AiAnalysisSection } from './location-detail/AiAnalysisSection';
import { TagVotingList } from './location-detail/TagVotingList';
import { ReviewSection } from './location-detail/ReviewSection';
import { X, Share2, Sparkles } from 'lucide-react';

interface LocationDetailDrawerProps {
  location: LocationPin | null;
  onClose: () => void;
  onVoteTag: (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => void;
  onAddReview: (pinId: string, review: Omit<Review, 'id' | 'date'>) => void;
  onRunAIScanOnPin: (location: LocationPin) => void;
  onTogglePin?: (pinId: string) => void;
}

export const LocationDetailDrawer: React.FC<LocationDetailDrawerProps> = ({
  location,
  onClose,
  onVoteTag,
  onAddReview,
  onRunAIScanOnPin,
  onTogglePin,
}) => {
  const { announce } = useA11y();
  const [copySuccess, setCopySuccess] = useState(false);

  if (!location) return null;

  const handleShare = () => {
    const shareText = `Check out the accessibility ratings for ${location.name} in Cagayan de Oro on TanAW!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `${shareText} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
      );
      setCopySuccess(true);
      announce('Location details copied to clipboard');
      setTimeout(() => setCopySuccess(false), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Accessibility details for ${location.name}`}
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[520px] bg-white shadow-2xl z-[1000] flex flex-col border-l-[2px] border-[#0F172A] overflow-hidden font-space"
    >
      {/* Header matching sidebar pages */}
      <div className="p-4 sm:p-5 border-b-[1.5px] border-[#0F172A] bg-white flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 bg-[#E7F2F0] text-[#13332E] border border-[#21524B] rounded-full text-[10px] font-bold px-2.5 py-0.5">
            {location.category}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-[#0F172A] truncate mt-1">
            {location.name}
          </h2>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="btn-neo w-8 h-8 p-0"
            title="Share location"
            aria-label="Share location"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-neo w-8 h-8 p-0"
            title="Close details"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {copySuccess && (
        <div className="bg-[#21524B] text-white text-xs py-1.5 text-center font-bold border-b border-[#0F172A]">
          ✓ Copied location details to clipboard!
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 dot-grid-bg">
        <LocationOverviewCard location={location} onTogglePin={onTogglePin} />

        <AiAnalysisSection
          summary={location.aiSummary}
          barriers={location.aiBarriers}
        />

        <TagVotingList
          location={location}
          onVoteTag={onVoteTag}
          onAnnounce={announce}
        />

        <ReviewSection
          location={location}
          onAddReview={onAddReview}
          onAnnounce={announce}
        />
      </div>

      {/* Footer Quick Actions */}
      <div className="p-4 border-t-[1.5px] border-[#0F172A] bg-[#EAF3F7] flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onRunAIScanOnPin(location)}
          className="btn-neo btn-neo-accent btn-neo-glow flex-1 py-2.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Scan Storefront Photo</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="btn-neo py-2.5 px-4 text-xs sm:text-sm font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
};
