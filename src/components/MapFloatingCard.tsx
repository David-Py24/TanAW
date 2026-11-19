/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../types/accessibility';
import { calculateDistanceKm } from '../utils/storage';
import { DEFAULT_CDO_CENTER, RoutePreviewResult } from '../utils/routingAndSpatial';
import { Badge } from './ui/Badge';
import {
  X,
  Navigation,
  ArrowRight,
  MapPin,
  Clock,
  Check,
  Sparkles,
} from 'lucide-react';

interface MapFloatingCardProps {
  location: LocationPin | null;
  onOpenDetails: (loc: LocationPin) => void;
  onClose: () => void;
  userCoords: { lat: number; lng: number } | null;
  activeRoute?: RoutePreviewResult | null;
  isRoutingLoading?: boolean;
  onToggleRoutePreview?: (loc: LocationPin) => void;
}

export const MapFloatingCard: React.FC<MapFloatingCardProps> = ({
  location,
  onOpenDetails,
  onClose,
  userCoords,
  activeRoute = null,
  isRoutingLoading = false,
  onToggleRoutePreview,
}) => {
  if (!location) return null;

  const origin = userCoords || DEFAULT_CDO_CENTER;
  const distanceKm = calculateDistanceKm(origin.lat, origin.lng, location.lat, location.lng);

  const isCommunityVerified =
    location.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
    location.averageRating >= 4.0;

  const verifiedTags = location.tags.filter(
    (t) => t.confirmations >= 2 && t.confirmations > t.disputes
  );

  const displayTags = (verifiedTags.length > 0 ? verifiedTags : location.tags).slice(0, 2);

  return (
    <div
      role="region"
      aria-label="Selected place preview"
      className="absolute bottom-36 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[500] bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-3.5 transition-all animate-slide-up"
    >
      {/* Active Route banner if active */}
      {activeRoute && (
        <div className="mb-2.5 px-2.5 py-1.5 rounded-lg bg-teal-50 border border-teal-200/80 flex items-center justify-between text-xs text-teal-900 font-semibold">
          <div className="flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-teal-700" />
            <span>{activeRoute.distanceKm} km mobility route</span>
          </div>
          <span className="flex items-center gap-1 text-teal-750 font-bold">
            <Clock className="w-3 h-3" />
            ~{activeRoute.durationMinutes} min
          </span>
        </div>
      )}

      {/* Header: Title, Category & Dismiss button */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 truncate">
            {location.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
            <span className="font-medium text-slate-700">{location.category}</span>
            <span>•</span>
            <span className="text-slate-400">{distanceKm} km away</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          title="Dismiss card"
          aria-label="Dismiss card"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Middle row: Rating and tags */}
      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {isCommunityVerified ? (
          <Badge variant="verified" size="xs">
            ★ {location.averageRating.toFixed(1)} Verified
          </Badge>
        ) : location.averageRating > 0 ? (
          <Badge variant="neutral" size="xs">
            ★ {location.averageRating.toFixed(1)}
          </Badge>
        ) : (
          <Badge variant="neutral" size="xs">
            Unrated
          </Badge>
        )}

        {displayTags.map((tag) => (
          <span
            key={tag.name}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600"
          >
            {tag.confirmations >= 2 && <Check className="w-2.5 h-2.5 text-emerald-600" />}
            <span className="truncate max-w-[120px]">{tag.name}</span>
          </span>
        ))}
      </div>

      {/* AI Agent Insight */}
      {location.aiSummary && (
        <div className="mt-2 px-2 py-1 rounded-lg bg-indigo-50/80 border border-indigo-100 flex items-center gap-1.5 text-[11px] text-indigo-950">
          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
          <span className="truncate"><b>AI:</b> {location.aiSummary}</span>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        {onToggleRoutePreview && (
          <button
            type="button"
            onClick={() => onToggleRoutePreview(location)}
            disabled={isRoutingLoading}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeRoute
                ? 'bg-sky-600 text-white'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isRoutingLoading ? 'animate-spin' : ''}`} />
            <span>{activeRoute ? 'Clear Route' : 'Route'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onOpenDetails(location)}
          className="ml-auto px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>View Details</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
