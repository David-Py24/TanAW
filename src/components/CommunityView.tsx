/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { LocationPin } from '../types/accessibility';
import {
  AuthUser,
  REWARD_VOUCHERS,
  RewardVoucher,
  ClaimedVoucher,
  getClaimedVouchers,
  claimRewardVoucher,
  getUserBadges,
} from '../utils/storage';
import {
  Trophy,
  ShieldCheck,
  MapPin,
  Star,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  Gift,
  Ticket,
  Target,
  Copy,
  Check,
  Award,
} from 'lucide-react';

interface CommunityViewProps {
  locations: LocationPin[];
  currentUser: AuthUser;
  userVotesCount: number;
  onSelectLocationOnMap: (loc: LocationPin) => void;
}

const QUEST_BONUS_KEY = 'tanaw_completed_quests_v1';

interface BayanihanQuest {
  id: string;
  sponsor: string;
  title: string;
  description: string;
  rewardPoints: number;
  voucherPerk: string;
  currentCount: number;
  targetCount: number;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  locations,
  currentUser,
  userVotesCount,
  onSelectLocationOnMap,
}) => {
  const [claimedVouchers, setClaimedVouchers] = useState<ClaimedVoucher[]>(() =>
    getClaimedVouchers(currentUser.id)
  );
  const [claimedQuestIds, setClaimedQuestIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`${QUEST_BONUS_KEY}_${currentUser.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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

  // Count current user's authored reviews
  const myReviewsCount = useMemo(() => {
    const myKey = currentUser.name.trim().toLowerCase();
    return locations.reduce(
      (acc, loc) =>
        acc + loc.reviews.filter((r) => r.authorName.trim().toLowerCase() === myKey).length,
      0
    );
  }, [locations, currentUser.name]);

  // Bayanihan Bounties (Sponsored Community Mapping Quests)
  const quests: BayanihanQuest[] = useMemo(() => {
    const healthcareCount = locations.filter((l) => l.category === 'Healthcare').length;
    const aiScannedCount = locations.filter((l) => Boolean(l.aiSummary)).length;
    const diningCount = locations.filter(
      (l) => l.category === 'Dining & Cafe' && l.averageRating >= 4.0
    ).length;

    return [
      {
        id: 'quest-iligan-health',
        sponsor: 'Iligan City PDAO & Health Network',
        title: 'Verify Hospital & Pharmacy Entrances',
        description:
          'Confirm step-free ramps and drop-off zones for clinics and pharmacies across Iligan City & Mindanao.',
        rewardPoints: 45,
        voucherPerk: 'Unlocks Priority Medicine Delivery Pass',
        currentCount: Math.min(healthcareCount, 5),
        targetCount: 5,
      },
      {
        id: 'quest-ai-storefront',
        sponsor: 'TanAW × Gemini Vision Initiative',
        title: 'AI Storefront Barrier Audit',
        description:
          'Use the AI Storefront Scanner to detect steps, door widths, and ramps on local storefronts.',
        rewardPoints: 50,
        voucherPerk: 'Unlocks AI Vision Pioneer Badge + +50 pts',
        currentCount: Math.min(aiScannedCount, 6),
        targetCount: 6,
      },
      {
        id: 'quest-inclusive-cafes',
        sponsor: 'Mindanao Inclusive Merchants Guild',
        title: 'Step-Free Dining & Study Hub Mapping',
        description:
          'Verify wheelchair-accessible cafés with wide aisles and ground-floor restrooms.',
        rewardPoints: 35,
        voucherPerk: 'Unlocks ₱50 Partner Café Discount Voucher',
        currentCount: Math.min(diningCount, 4),
        targetCount: 4,
      },
    ];
  }, [locations]);

  const questBonusPoints = useMemo(() => {
    return quests
      .filter((q) => claimedQuestIds.includes(q.id))
      .reduce((sum, q) => sum + q.rewardPoints, 0);
  }, [quests, claimedQuestIds]);

  // Calculate user's total earned points & available redeemable balance
  const weightMultiplier =
    currentUser.role === 'PWD Member / Advocate' || currentUser.role === 'Caregiver / Family'
      ? 2
      : 1;

  const myTotalEarnedPoints =
    65 + myReviewsCount * 20 + userVotesCount * 10 * weightMultiplier + questBonusPoints;

  const spentPoints = useMemo(
    () => claimedVouchers.reduce((sum, v) => sum + v.costPoints, 0),
    [claimedVouchers]
  );

  const availablePoints = Math.max(0, myTotalEarnedPoints - spentPoints);

  const myBadges = useMemo(
    () => getUserBadges(currentUser.role, myReviewsCount, userVotesCount, true),
    [currentUser.role, myReviewsCount, userVotesCount]
  );

  const handleClaimQuest = (quest: BayanihanQuest) => {
    if (quest.currentCount < quest.targetCount || claimedQuestIds.includes(quest.id)) return;
    const next = [...claimedQuestIds, quest.id];
    setClaimedQuestIds(next);
    try {
      localStorage.setItem(`${QUEST_BONUS_KEY}_${currentUser.id}`, JSON.stringify(next));
    } catch (e) {
      console.error('Failed to save quest bonus:', e);
    }
  };

  const handleRedeemVoucher = (voucher: RewardVoucher) => {
    if (availablePoints < voucher.costPoints) return;
    const updated = claimRewardVoucher(currentUser.id, voucher);
    setClaimedVouchers(updated);
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  // Build dynamic contributor leaderboard from real reviews + currentUser
  const leaderboard = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        role: string;
        reviewsCount: number;
        points: number;
        isCurrentUser?: boolean;
      }
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

    // Ensure signed-in user is on the leaderboard with their live votes, reviews & quest points
    const myKey = currentUser.name.trim().toLowerCase();
    map.set(myKey, {
      name: currentUser.name,
      role: currentUser.role,
      reviewsCount: myReviewsCount,
      points: myTotalEarnedPoints,
      isCurrentUser: true,
    });

    return Array.from(map.values()).sort((a, b) => b.points - a.points);
  }, [locations, currentUser, myReviewsCount, myTotalEarnedPoints]);

  // Recent community reviews across Iligan & Mindanao
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
        {/* Top Hero Banner + Live Contributor Score & Badges */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                <Users className="w-3.5 h-3.5" />
                <span>Iligan City &amp; Mindanao PWD Network</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Community Impact, Bounties &amp; Rewards Hub
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Unlike standard maps, your verified accessibility scans and ramp checks earn real partner vouchers and weighted trust badges.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center shrink-0">
              <div className="px-2">
                <span className="block text-xl font-extrabold text-emerald-700">
                  {availablePoints} pts
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Your Balance</span>
              </div>
              <div className="px-2 border-x border-slate-200">
                <span className="block text-xl font-extrabold text-slate-900">
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

          {/* Signed-in User Specialty Badges Strip */}
          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Award className="w-4 h-4 text-indigo-600" />
                <span>Your Active Badges:</span>
              </span>
              {myBadges.map((badge) => (
                <span
                  key={badge.id}
                  title={badge.description}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${badge.colorClass}`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {badge.label}
                </span>
              ))}
            </div>

            <span className="text-[11px] font-semibold text-slate-500">
              {weightMultiplier === 2
                ? '★ Your tag votes count 2x (Verified PWD / Caregiver Role)'
                : 'Earn +30 pts per AI Scan • +20 pts per Review • +10 pts per Tag Vote'}
            </span>
          </div>
        </div>

        {/* PART 1.4: BAYANIHAN BOUNTIES (Sponsored Community Mapping Quests) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Bayanihan Bounties (Sponsored Mapping Quests)
                </h2>
                <p className="text-xs text-slate-500">
                  Complete local LGU and community quests across Iligan City &amp; Mindanao to earn bonus Impact Points.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-bold self-start sm:self-center">
              3 Active Quests
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quests.map((q) => {
              const isClaimed = claimedQuestIds.includes(q.id);
              const progressPct = Math.min(100, Math.round((q.currentCount / q.targetCount) * 100));
              const isReadyToClaim = q.currentCount >= q.targetCount && !isClaimed;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 truncate">
                        {q.sponsor}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 shrink-0">
                        +{q.rewardPoints} pts
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{q.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{q.description}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/80">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>
                        Community Progress: {q.currentCount}/{q.targetCount}
                      </span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClaimQuest(q)}
                      disabled={isClaimed || !isReadyToClaim}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        isClaimed
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 cursor-default'
                          : isReadyToClaim
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {isClaimed ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Bonus Claimed (+{q.rewardPoints} pts)</span>
                        </>
                      ) : isReadyToClaim ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Claim Quest Bonus (+{q.rewardPoints} pts)</span>
                        </>
                      ) : (
                        <span>
                          In Progress ({q.currentCount}/{q.targetCount})
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PART 1.1: REDEEMABLE PARTNER & AI VOUCHER MARKETPLACE ("Map-to-Earn" Perks) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Redeemable Partner &amp; AI Vouchers (&ldquo;Map-to-Earn&rdquo; Perks)
                </h2>
                <p className="text-xs text-slate-500">
                  Convert your TanAW Impact Score into real partner discounts, medicine delivery passes, and AI storefront audit credits.
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-extrabold self-start sm:self-center">
              Available Balance: {availablePoints} pts
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {REWARD_VOUCHERS.map((voucher) => {
              const claimed = claimedVouchers.find((c) => c.voucherId === voucher.id);
              const canAfford = availablePoints >= voucher.costPoints;

              return (
                <div
                  key={voucher.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                        {voucher.badgeText}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-800">
                        {voucher.costPoints} pts
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{voucher.title}</h3>
                    <p className="text-[11px] font-semibold text-slate-500">{voucher.partner}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{voucher.description}</p>
                  </div>

                  {claimed ? (
                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1.5">
                        <span className="font-mono text-xs font-extrabold text-emerald-900">
                          {claimed.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(claimed.code)}
                          className="text-emerald-800 hover:text-emerald-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode === claimed.code ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <span className="block text-[10px] text-center font-semibold text-emerald-700">
                        ✓ Saved in your Profile Wallet
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRedeemVoucher(voucher)}
                      disabled={!canAfford}
                      className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>
                        {canAfford
                          ? `Redeem (${voucher.costPoints} pts)`
                          : `Need ${voucher.costPoints - availablePoints} more pts`}
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2-Column Layout: Leaderboard + Recent Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Top Mappers Leaderboard with Specialty Badges */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs self-start">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Top Verified Mappers</h2>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">Impact Score</span>
            </div>

            <div className="space-y-2.5">
              {leaderboard.slice(0, 7).map((member, index) => {
                const badges = getUserBadges(
                  member.role,
                  member.reviewsCount,
                  member.reviewsCount,
                  index < 3 || Boolean(member.isCurrentUser)
                );

                return (
                  <div
                    key={member.name}
                    className={`p-3 rounded-2xl border flex flex-col gap-2 ${
                      member.isCurrentUser
                        ? 'bg-emerald-50/80 border-emerald-300'
                        : 'bg-slate-50 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
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

                    {/* Member Specialty Badges */}
                    <div className="flex flex-wrap gap-1 pl-10">
                      {badges.slice(0, 2).map((b) => (
                        <span
                          key={b.id}
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${b.colorClass}`}
                        >
                          {b.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
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
              {recentActivity.map((act) => {
                const authorEntry = leaderboard.find(
                  (m) => m.name.toLowerCase() === act.authorName.trim().toLowerCase()
                );
                const isPwdOrCaregiver =
                  authorEntry?.role === 'PWD Member / Advocate' ||
                  authorEntry?.role === 'Caregiver / Family';

                return (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {act.authorName}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Verified
                        </span>
                        {isPwdOrCaregiver ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold">
                            2x PWD Trust Weight
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                            Ramp &amp; Curb Scout
                          </span>
                        )}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
