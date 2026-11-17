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
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

interface LocationCardProps {
  location: LocationPin;
  isSelected: boolean;
  onSelect: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  onRunAIScan: (loc: LocationPin) => void;
  userCoords?: { lat: number; lng: number } | null;
  onTogglePin?: (id: string) => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  onSelect,
  onOpenDetails,
  onRunAIScan,
  userCoords,
  onTogglePin,
}) => {
  const distanceKm = userCoords
    ? calculateDistanceKm(userCoords.lat, userCoords.lng, location.lat, location.lng)
    : calculateDistanceKm(8.4822, 124.6473, location.lat, location.lng);

  const isCommunityVerified =
    location.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
    location.averageRating >= 4.0;

  const verifiedTagCount = location.tags.filter(
    (t) => t.confirmations >= 2 && t.confirmations > t.disputes
  ).length;

  const topContributor =
    location.reviews && location.reviews.length > 0
      ? location.reviews[0].authorName
      : 'Community Volunteer';

  const renderStatusBadge = () => {
    if (isCommunityVerified) {
      return <Badge variant="verified">VERIFIED ACCESS</Badge>;
    }
    if (location.aiSummary) {
      return <Badge variant="ai-suggested">AI STOREFRONT SCAN</Badge>;
    }
    if (location.averageRating < 2.5 && location.averageRating > 0) {
      return <Badge variant="barrier">BARRIER REPORTED</Badge>;
    }
    return (
      <Badge variant="neutral">
        {location.averageRating > 0 ? `${location.averageRating.toFixed(1)} ★` : 'PENDING'}
      </Badge>
    );
  };

  // If selected, render the prominent expanded card
  if (isSelected) {
    return (
      <article
        data-location-id={location.id}
        onClick={() => onSelect(location)}
        className="w-full bg-white rounded-3xl border-2 border-slate-900 shadow-xl p-4 sm:p-5 transition-all cursor-pointer relative animate-scale-up"
        role="region"
        aria-label={`Selected location: ${location.name}`}
      >
        {/* Top Place Name & ID */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
              {location.name}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
              CDO-{location.id.replace('cdo-', '').toUpperCase()}
            </p>
          </div>
        </div>

        {/* Status Pill Badge & Pin Count Action */}
        <div className="mt-3 flex items-center justify-between gap-2">
          {renderStatusBadge()}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.(location.id);
            }}
            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
              location.isPinnedByMe
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs scale-[1.02]'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            }`}
            title={location.isPinnedByMe ? 'Pinned to my places (Click to unpin)' : 'Click to pin this place directly'}
          >
            <span>📌</span>
            <span>{location.isPinnedByMe ? 'Pinned' : 'Pin'}</span>
            <span className="text-[10px] opacity-80">({location.pinCount ?? 1})</span>
          </button>
        </div>

        {/* Progress / Rating indicator bar */}
        <div className="mt-3.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-lime-400 to-emerald-500 h-full rounded-full"
            style={{
              width: `${Math.min(100, Math.max(15, (location.averageRating / 5) * 100))}%`,
            }}
          />
        </div>

        {/* 4-Column Metric Grid */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-4 gap-2 text-left">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Category
            </span>
            <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
              {location.category.split(' ')[0]}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Score
            </span>
            <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
              {location.averageRating > 0 ? `${location.averageRating.toFixed(1)} ★` : '–'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Distance
            </span>
            <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
              {distanceKm} km
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Verified
            </span>
            <span className="block text-xs font-bold text-slate-800 truncate mt-0.5">
              {verifiedTagCount} Tags
            </span>
          </div>
        </div>

        {/* Reviewer / Contributor Row */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {topContributor.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                Auditor
              </span>
              <span className="block text-xs font-bold text-slate-800 truncate">
                {topContributor}
              </span>
            </div>
          </div>

          {/* Quick Action Circle Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRunAIScan(location);
              }}
              className="w-8 h-8 rounded-full border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Run Gemini AI Storefront Scan"
              aria-label="Run Gemini AI Storefront Scan on this location"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            </button>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-8 h-8 rounded-full border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Open directions"
              aria-label="Open Google Maps directions"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Accordion / Details button at bottom of active card */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(location);
          }}
          className="mt-3.5 pt-3 border-t border-slate-100 w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer"
        >
          <span>Accessibility tags & community reviews</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </article>
    );
  }

  // Normal Inactive Card
  return (
    <article
      data-location-id={location.id}
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
      className="w-full bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-xs p-4 flex items-center justify-between gap-3 transition-all cursor-pointer text-left focus:outline-2 focus:outline-sky-600"
    >
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-slate-900 truncate">
          {location.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
          <span className="font-medium text-slate-600">{location.category}</span>
          <span>•</span>
          <span className="font-mono text-slate-400">
            {distanceKm} km away
          </span>
          <span>•</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.(location.id);
            }}
            className={`font-bold px-2 py-0.5 rounded-full text-[11px] border transition-all cursor-pointer ${
              location.isPinnedByMe
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-2xs'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
            }`}
            title={location.isPinnedByMe ? 'Pinned to my places (Click to unpin)' : 'Click to pin this place'}
          >
            📌 {location.isPinnedByMe ? 'Pinned' : (location.pinCount ?? 1)}
          </button>
        </div>
      </div>

      {/* Status Pill on the Right */}
      <div className="shrink-0">
        {renderStatusBadge()}
      </div>
    </article>
  );
};
