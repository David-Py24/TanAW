/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../../types/accessibility';
import { getRatingColor } from '../../utils/storage';
import { StarRating } from '../ui/StarRating';
import { MapPin, ExternalLink } from 'lucide-react';

interface LocationOverviewCardProps {
  location: LocationPin;
  onTogglePin?: (pinId: string) => void;
}

export const LocationOverviewCard: React.FC<LocationOverviewCardProps> = ({
  location,
  onTogglePin,
}) => {
  const ratingMeta = getRatingColor(location.averageRating, location.totalReviews);

  return (
    <div className="space-y-4 font-space">
      {/* Photos Carousel / Thumbnail */}
      {location.photos && location.photos.length > 0 && (
        <div className="rounded-[18px] overflow-hidden border-[1.8px] border-[#0F172A] shadow-[0_3px_0_#0F172A] relative aspect-video bg-[#EAF3F7]">
          <img
            src={location.photos[0]}
            alt={`Entrance view of ${location.name}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2.5 left-2.5 px-3 py-1 bg-[#0F172A]/85 text-white text-xs rounded-xl font-bold border border-white/20">
            Verified Entrance View
          </div>
        </div>
      )}

      {/* Address & Navigation matching .tile in sidebar pages */}
      <div className="bg-white p-3.5 sm:p-4 rounded-[14px] border-[1.8px] border-[#0F172A] shadow-[0_2px_0_#0F172A] flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-4 h-4 text-[#21524B] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-[#0F172A]">
            <p className="font-bold text-[#0F172A]">{location.address}</p>
            <p className="text-[#475569] text-xs mt-0.5 font-mono">
              Coordinates: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>
        </div>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-neo text-xs px-3.5 py-1.5"
        >
          <span>Directions</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Pin Count & Community Interest Banner matching .chip */}
      <div className="bg-[#E7F2F0] p-3.5 rounded-[14px] border border-[#21524B]/35 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#21524B] text-white border-[1.5px] border-[#0F172A] shadow-[0_1.5px_0_#0F172A] flex items-center justify-center font-bold text-sm shrink-0">
            📌
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#13332E] flex items-center gap-1.5 flex-wrap">
              <span>Pinned by {location.pinCount ?? 1} {location.pinCount === 1 ? 'user' : 'users'}</span>
              {location.isPinnedByMe && (
                <span className="text-[10px] bg-[#21524B] text-white font-extrabold px-2 py-0.5 rounded-full border border-[#0F172A]">
                  PINNED BY YOU
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#21524B] font-bold truncate mt-0.5">
              Community interest and bookmark indicator
            </p>
          </div>
        </div>

        {onTogglePin && (
          <button
            type="button"
            onClick={() => onTogglePin(location.id)}
            className={`btn-neo text-xs px-3 py-1.5 ${
              location.isPinnedByMe ? 'btn-neo-accent' : ''
            }`}
            title={location.isPinnedByMe ? 'Click to unpin this location' : 'Click to pin this location'}
          >
            <span>📌</span>
            <span>{location.isPinnedByMe ? 'Pinned' : 'Pin Place'}</span>
          </button>
        )}
      </div>

      {/* Overall Accessibility Score Banner matching .stats block */}
      <div className="bg-white p-4 rounded-[16px] border-[1.8px] border-[#0F172A] shadow-[0_3px_0_#0F172A] flex items-center justify-between gap-4 font-space">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-[#475569]">
            Overall Accessibility Rating
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-[#0F172A]">
              {location.averageRating > 0 ? location.averageRating.toFixed(1) : '–'}
            </span>
            <span className="text-sm font-bold text-[#475569]">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-amber-500">
            <StarRating value={location.averageRating} size="sm" />
            <span className="text-xs font-bold text-[#475569] ml-1.5">
              ({location.totalReviews} {location.totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-1.5 bg-[#E7F2F0] text-[#13332E] border border-[#21524B] rounded-full text-xs font-bold px-3 py-1.5 shadow-[0_1px_0_#21524B]"
        >
          {ratingMeta.label}
        </div>
      </div>
    </div>
  );
};

