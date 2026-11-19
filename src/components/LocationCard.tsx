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

  // If selected, render the prominent expanded card matching .card in contribution-history.html
  if (isSelected) {
    return (
      <article
        data-location-id={location.id}
        onClick={() => onSelect(location)}
        className="w-full bg-white rounded-[16px] border-[1.8px] border-[#0F172A] shadow-[0_4px_0_#0F172A] p-4 sm:p-5 transition-all cursor-pointer relative animate-scale-up font-space text-left"
        role="region"
        aria-label={`Selected location: ${location.name}`}
      >
        {/* Top Place Name & ID */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight truncate">
              {location.name}
            </h3>
            <p className="text-xs text-[#475569] font-mono mt-0.5 truncate">
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
            className={`btn-neo text-xs px-3 py-1 ${
              location.isPinnedByMe ? 'btn-neo-accent' : ''
            }`}
            title={location.isPinnedByMe ? 'Pinned to my places (Click to unpin)' : 'Click to pin this place directly'}
          >
            <span>📌</span>
            <span>{location.isPinnedByMe ? 'Pinned' : 'Pin'}</span>
            <span className="text-[10px] opacity-80">({location.pinCount ?? 1})</span>
          </button>
        </div>

        {/* Progress bar matching .bar in contribution-history.html */}
        <div className="my-3 w-full bg-[#E2E8F0] h-[5px] rounded-full overflow-hidden">
          <div
            className="bg-[#21524B] h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(15, (location.averageRating / 5) * 100))}%`,
            }}
          />
        </div>

        {/* 4-Column Metric Grid matching .kv in contribution-history.html */}
        <div className="pt-3 border-t border-[#D5E5EC] grid grid-cols-4 gap-2 text-left">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              Category
            </span>
            <span className="block text-xs font-bold text-[#0F172A] truncate mt-0.5">
              {location.category.split(' ')[0]}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              Score
            </span>
            <span className="block text-xs font-bold text-[#0F172A] truncate mt-0.5">
              {location.averageRating > 0 ? `${location.averageRating.toFixed(1)} ★` : '–'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              Distance
            </span>
            <span className="block text-xs font-bold text-[#0F172A] truncate mt-0.5">
              {distanceKm} km
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-bold uppercase tracking-wider text-[#475569]">
              Verified
            </span>
            <span className="block text-xs font-bold text-[#0F172A] truncate mt-0.5">
              {verifiedTagCount} Tags
            </span>
          </div>
        </div>

        {/* Reviewer / Contributor Row matching .foot in contribution-history.html */}
        <div className="mt-3.5 pt-3 border-t border-[#D5E5EC] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#21524B] text-white border-[1.2px] border-[#0F172A] shadow-[0_1px_0_#0F172A] flex items-center justify-center font-bold text-xs shrink-0">
              {topContributor.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-[#475569] font-bold">
                Auditor
              </span>
              <span className="block text-xs font-bold text-[#0F172A] truncate">
                {topContributor}
              </span>
            </div>
          </div>

          {/* Quick Action Circle Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRunAIScan(location);
              }}
              className="btn-neo w-8 h-8 p-0"
              title="Run Gemini AI Storefront Scan"
              aria-label="Run Gemini AI Storefront Scan on this location"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#21524B]" />
            </button>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="btn-neo w-8 h-8 p-0"
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
          className="mt-3 pt-3 border-t border-[#D5E5EC] w-full flex items-center justify-between text-xs font-bold text-[#0F172A] hover:text-[#21524B] transition-colors cursor-pointer"
        >
          <span>Accessibility tags & community reviews</span>
          <ChevronDown className="w-4 h-4 text-[#0F172A]" />
        </button>
      </article>
    );
  }

  // Normal Inactive Card matching .card in contribution-history.html
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
      className="w-full bg-white rounded-[16px] border-[1.8px] border-[#0F172A] shadow-[0_3px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 hover:shadow-[0_5px_0_#0F172A] p-4 flex items-center justify-between gap-3 transition-all cursor-pointer text-left font-space focus:outline-none focus:ring-2 focus:ring-[#21524B]"
    >
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-bold text-[#0F172A] truncate">
          {location.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-[#475569] flex-wrap">
          <span className="font-bold text-[#0F172A]">{location.category}</span>
          <span>•</span>
          <span className="font-mono text-[#475569]">
            {distanceKm} km away
          </span>
          <span>•</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.(location.id);
            }}
            className={`btn-neo text-[11px] px-2.5 py-0.5 ${
              location.isPinnedByMe ? 'btn-neo-accent' : ''
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
