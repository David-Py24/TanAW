/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { INITIAL_LOCATIONS } from '../data/initialLocations';
import { LocationPin, LocationTag, Review } from '../types/accessibility';

const STORAGE_KEY = 'accessmap_cdo_locations_v1';
const VOTES_KEY = 'accessmap_user_votes_v1';
const CURRENT_USER_KEY = 'accessmap_current_user_v1';
const USERS_LIST_KEY = 'accessmap_registered_users_v1';
const SAVED_PLACES_KEY = 'accessmap_saved_places_v1';
const MESSAGES_KEY = 'accessmap_community_messages_v1';
const VOUCHERS_KEY = 'tanaw_claimed_vouchers_v1';

export interface RewardVoucher {
  id: string;
  title: string;
  partner: string;
  description: string;
  costPoints: number;
  codePrefix: string;
  badgeText: string;
}

export interface ClaimedVoucher {
  voucherId: string;
  title: string;
  partner: string;
  code: string;
  claimedAt: string;
  costPoints: number;
}

export interface ContributorBadge {
  id: string;
  label: string;
  description: string;
  colorClass: string;
}

export const REWARD_VOUCHERS: RewardVoucher[] = [
  {
    id: 'vch-iligan-cafe',
    title: '₱50 Off + Free Upsize Voucher',
    partner: 'Inclusive Cafés (Iligan & CDO Partner Network)',
    description: 'Stackable on top of your statutory 20% PWD/Senior discount at TanAW-verified step-free cafés.',
    costPoints: 40,
    codePrefix: 'TANAW-CAFE',
    badgeText: 'Dining Perk',
  },
  {
    id: 'vch-pharmacy-pass',
    title: 'Free Priority Medicine Delivery Pass',
    partner: 'Mindanao Accessible Pharmacy Partners',
    description: 'Zero delivery fee for prescription & maintenance medicine orders within Iligan City & CDO.',
    costPoints: 60,
    codePrefix: 'TANAW-MEDS',
    badgeText: 'Healthcare',
  },
  {
    id: 'vch-ai-audit-credit',
    title: 'AI Storefront Certification Credit',
    partner: 'TanAW Business Accessibility Program',
    description: 'Sponsor or claim a priority Gemini AI Storefront Accessibility Seal for a local Mindanao shop.',
    costPoints: 50,
    codePrefix: 'TANAW-AISEAL',
    badgeText: 'AI Voucher',
  },
  {
    id: 'vch-ride-assist',
    title: '₱40 Step-Free Ride / Tricycle Assist Rebate',
    partner: 'Mindanao Inclusive Commute Initiative',
    description: 'Fare discount voucher for accessible terminal drop-offs at verified hospitals and public hubs.',
    costPoints: 75,
    codePrefix: 'TANAW-RIDE',
    badgeText: 'Transport',
  },
];

