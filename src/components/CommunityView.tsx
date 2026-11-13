/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { LocationPin } from '../types/accessibility';
import { AuthUser } from '../utils/storage';
import {
  Trophy,
  ShieldCheck,
  MapPin,
  Star,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface CommunityViewProps {
  locations: LocationPin[];
  currentUser: AuthUser;
  userVotesCount: number;
  onSelectLocationOnMap: (loc: LocationPin) => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  locations,
  currentUser,
  userVotesCount,
  onSelectLocationOnMap,
}) => {
  // Compute community stats
  const totalVerifiedTags = useMemo(
    () =>
      locations.reduce(
        (acc, loc) =>
          acc + loc.tags.filter((t) => t.confirmations >= 2 && t.confirmations > t.disputes).length,
        0
      ),
    [locations]
  );

  const totalReviews = useMemo(
    () => locations.reduce((acc, loc) => acc + loc.reviews.length, 0),
    [locations]
  );

  // Build dynamic contributor leaderboard from real reviews + currentUser
  const leaderboard = useMemo(() => {
    const map = new Map<
      string,
      { name: string; role: string; reviewsCount: number; points: number; isCurrentUser?: boolean }
    >();

    // Seed baseline community verifiers
    map.set('maria santos', {
      name: 'Maria Santos',
      role: 'PWD Member / Advocate',
      reviewsCount: 14,
      points: 210,
    });
    map.set('carlo mendoza', {
      name: 'Carlo Mendoza',
      role: 'Community Mapper',
      reviewsCount: 11,
      points: 175,
    });
    map.set('dr. elena reyes', {
      name: 'Dr. Elena Reyes',
      role: 'Caregiver / Family',
      reviewsCount: 9,
      points: 140,
    });

    // Count actual reviews in locations
    locations.forEach((loc) => {
      loc.reviews.forEach((rev) => {
        const key = rev.authorName.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.reviewsCount += 1;
          existing.points += 15;
        } else {
          map.set(key, {
            name: rev.authorName,
            role: 'Community Mapper',
            reviewsCount: 1,
            points: 25,
          });
        }
      });
    });

    // Ensure signed-in user is on the leaderboard with their live votes & reviews
    const myKey = currentUser.name.trim().toLowerCase();
    const myEntry = map.get(myKey);
    if (myEntry) {
      myEntry.isCurrentUser = true;
      myEntry.role = currentUser.role;
      myEntry.points += userVotesCount * 10;
    } else {
      map.set(myKey, {
        name: currentUser.name,
        role: currentUser.role,
        reviewsCount: 0,
        points: 30 + userVotesCount * 10,
        isCurrentUser: true,
      });
    }

    return Array.from(map.values()).sort((a, b) => b.points - a.points);
  }, [locations, currentUser, userVotesCount]);

  // Recent community reviews across CDO & Mindanao
  const recentActivity = useMemo(() => {
    const items: Array<{
      id: string;
      authorName: string;
      rating: number;
      comment: string;
      date: string;
      location: LocationPin;
    }> = [];

    locations.slice(0, 12).forEach((loc) => {
      loc.reviews.forEach((rev) => {
        items.push({
          id: `${loc.id}-${rev.id}`,
          authorName: rev.authorName,
          rating: rev.rating,
          comment: rev.comment,
          date: rev.date,
          location: loc,
        });
      });
    });

    return items.slice(0, 8);
  }, [locations]);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 select-none">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Hero Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <Users className="w-3.5 h-3.5" />
              <span>Cagayan de Oro &amp; Mindanao PWD Network</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Community Leaderboard &amp; Live Verifications
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Every pin, photo scan, and tag vote is tied to a verified account to keep TanAW accurate and troll-free.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center shrink-0">
            <div className="px-2">
              <span className="block text-xl font-extrabold text-slate-900">
                {locations.length}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Places Mapped</span>
            </div>
            <div className="px-2 border-x border-slate-200">
              <span className="block text-xl font-extrabold text-emerald-700">
                {totalVerifiedTags}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Verified Tags</span>
            </div>
            <div className="px-2">
              <span className="block text-xl font-extrabold text-slate-900">
                {totalReviews}
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Reviews</span>
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Leaderboard + Recent Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Mappers Leaderboard */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs self-start">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Top Verified Mappers</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Impact Score</span>
            </div>

            <div className="space-y-2.5">
              {leaderboard.slice(0, 7).map((member, index) => (
                <div
                  key={member.name}
                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                    member.isCurrentUser
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-xl font-extrabold text-xs grid place-items-center shrink-0 ${
                        index === 0
                          ? 'bg-amber-400 text-slate-950'
                          : index === 1
                          ? 'bg-slate-300 text-slate-900'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-white border border-slate-200 text-slate-600'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {member.name}
                        </span>
                        {member.isCurrentUser && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-700 text-white text-[10px] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {member.role}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="block text-sm font-extrabold text-emerald-800">
                      {member.points} pts
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {member.reviewsCount} reports
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Community Reports & Reviews */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Recent Accessibility Reports
                </h2>
              </div>
              <span className="text-xs text-slate-400">Live from community</span>
            </div>

            <div className="space-y-3">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {act.authorName}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                        <span className="text-[11px] text-slate-400">• {act.date}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                        {act.location.name}
                      </h3>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold shrink-0">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {act.rating}.0
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {act.comment}
                  </p>

                  {act.location.aiSummary && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 text-[11px] font-semibold">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      <span>Includes Gemini AI Storefront Verification</span>
                    </div>
                  )}

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onSelectLocationOnMap(act.location)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Inspect on Map</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

