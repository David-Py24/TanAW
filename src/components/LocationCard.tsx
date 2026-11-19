/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../types/accessibility';
import { calculateDistanceKm } from '../utils/storage';
import { Badge } from './ui/Badge';
import {
  Sparkles,
  Navigation,
  ArrowRight,
  MapPin,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface LocationCardProps {
  location: LocationPin;
  isSelected: boolean;
  onSelect: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  onRunAIScan: (loc: LocationPin) => void;
  userCoords?: { lat: number; lng: number } | null;
  onToggleRoute?: (loc: LocationPin) => void;
  isRouteActive?: boolean;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onSelect,
  onOpenDetails,
  onRunAIScan,
  userCoords,
  onToggleRoute,
  isRouteActive = false,
}) => {
  const distanceKm = userCoords
    ? calculateDistanceKm(userCoords.lat, userCoords.lng, location.lat, location.lng)
    : calculateDistanceKm(8.4822, 124.6473, location.lat, location.lng);

  const isCommunityVerified =
    location.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
    location.averageRating >= 4.0;

  const verifiedTags = location.tags.filter(
    (t) => t.confirmations >= 2 && t.confirmations > t.disputes
  );

  const displayTags = (verifiedTags.length > 0 ? verifiedTags : location.tags).slice(0, 3);

  const renderStatusBadge = () => {
    if (isCommunityVerified) {
      return (
        <Badge variant="verified" size="xs">
          ★ {location.averageRating.toFixed(1)} Verified
        </Badge>
      );
    }
    if (location.aiSummary) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
          <span>AI Audited</span>
        </span>
      );
    }
    if (location.averageRating < 2.5 && location.averageRating > 0) {
      return (
        <Badge variant="barrier" size="xs">
          Barriers
        </Badge>
      );
    }
    if (location.averageRating > 0) {
      return (
        <Badge variant="neutral" size="xs">
          ★ {location.averageRating.toFixed(1)}
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="xs">
        Unrated
      </Badge>
    );
  };

  // Selected State
  if (isSelected) {
    return (
      <article
        onClick={() => onSelect(location)}
        className="w-full bg-white rounded-2xl border-2 border-teal-600 shadow-md p-4 transition-all cursor-pointer relative text-left"
        role="region"
        aria-label={`Selected location: ${location.name}`}
      >
        {/* Title & Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {location.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
              <span className="font-semibold text-slate-700">{location.category}</span>
              <span>•</span>
              <span className="text-slate-400">{distanceKm} km away</span>
            </p>
          </div>
          <div className="shrink-0">{renderStatusBadge()}</div>
        </div>

        {/* Address */}
        <p className="text-xs text-slate-500 mt-2 line-clamp-1 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{location.address}</span>
        </p>

        {/* AI Agent Summary Callout */}
        {location.aiSummary && (
          <div className="mt-2.5 p-2 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-indigo-900">AI Agent Audit: </span>
              <span className="text-slate-700">{location.aiSummary}</span>
            </div>
          </div>
        )}

        {/* AI Barrier Callout */}
        {location.aiBarriers && location.aiBarriers.length > 0 && (
          <div className="mt-1.5 p-2 rounded-xl bg-rose-50/80 border border-rose-100 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-rose-900">Barrier Alert: </span>
              <span className="text-slate-700">{location.aiBarriers[0]}</span>
            </div>
          </div>
        )}

        {/* Tags */}
        {displayTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {displayTags.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600"
              >
                {tag.confirmations >= 2 && <Check className="w-2.5 h-2.5 text-emerald-600" />}
                <span className="truncate max-w-[130px]">{tag.name}</span>
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons Row */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            {onToggleRoute && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleRoute(location);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isRouteActive
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                }`}
                title="Preview route on map"
              >
                <Navigation className="w-3 h-3" />
                <span>{isRouteActive ? 'Clear Route' : 'Route'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRunAIScan(location);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Run AI Storefront Scan on this location"
            >
              <Sparkles className="w-3 h-3 text-indigo-600" />
              <span>AI Scan</span>
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(location);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ml-auto"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </article>
    );
  }

  // Normal Inactive Card
  return (
    <article
      onClick={() => onSelect(location)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(location);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`${location.name}, ${location.category}, rating ${
        location.averageRating > 0 ? location.averageRating.toFixed(1) : 'unrated'
      }`}
      className="w-full bg-white rounded-xl border border-slate-200/70 hover:border-slate-300 hover:shadow-xs p-3 sm:p-3.5 flex flex-col gap-2 transition-all cursor-pointer text-left focus:outline-2 focus:outline-teal-600"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900 truncate">
            {location.name}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 truncate">
            <span className="font-medium text-slate-600">{location.category}</span>
            <span>•</span>
            <span className="text-slate-400">{distanceKm} km</span>
          </p>
        </div>
        <div className="shrink-0">{renderStatusBadge()}</div>
      </div>

      {/* AI snippet preview if available */}
      {location.aiSummary && (
        <div className="flex items-center gap-1.5 text-[11px] text-indigo-900/80 bg-indigo-50/50 px-2 py-1 rounded-md line-clamp-1">
          <Sparkles className="w-3 h-3 text-indigo-600 shrink-0" />
          <span className="truncate">{location.aiSummary}</span>
        </div>
      )}

      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {displayTags.slice(0, 2).map((tag) => (
            <span
              key={tag.name}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-50 text-[10px] text-slate-500 border border-slate-100"
            >
              {tag.confirmations >= 2 && <Check className="w-2.5 h-2.5 text-emerald-600" />}
              <span className="truncate max-w-[120px]">{tag.name}</span>
            </span>
          ))}
        </div>
      )}
    </article>
  );
};