export function getClaimedVouchers(userId: string): ClaimedVoucher[] {
  try {
    const raw = localStorage.getItem(`${VOUCHERS_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as ClaimedVoucher[]) : [];
  } catch {
    return [];
  }
}

export function claimRewardVoucher(userId: string, voucher: RewardVoucher): ClaimedVoucher[] {
  const current = getClaimedVouchers(userId);
  const existing = current.find((c) => c.voucherId === voucher.id);
  if (existing) return current;

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const claimed: ClaimedVoucher = {
    voucherId: voucher.id,
    title: voucher.title,
    partner: voucher.partner,
    code: `${voucher.codePrefix}-${randomSuffix}`,
    claimedAt: new Date().toISOString().split('T')[0],
    costPoints: voucher.costPoints,
  };
  const next = [claimed, ...current];
  try {
    localStorage.setItem(`${VOUCHERS_KEY}_${userId}`, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save claimed voucher:', e);
  }
  return next;
}

export function getUserBadges(
  role: string,
  reviewsCount: number,
  votesCount: number,
  hasAiScans = true
): ContributorBadge[] {
  const badges: ContributorBadge[] = [];

  if (role === 'PWD Member / Advocate' || role === 'Caregiver / Family') {
    badges.push({
      id: 'lived-exp',
      label: '2x PWD Trust Weight',
      description: 'Verified PWD / Caregiver — tag confirmations carry 2x verification weight.',
      colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    });
  }

  if (hasAiScans) {
    badges.push({
      id: 'ai-pioneer',
      label: 'AI Vision Pioneer',
      description: 'Uses Gemini Vision AI to inspect entrances, steps, and ramps.',
      colorClass: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    });
  }

  if (votesCount >= 1 || reviewsCount >= 1) {
    badges.push({
      id: 'ramp-scout',
      label: 'Ramp & Curb Scout',
      description: 'Actively confirms step-free entrances and accessibility tags across Mindanao.',
      colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
    });
  }

  badges.push({
    id: 'trailblazer',
    label: 'Iligan & Mindanao Mapper',
    description: 'Verified contributor building a troll-free accessibility map.',
    colorClass: 'bg-sky-100 text-sky-900 border-sky-300',
  });

  return badges;
}

export function getVenuePatronPerk(location: LocationPin): {
  sealTitle: string;
  offer: string;
  code: string;
} | null {
  const hasVerifiedTags = location.tags.some(
    (t) => t.confirmations >= 2 && t.confirmations > t.disputes
  );
  const isQualifying =
    location.averageRating >= 4.0 && (hasVerifiedTags || Boolean(location.aiSummary));

  if (!isQualifying) return null;

  if (location.category === 'Dining & Cafe') {
    return {
      sealTitle: 'TanAW Verified Accessible Seal',
      offer: 'Free drink upsize or extra 5% patron perk on top of your 20% PWD/Senior discount.',
      code: 'TANAW-DINE5',
    };
  }
  if (location.category === 'Healthcare') {
    return {
      sealTitle: 'TanAW Verified Accessible Seal',
      offer: 'Priority step-free courtesy lane & zero-step drop-off assistance.',
      code: 'TANAW-CARE',
    };
  }
  return {
    sealTitle: 'TanAW Verified Accessible Seal',
    offer: 'Verified step-free entrance + priority PWD/Senior courtesy assistance at reception.',
    code: 'TANAW-ACCESS',
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'PWD Member / Advocate' | 'Caregiver / Family' | 'Community Mapper';
  bio?: string;
  createdAt: string;
}

export interface CommunityMessage {
  id: string;
  senderName: string;
  senderRole: string;
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: CommunityMessage[] = [
  {
    id: 'msg-1',
    senderName: 'Maria Santos',
    senderRole: 'PWD Member / Advocate',
    text: 'Welcome to TanAW CDO! Our team just verified the north entrance ramp and elevator access at Centrio Mall.',
    timestamp: 'Today, 9:15 AM',
  },
  {
    id: 'msg-2',
    senderName: 'Carlo Mendoza',
    senderRole: 'Community Mapper',
    text: 'Heads up for wheelchair users visiting Divisoria: the Gaston Park side curb cut is clear, but RN Abejuela St has ongoing sidewalk repairs.',
    timestamp: 'Today, 11:40 AM',
  },
  {
    id: 'msg-3',
    senderName: 'Dr. Elena Reyes',
    senderRole: 'Caregiver / Family',
    text: 'Thank you to everyone verifying hospital entrances in Northern Mindanao Medical Center—this helps our senior patients so much!',
    timestamp: 'Yesterday',
  },
];

interface StoredAccount extends AuthUser {
  password?: string;
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setCurrentUserSession(user: AuthUser | null): void {
  try {
    if (!user) {
      localStorage.removeItem(CURRENT_USER_KEY);
    } else {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Failed to save user session:', e);
  }
}

export function getRegisteredAccounts(): StoredAccount[] {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount[]) : [];
  } catch {
    return [];
  }
}

export function registerAccount(
  name: string,
  email: string,
  password: string,
  role: AuthUser['role']
): { user?: AuthUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  if (accounts.some((acc) => acc.email.toLowerCase() === cleanEmail)) {
    return { error: 'An account with this email already exists. Please sign in.' };
  }

  const newAccount: StoredAccount = {
    id: `usr-${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    role,
    password,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify([...accounts, newAccount]));
  } catch (e) {
    console.error('Failed to save account:', e);
  }

  const { password: _, ...publicUser } = newAccount;
  setCurrentUserSession(publicUser);
  return { user: publicUser };
}

export function signInAccount(
  email: string,
  password: string
): { user?: AuthUser; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  const found = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

  if (!found) {
    return { error: 'No account found for this email. Create an account first.' };
  }
  if (found.password && found.password !== password) {
    return { error: 'Incorrect password. Please try again.' };
  }

  const { password: _, ...publicUser } = found;
  setCurrentUserSession(publicUser);
  return { user: publicUser };
}

export function updateUserProfile(updated: AuthUser): AuthUser {
  setCurrentUserSession(updated);
  try {
    const accounts = getRegisteredAccounts();
    const next = accounts.map((acc) =>
      acc.id === updated.id ? { ...acc, ...updated } : acc
    );
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to update user in accounts list:', e);
  }
  return updated;
}

export function getSavedPlaceIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${SAVED_PLACES_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleSavedPlaceId(userId: string, locationId: string): string[] {
  const current = getSavedPlaceIds(userId);
  const next = current.includes(locationId)
    ? current.filter((id) => id !== locationId)
    : [locationId, ...current];
  try {
    localStorage.setItem(`${SAVED_PLACES_KEY}_${userId}`, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save bookmarked place:', e);
  }
  return next;
}

export function getCommunityMessages(): CommunityMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    return raw ? (JSON.parse(raw) as CommunityMessage[]) : INITIAL_MESSAGES;
  } catch {
    return INITIAL_MESSAGES;
  }
}

export function sendCommunityMessage(
  senderName: string,
  senderRole: string,
  text: string
): CommunityMessage[] {
  const current = getCommunityMessages();
  const newMsg: CommunityMessage = {
    id: `msg-${Date.now()}`,
    senderName,
    senderRole,
    text: text.trim(),
    timestamp: 'Just now',
  };
  const next = [...current, newMsg];
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
  } catch (e) {
    console.error('Failed to save message:', e);
  }
  return next;
}

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

