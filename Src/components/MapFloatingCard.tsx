/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../types/accessibility';
import { calculateDistanceKm } from '../utils/storage';
import {
  DEFAULT_CDO_CENTER,
  RoutePreviewResult,
  extractDistrictOrCity,
} from '../utils/routingAndSpatial';
import { getTagIcon } from '../utils/tagHelpers';
import { Badge } from './ui/Badge';
import {
  ArrowRight,
  X,
  Navigation,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Clock,
} from 'lucide-react';

interface MapFloatingCardProps {
  location: LocationPin | null;
  onOpenDetails: (loc: LocationPin) => void;
  onClose: () => void;
  userCoords: { lat: number; lng: number } | null;
  activeRoute?: RoutePreviewResult | null;
  isRoutingLoading?: boolean;
  onToggleRoutePreview?: (loc: LocationPin) => void;
  onNavigateRelative?: (direction: 'prev' | 'next') => void;
  currentIndex?: number;
  totalFilteredCount?: number;
}

export const MapFloatingCard: React.FC<MapFloatingCardProps> = ({
  location,
  onOpenDetails,
  onClose,
  userCoords,
  activeRoute = null,
  isRoutingLoading = false,
  onToggleRoutePreview,
  onNavigateRelative,
  currentIndex = 0,
  totalFilteredCount = 1,
}) => {
  if (!location) return null;

  const isCommunityVerified =
    location.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
    location.averageRating >= 4.0;

  const origin = userCoords || DEFAULT_CDO_CENTER;
  const distanceKm = calculateDistanceKm(origin.lat, origin.lng, location.lat, location.lng);
  const districtOrCity = extractDistrictOrCity(location.address);
  const hasBarriers =
    (location.aiBarriers && location.aiBarriers.length > 0) ||
    (location.averageRating > 0 && location.averageRating < 2.5);

  const primaryPhoto = location.photos && location.photos.length > 0 ? location.photos[0] : null;
  const topTags = location.tags.slice(0, 4);

  return (
    <div
      role="region"
      aria-label="Selected location quick status"
      className="absolute bottom-4 sm:bottom-6 left-4 right-4 sm:left-6 sm:right-6 md:left-8 md:right-8 max-w-4xl mx-auto z-[500] bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200/90 p-4 sm:p-5 transition-all animate-slide-up"
    >
      {/* Active Route Preview Banner */}
      {activeRoute && (
        <div className="mb-3 px-3.5 py-2 rounded-2xl bg-sky-50 border border-sky-200/90 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-sky-950 font-bold">
            <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
              <Navigation className="w-3.5 h-3.5" />
            </span>
            <span>{activeRoute.summaryText}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-extrabold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{activeRoute.durationMinutes} min
            </span>
            {hasBarriers && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Barrier Advisory at Destination
              </span>
            )}
          </div>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {primaryPhoto && (
            <img
              src={primaryPhoto}
              alt={location.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border border-slate-200 shrink-0 hidden xs:block"
            />
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
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

            <p className="text-xs text-slate-500 truncate mt-0.5">{location.address}</p>
          </div>
        </div>

        {/* Action Buttons & Prev/Next Carousel Controls */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          {onNavigateRelative && totalFilteredCount > 1 && (
            <div className="flex items-center bg-slate-100 rounded-full p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => onNavigateRelative('prev')}
                className="p-1.5 rounded-full hover:bg-white text-slate-700 transition-colors cursor-pointer"
                title="Previous location"
                aria-label="Previous location"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-extrabold text-slate-600 tabular-nums">
                {currentIndex + 1}/{totalFilteredCount}
              </span>
              <button
                type="button"
                onClick={() => onNavigateRelative('next')}
                className="p-1.5 rounded-full hover:bg-white text-slate-700 transition-colors cursor-pointer"
                title="Next location"
                aria-label="Next location"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {onToggleRoutePreview && (
            <button
              type="button"
              onClick={() => onToggleRoutePreview(location)}
              disabled={isRoutingLoading}
              className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                activeRoute
                  ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                  : 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200'
              }`}
              title="Preview accessible route on map"
            >
              <Navigation className={`w-3.5 h-3.5 ${isRoutingLoading ? 'animate-spin' : ''}`} />
              <span>{activeRoute ? 'Clear Route' : 'Preview Route'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenDetails(location)}
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Full Details</span>
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

      {/* Interactive Tags & AI Insight Strip */}
      {(topTags.length > 0 || location.aiSummary || (location.aiBarriers && location.aiBarriers.length > 0)) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {topTags.map((tag) => (
            <span
              key={tag.name}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200/80 text-[11px] font-bold text-slate-700"
            >
              {getTagIcon(tag.name)}
              <span>{tag.name}</span>
              {tag.confirmations > 0 && (
                <span className="text-[10px] text-emerald-700 font-extrabold ml-0.5">
                  ✓{tag.confirmations}
                </span>
              )}
            </span>
          ))}

          {location.aiSummary && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 border border-purple-200 text-[11px] font-semibold text-purple-900 max-w-full truncate">
              <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{location.aiSummary}</span>
            </span>
          )}

          {location.aiBarriers && location.aiBarriers.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>{location.aiBarriers[0]}</span>
            </span>
          )}
        </div>
      )}

      {/* Horizontal Divider */}
      <hr className="my-3 border-slate-200/80" />

      {/* 5-Column Metric Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-left">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            City / District
          </span>
          <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
            {districtOrCity}
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
            {userCoords ? 'GPS Distance' : 'From CDO Center'}
          </span>
          <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
            {activeRoute ? `${activeRoute.distanceKm} km route` : `${distanceKm} km away`}
          </span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Accessibility Score
          </span>
          <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
            {location.averageRating > 0
              ? `${location.averageRating.toFixed(1)} / 5.0 ★ (${location.totalReviews})`
              : 'Unrated • Needs Review'}
          </span>
        </div>
      </div>
    </div>
  );
};
