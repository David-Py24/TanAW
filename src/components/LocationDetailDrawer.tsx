/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocationPin, Review } from '../types/accessibility';
import { getVenuePatronPerk } from '../utils/storage';
import { useA11y } from '../context/A11yContext';
import { LocationOverviewCard } from './location-detail/LocationOverviewCard';
import { AiAnalysisSection } from './location-detail/AiAnalysisSection';
import { TagVotingList } from './location-detail/TagVotingList';
import { ReviewSection } from './location-detail/ReviewSection';
import { X, Share2, Sparkles, Bookmark, ShieldCheck, Ticket, Copy, Check } from 'lucide-react';

interface LocationDetailDrawerProps {
  location: LocationPin | null;
  currentUserName?: string;
  isSaved?: boolean;
  onToggleSave?: (locationId: string) => void;
  onClose: () => void;
  onVoteTag: (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => void;
  onAddReview: (pinId: string, review: Omit<Review, 'id' | 'date'>) => void;
  onRunAIScanOnPin: (location: LocationPin) => void;
}

export const LocationDetailDrawer: React.FC<LocationDetailDrawerProps> = ({
  location,
  currentUserName,
  isSaved = false,
  onToggleSave,
  onClose,
  onVoteTag,
  onAddReview,
  onRunAIScanOnPin,
}) => {
  const { announce } = useA11y();
  const [copySuccess, setCopySuccess] = useState(false);
  const [copiedPerkCode, setCopiedPerkCode] = useState(false);

  if (!location) return null;

  const patronPerk = getVenuePatronPerk(location);

  const handleCopyPerkCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedPerkCode(true);
      announce(`Copied patron voucher code ${code}`);
      setTimeout(() => setCopiedPerkCode(false), 2000);
    }
  };

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
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[990]"
        aria-hidden="true"
      />
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
          {onToggleSave && (
            <button
              type="button"
              onClick={() => onToggleSave(location.id)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isSaved
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title={isSaved ? 'Saved in Profile' : 'Save place'}
              aria-label={isSaved ? 'Saved in Profile' : 'Save place'}
            >
              <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-emerald-700' : ''}`} />
            </button>
          )}
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
        <LocationOverviewCard location={location} />

        {/* Part 1.3: TanAW Verified Accessible Business Seal + Patron Discount Voucher */}
        {patronPerk && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-900">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{patronPerk.sealTitle}</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-[10px] font-bold text-emerald-800">
                <Ticket className="w-3 h-3" />
                <span>Patron Perk</span>
              </span>
            </div>

            <p className="text-xs text-emerald-900 leading-relaxed">
              {patronPerk.offer}
            </p>

            <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl px-3 py-2">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">
                  Show at Counter / Reception
                </span>
                <span className="font-mono text-xs sm:text-sm font-extrabold text-emerald-900">
                  {patronPerk.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyPerkCode(patronPerk.code)}
                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedPerkCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Voucher</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

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
          currentUserName={currentUserName}
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
    </>
  );
};