const VOTE_WEIGHTS_KEY = 'accessmap_user_vote_weights_v1';

export function getStoredUserVotes(): Record<string, 'confirm' | 'dispute'> {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getStoredVoteWeight(pinId: string, tagName: string): number {
  try {
    const raw = localStorage.getItem(VOTE_WEIGHTS_KEY);
    const weights: Record<string, number> = raw ? JSON.parse(raw) : {};
    return weights[`${pinId}__${tagName}`] || 1;
  } catch {
    return 1;
  }
}

export function saveStoredUserVote(
  pinId: string,
  tagName: string,
  vote: 'confirm' | 'dispute' | null,
  weight = 1
): void {
  try {
    const votes = getStoredUserVotes();
    const rawWeights = localStorage.getItem(VOTE_WEIGHTS_KEY);
    const weights: Record<string, number> = rawWeights ? JSON.parse(rawWeights) : {};
    const key = `${pinId}__${tagName}`;
    if (vote === null) {
      delete votes[key];
      delete weights[key];
    } else {
      votes[key] = vote;
      weights[key] = weight;
    }
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
    localStorage.setItem(VOTE_WEIGHTS_KEY, JSON.stringify(weights));
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

/**
 * Compresses an uploaded image file to a lightweight JPEG data URL (max 800px)
 * so it fits safely within browser localStorage (5MB) and Firestore (1MB) limits.
 */
export function compressImageFile(file: File, maxDimension = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}
