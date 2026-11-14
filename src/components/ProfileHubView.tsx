/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LocationPin } from '../types/accessibility';
import {
  AuthUser,
  CommunityMessage,
  getCommunityMessages,
  sendCommunityMessage,
  updateUserProfile,
  getClaimedVouchers,
  getUserBadges,
} from '../utils/storage';
import {
  User,
  Bookmark,
  History,
  MessageSquare,
  MapPin,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  ArrowRight,
  Check,
  Ticket,
  Award,
  Copy,
} from 'lucide-react';

export type ProfileSubTab = 'account' | 'contributions' | 'saved' | 'messages';

interface ProfileHubViewProps {
  currentUser: AuthUser;
  onUpdateUser: (user: AuthUser) => void;
  locations: LocationPin[];
  savedPlaceIds: string[];
  onToggleSavePlace: (locationId: string) => void;
  userVotes: Record<string, 'confirm' | 'dispute'>;
  onSelectLocationOnMap: (loc: LocationPin) => void;
  initialSubTab?: ProfileSubTab;
}

export const ProfileHubView: React.FC<ProfileHubViewProps> = ({
  currentUser,
  onUpdateUser,
  locations,
  savedPlaceIds,
  onToggleSavePlace,
  userVotes,
  onSelectLocationOnMap,
  initialSubTab = 'account',
}) => {
  const [subTab, setSubTab] = useState<ProfileSubTab>(initialSubTab);

  // Account edit states
  const [nameInput, setNameInput] = useState(currentUser.name);
  const [roleInput, setRoleInput] = useState<AuthUser['role']>(currentUser.role);
  const [bioInput, setBioInput] = useState(
    currentUser.bio || 'Helping map step-free entrances and ramps across Cagayan de Oro.'
  );
  const [savedBanner, setSavedBanner] = useState(false);

  // Messages states
  const [messages, setMessages] = useState<CommunityMessage[]>(() => getCommunityMessages());
  const [newMessageText, setNewMessageText] = useState('');

  // Saved Places resolved objects
  const savedLocations = useMemo(
    () => locations.filter((loc) => savedPlaceIds.includes(loc.id)),
    [locations, savedPlaceIds]
  );

  // User Contributions (reviews & pins authored by currentUser.name)
  const userReviews = useMemo(() => {
    const list: Array<{ location: LocationPin; comment: string; rating: number; date: string }> = [];
    const targetName = currentUser.name.trim().toLowerCase();
    locations.forEach((loc) => {
      loc.reviews.forEach((rev) => {
        if (rev.authorName.trim().toLowerCase() === targetName) {
          list.push({
            location: loc,
            comment: rev.comment,
            rating: rev.rating,
            date: rev.date,
          });
        }
      });
    });
    return list;
  }, [locations, currentUser.name]);

  // User Votes resolved objects
  const userVotesList = useMemo(() => {
    return Object.entries(userVotes)
      .map(([key, vote]) => {
        const [pinId, tagName] = key.split('__');
        const loc = locations.find((l) => l.id === pinId);
        if (!loc) return null;
        return { location: loc, tagName, vote };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [userVotes, locations]);

  const claimedVouchers = useMemo(() => getClaimedVouchers(currentUser.id), [currentUser.id, subTab]);
  const userBadges = useMemo(
    () => getUserBadges(currentUser.role, userReviews.length, userVotesList.length, true),
    [currentUser.role, userReviews.length, userVotesList.length]
  );
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyVoucher = (code: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    const updated = updateUserProfile({
      ...currentUser,
      name: nameInput.trim(),
      role: roleInput,
      bio: bioInput.trim(),
    });
    onUpdateUser(updated);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    const next = sendCommunityMessage(currentUser.name, currentUser.role, newMessageText);
    setMessages(next);
    setNewMessageText('');
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#f8fafc] p-4 sm:p-8 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white font-extrabold text-2xl grid place-items-center shrink-0 uppercase shadow-xs">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {currentUser.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{currentUser.email}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center">
              <div className="px-2">
                <span className="block text-lg font-extrabold text-slate-900">
                  {userReviews.length}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Reviews/Pins</span>
              </div>
              <div className="px-2 border-x border-slate-200">
                <span className="block text-lg font-extrabold text-slate-900">
                  {userVotesList.length}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Tag Votes</span>
              </div>
              <div className="px-2">
                <span className="block text-lg font-extrabold text-emerald-700">
                  {claimedVouchers.length}
                </span>
                <span className="text-[11px] font-semibold text-slate-500">Vouchers</span>
              </div>
            </div>
          </div>

          {/* Unlocked Contributor Badges */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Unlocked Badges:</span>
            </span>
            {userBadges.map((b) => (
              <span
                key={b.id}
                title={b.description}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${b.colorClass}`}
              >
                <ShieldCheck className="w-3 h-3" />
                {b.label}
              </span>
            ))}
          </div>
        </div>

        {/* 4-Tab Navigation Bar: Account | Contribution History | Saved Places | Messages */}
        <div
          role="tablist"
          aria-label="Profile sections"
          className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'account'}
            onClick={() => setSubTab('account')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'account'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'contributions'}
            onClick={() => setSubTab('contributions')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'contributions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Contributions ({userReviews.length + userVotesList.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'saved'}
            onClick={() => setSubTab('saved')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'saved'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Places ({savedLocations.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'messages'}
            onClick={() => setSubTab('messages')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              subTab === 'messages'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Messages ({messages.length})</span>
          </button>
        </div>

        {/* 1. ACCOUNT SETTINGS TAB */}
        {subTab === 'account' && (
          <form
            onSubmit={handleSaveProfile}
            className="bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Account Details</h2>
                <p className="text-xs text-slate-500">
                  Your verified identity is shown on places you pin or review to prevent trolling.
                </p>
              </div>
              {savedBanner && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <Check className="w-3.5 h-3.5" />
                  Profile Saved
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Community Role
                </label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as AuthUser['role'])}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm font-medium text-slate-900 cursor-pointer"
                >
                  <option value="PWD Member / Advocate">PWD Member / Advocate</option>
                  <option value="Caregiver / Family">Caregiver / Family</option>
                  <option value="Community Mapper">Community Mapper</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Accessibility Bio / Focus
              </label>
              <textarea
                rows={3}
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-sm text-slate-900 resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                Save Account Changes
              </button>
            </div>
          </form>
        )}

        {/* 2. CONTRIBUTION HISTORY TAB */}
        {subTab === 'contributions' && (
          <div className="space-y-6">
            {/* Claimed Partner & AI Vouchers Wallet */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Your Claimed Partner &amp; AI Vouchers ({claimedVouchers.length})
                  </h2>
                </div>
                <span className="text-xs text-slate-400">Redeem more in Community Hub</span>
              </div>

              {claimedVouchers.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500 py-3">
                  You haven’t redeemed any partner or AI vouchers yet. Visit the <strong>Community</strong> tab to spend your Impact Score on local discounts and AI audit credits!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {claimedVouchers.map((v) => (
                    <div
                      key={v.code}
                      className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between gap-2.5"
                    >
                      <div>
                        <span className="text-[11px] font-bold text-emerald-800">
                          {v.partner}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900">{v.title}</h3>
                      </div>

                      <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-xl px-3 py-1.5">
                        <span className="font-mono text-xs font-extrabold text-emerald-900">
                          {v.code}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyVoucher(v.code)}
                          className="text-emerald-800 hover:text-emerald-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedCode === v.code ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pinned Places & Reviews */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">
                Your Pinned Places &amp; Reviews ({userReviews.length})
              </h2>

              {userReviews.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500 py-4">
                  You haven’t pinned a place or submitted a written review yet. Use <strong>Pin a Place</strong> on the map to add your first contribution!
                </p>
              ) : (
                <div className="space-y-3">
                  {userReviews.map((item, idx) => (
                    <div
                      key={`${item.location.id}-${idx}`}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            {item.location.name}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {item.rating}.0
                          </span>
                          <span className="text-xs text-slate-400">{item.date}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-600">{item.comment}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectLocationOnMap(item.location)}
                        className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                        <span>View on Map</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tag Votes */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h2 className="text-base font-bold text-slate-900">
                Your Tag Verifications ({userVotesList.length})
              </h2>

              {userVotesList.length === 0 ? (
                <p className="text-xs sm:text-sm text-slate-500 py-4">
                  You haven’t voted Confirm or Dispute on any accessibility tags yet. Open any venue on the map to verify its features!
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userVotesList.map((v, i) => (
                    <div
                      key={`${v.location.id}-${v.tagName}-${i}`}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-slate-900 truncate">
                          {v.location.name}
                        </span>
                        <span className="block text-xs text-slate-600 truncate">
                          {v.tagName}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                          v.vote === 'confirm'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {v.vote === 'confirm' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            Confirmed
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-3 h-3" />
                            Disputed
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. SAVED PLACES TAB */}
        {subTab === 'saved' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Saved Accessible Places ({savedLocations.length})
              </h2>
              <p className="text-xs text-slate-500">
                Bookmark your go-to wheelchair-friendly venues for quick access.
              </p>
            </div>

            {savedLocations.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-200 space-y-2">
                <Bookmark className="w-7 h-7 text-slate-400 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No saved places yet</p>
                <p className="text-xs text-slate-500">
                  Tap the bookmark icon on any location card or detail drawer to save it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {savedLocations.map((loc) => (
                  <div
                    key={loc.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{loc.name}</h3>
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          {loc.averageRating.toFixed(1)}★
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {loc.category} • {loc.address}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <button
                        type="button"
                        onClick={() => onToggleSavePlace(loc.id)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectLocationOnMap(loc)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>View on Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. MESSAGES TAB */}
        {subTab === 'messages' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs flex flex-col">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Community Mapper Messages &amp; Coordination
              </h2>
              <p className="text-xs text-slate-500">
                Coordinate ramp checks, accessibility audits, and barrier alerts with fellow Cagayan de Oro mappers.
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isMe = msg.senderName.toLowerCase() === currentUser.name.toLowerCase();
                return (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-2xl border ${
                      isMe
                        ? 'bg-emerald-50/70 border-emerald-200 ml-6'
                        : 'bg-slate-50 border-slate-200 mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {msg.senderName}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                          {msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Post an accessibility update or ask fellow mappers..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-900"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

