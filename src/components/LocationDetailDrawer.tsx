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
      className="fixed inset-y-0 right-0 w-full sm:w-[480px] lg:w-[520px] bg-white shadow-2xl z-[1000] flex flex-col border-l border-slate-200 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            {location.category}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {location.name}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Share location"
            aria-label="Share location"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            title="Close details"
            aria-label="Close details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {copySuccess && (
        <div className="bg-emerald-600 text-white text-xs py-1.5 text-center font-medium">
          ✓ Copied location details to clipboard!
        </div>
      )}

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
      <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onRunAIScanOnPin(location)}
          className="flex-1 py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Scan Storefront Photo</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
