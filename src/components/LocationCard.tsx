/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin } from '../types/accessibility';
import { calculateDistanceKm } from '../utils/storage';
import { getTagIcon } from '../utils/tagHelpers';
import { Badge } from './ui/Badge';
import { ArrowRight, Bookmark } from 'lucide-react';

interface LocationCardProps {
  location: LocationPin;
  isSelected: boolean;
  isSaved?: boolean;
  onToggleSave?: (locationId: string) => void;
  onSelect: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSelected,
  isSaved = false,
  onToggleSave,
  onSelect,
  onOpenDetails,
  userCoords,
}) => {
  const distanceKm = userCoords
    ? calculateDistanceKm(userCoords.lat, userCoords.lng, location.lat, location.lng)
    : calculateDistanceKm(8.4822, 124.6473, location.lat, location.lng);

  const isCommunityVerified =
    location.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
    location.averageRating >= 4.0;

  const renderStatusBadge = () => {
    if (isCommunityVerified) {
      return <Badge variant="verified" size="xs">VERIFIED</Badge>;
    }
    if (location.aiSummary) {
      return <Badge variant="ai-suggested" size="xs">AI SCAN</Badge>;
    }
    if (location.averageRating < 2.5 && location.averageRating > 0) {
      return <Badge variant="barrier" size="xs">BARRIER</Badge>;
    }
    return (
      <Badge variant="neutral" size="xs">
        {location.averageRating > 0 ? `${location.averageRating.toFixed(1)} ★` : 'UNRATED'}
      </Badge>
    );
  };

  const topTags = location.tags.slice(0, 2);

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
      aria-label={`${location.name}, ${location.category}, rating ${location.averageRating > 0 ? location.averageRating.toFixed(1) : 'unrated'
        }`}
      className={`w-full rounded-2xl border p-3.5 transition-all cursor-pointer text-left focus:outline-2 focus:outline-sky-600 ${isSelected
          ? 'bg-white border-2 border-slate-900 shadow-md'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
        }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-slate-900 truncate">
            {location.name}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 truncate">
            {location.category} • {distanceKm} km
            {location.averageRating > 0 && ` • ${location.averageRating.toFixed(1)}★ (${location.totalReviews})`}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {renderStatusBadge()}
          {onToggleSave && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(location.id);
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSaved
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isSaved ? 'Remove from Saved Places' : 'Save place'}
              aria-label={isSaved ? 'Remove from Saved Places' : 'Save place'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-700' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Top 2 tags preview */}
      {topTags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {topTags.map((tag) => (
            <span
              key={tag.name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-[11px] font-medium text-slate-700"
            >
              {getTagIcon(tag.name)}
              <span className="truncate max-w-[160px]">{tag.name}</span>
            </span>
          ))}
          {location.tags.length > 2 && (
            <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-[11px] font-semibold text-slate-400">
              +{location.tags.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Selected Quick Action */}
      {isSelected && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(location);
            }}
            className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Details, Reviews &amp; Vote</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </article>
  );
};
