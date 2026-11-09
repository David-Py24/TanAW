/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_LOCATIONS } from '../data/initialLocations';
import { LocationPin, LocationTag, Review } from '../types/accessibility';

const STORAGE_KEY = 'accessmap_cdo_locations_v1';
const VOTES_KEY = 'accessmap_user_votes_v1';

export function loadLocations(): LocationPin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveLocations(INITIAL_LOCATIONS);
      return INITIAL_LOCATIONS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveLocations(INITIAL_LOCATIONS);
      return INITIAL_LOCATIONS;
    }
    // Add newly published seed venues to existing browsers without overwriting
    // user edits, ratings, or saved community contributions.
    const existingIds = new Set(parsed.map((location: LocationPin) => location.id));
    const newlySeeded = INITIAL_LOCATIONS.filter((location) => !existingIds.has(location.id));
    if (newlySeeded.length > 0) {
      const merged = [...parsed, ...newlySeeded];
      saveLocations(merged);
      return merged;
    }
    return parsed;
  } catch (err) {
    console.error('Failed to load locations from localStorage:', err);
    return INITIAL_LOCATIONS;
  }
}

export function saveLocations(locations: LocationPin[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch (err) {
    console.error('Failed to save locations to localStorage:', err);
  }
}

export function resetToSeedData(): LocationPin[] {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VOTES_KEY);
  } catch (e) {
    // ignore
  }
  saveLocations(INITIAL_LOCATIONS);
  return INITIAL_LOCATIONS;
}

export function getStoredUserVotes(): Record<string, 'confirm' | 'dispute'> {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveStoredUserVote(pinId: string, tagName: string, vote: 'confirm' | 'dispute' | null): void {
  try {
    const votes = getStoredUserVotes();
    const key = `${pinId}__${tagName}`;
    if (vote === null) {
      delete votes[key];
    } else {
      votes[key] = vote;
    }
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch (e) {
    console.error('Failed to save vote', e);
  }
}

/**
 * Color coding rules:
 * - Green = high rating (>= 4.0)
 * - Yellow = mid rating (2.5 - 3.9)
 * - Red = low rating (< 2.5)
 * - Grey = unrated (averageRating <= 0 or totalReviews === 0)
 */
export function getRatingColor(averageRating: number, totalReviews: number): {
  color: string;
  label: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  hex: string;
} {
  if (totalReviews === 0 || averageRating <= 0) {
    return {
      color: 'grey',
      label: 'Unrated',
      bgClass: 'bg-slate-400',
      borderClass: 'border-slate-500',
      textClass: 'text-slate-700',
      hex: '#94a3b8',
    };
  }

  if (averageRating >= 4.0) {
    return {
      color: 'green',
      label: 'High Accessibility',
      bgClass: 'bg-emerald-600',
      borderClass: 'border-emerald-700',
      textClass: 'text-emerald-700',
      hex: '#059669',
    };
  }

  if (averageRating >= 2.5) {
    return {
      color: 'yellow',
      label: 'Moderate Accessibility',
      bgClass: 'bg-amber-500',
      borderClass: 'border-amber-600',
      textClass: 'text-amber-800',
      hex: '#d97706',
    };
  }

  return {
    color: 'red',
    label: 'Low Accessibility / Barriers',
    bgClass: 'bg-rose-600',
    borderClass: 'border-rose-700',
    textClass: 'text-rose-700',
    hex: '#e11d48',
  };
}

/**
 * Calculates distance in kilometers between two GPS coordinates
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
