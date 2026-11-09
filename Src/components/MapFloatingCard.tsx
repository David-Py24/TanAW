/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../types/accessibility';
import { calculateDistanceKm } from '../utils/storage';
import { Badge } from './ui/Badge';
import { ArrowRight, X } from 'lucide-react';

interface MapFloatingCardProps {
  location: LocationPin | null;
  onOpenDetails: (loc: LocationPin) => void;
  onClose: () => void;
  userCoords: { lat: number; lng: number } | null;
}

export const MapFloatingCard: React.FC<MapFloatingCardProps> = ({
  location,
  onOpenDetails,
  onClose,
  userCoords,
}) => {
  if (!location) return null;

  const isCommunityVerified =
    location.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
    location.averageRating >= 4.0;

  const distanceKm = userCoords
    ? calculateDistanceKm(userCoords.lat, userCoords.lng, location.lat, location.lng)
    : calculateDistanceKm(8.4822, 124.6473, location.lat, location.lng);

  return (
    <div
      role="region"
      aria-label="Selected location quick status"
      className="absolute bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-6 md:left-8 md:right-8 max-w-4xl mx-auto z-[500] bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200/90 p-4 sm:p-5 transition-all animate-slide-up"
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight truncate">
            {location.name}
          </h3>

          {/* Status Badge */}
          {isCommunityVerified ? (
            <Badge variant="verified" size="xs">
              VERIFIED
            </Badge>
          ) : location.aiSummary ? (
            <Badge variant="ai-suggested" size="xs">
              AI SCAN
            </Badge>
          ) : location.averageRating < 2.5 && location.averageRating > 0 ? (
            <Badge variant="barrier" size="xs">
              BARRIERS
            </Badge>
          ) : (
            <Badge variant="neutral" size="xs">
              {location.averageRating > 0 ? `${location.averageRating.toFixed(1)} ★` : 'PENDING'}
            </Badge>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onOpenDetails(location)}
            className="px-3.5 sm:px-4 py-1.5 rounded-full border border-slate-300 hover:border-slate-900 text-slate-800 hover:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer bg-white shadow-2xs"
          >
            <span>Full Details & Tags</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Dismiss summary card"
            aria-label="Dismiss summary card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Divider */}
      <hr className="my-3 border-slate-200/80" />

      {/* 5-Column Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-left">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            District / Zone
          </span>
          <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
            Downtown CDO
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Category
          </span>
          <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
            {location.category}
          </span>
        </div>

        <div className="hidden sm:block">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Coordinates
          </span>
          <span className="block text-xs font-bold text-slate-800 font-mono truncate mt-0.5">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Distance
          </span>
          <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
            {distanceKm} km away
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Accessibility Score
          </span>
          <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
            {location.averageRating > 0 ? `${location.averageRating.toFixed(1)} / 5.0 ★` : 'Unrated'}
          </span>
        </div>
      </div>
    </div>
  );
};
