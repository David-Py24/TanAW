/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useA11y } from '../context/A11yContext';
import { AuthSession, getDisplayName, getInitials } from '../utils/auth';

export interface SidebarRailProps {
  session: AuthSession;
  onSignOut: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAIAnalyzer: () => void;
  onOpenAddModal?: () => void;
  onResetData?: () => void;
  onToggleFilterPanel: () => void;
  isFilterPanelOpen: boolean;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  session,
  onSignOut,
  activeTab,
  onTabChange,
  onOpenAIAnalyzer,
  onOpenAddModal,
  onToggleFilterPanel,
  isFilterPanelOpen,
}) => {
  const [isCollapsedPreference, setIsCollapsedPreference] = useState<boolean>(true);
  const [isCompactRail, setIsCompactRail] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const [inviteCopied, setInviteCopied] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { announce } = useA11y();

  // Phones keep the rail in icon-only mode so the panel and map keep their width.
  const isCollapsed = isCompactRail || isCollapsedPreference;

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => setIsCompactRail(event.matches);

    setIsCompactRail(query.matches);
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  // The "More" sheet only exists on phones; close it if the viewport grows.
  useEffect(() => {
    if (!isCompactRail) setIsMobileMenuOpen(false);
  }, [isCompactRail]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  const displayName = getDisplayName(session);
  const initials = getInitials(session);
  const roleLabel = session.guest ? 'Guest session' : 'Community Mapper';

  const handleSignOut = () => {
    announce('Signed out of TanAW.');
    onSignOut();
  };

  const handleInviteClick = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.origin);
    }
    setInviteCopied(true);
    announce('Invite link copied to clipboard.');
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const handleNavClick = (tabId: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (tabId === 'vision') {
      onOpenAIAnalyzer();
      return;
    }
    if (tabId === 'filters') {
      onToggleFilterPanel();
      return;
    }
    onTabChange(tabId);
    announce(`Navigated to ${tabId}`);
  };

  const handleMenuNav = (tabId: string) => {
    setIsMobileMenuOpen(false);
    handleNavClick(tabId);
  };

  const isMoreActive =
    isMobileMenuOpen ||
    ['profile', 'community', 'contributions', 'messages', 'settings', 'landing'].includes(
      activeTab
    );

  return (
    <>
      {/* SVG Icon Definition Sprite */}
      <svg width="0" height="0" className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <symbol id="i-globe" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" />
          </symbol>
          <symbol id="i-grid" viewBox="0 0 24 24">
            <rect x="4" y="4" width="7" height="7" rx="1.5" />
            <rect x="13" y="4" width="7" height="7" rx="1.5" />
            <rect x="4" y="13" width="7" height="7" rx="1.5" />
            <rect x="13" y="13" width="7" height="7" rx="1.5" />
          </symbol>
          <symbol id="i-chat" viewBox="0 0 24 24">
            <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
            <path d="M9 12h.01M12 12h.01M15 12h.01" />
          </symbol>
          <symbol id="i-user" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </symbol>
          <symbol id="i-bars" viewBox="0 0 24 24">
            <path d="M6 20V11M12 20V5M18 20v-7" />
          </symbol>
          <symbol id="i-pin" viewBox="0 0 24 24">
            <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
            <circle cx="12" cy="9.5" r="2.5" />
          </symbol>
          <symbol id="i-bookmark" viewBox="0 0 24 24">
            <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z" />
          </symbol>
          <symbol id="i-sidebar" viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M9 4v16" />
          </symbol>
          <symbol id="i-chev" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" />
          </symbol>
          <symbol id="i-sparkle" viewBox="0 0 24 24">
            <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
          </symbol>
          <symbol id="i-sliders" viewBox="0 0 24 24">
            <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
            <circle cx="16" cy="7" r="2" />
            <circle cx="8" cy="17" r="2" />
          </symbol>
          <symbol id="i-tag" viewBox="0 0 24 24">
            <path d="M3 12V4h8l10 10-8 8z" />
            <circle cx="7.5" cy="8.5" r="1" />
          </symbol>
          <symbol id="i-plus" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </symbol>
          <symbol id="i-door" viewBox="0 0 24 24">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
          </symbol>
        </defs>
      </svg>

      <aside
        aria-label="Primary Navigation"
        className={`bg-white border-r border-slate-200 flex flex-col shrink-0 select-none overflow-y-auto overflow-x-hidden min-h-0 z-40 transition-all duration-200 ${
          isCollapsed ? 'w-[64px] p-3' : 'w-[220px] p-4'
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between pb-3 ${
            isCollapsed ? 'flex-col gap-2' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => handleNavClick('map')}
            className="flex items-center gap-2 font-bold text-base tracking-tight text-slate-900 text-left cursor-pointer group"
            title="TanAW / AccessMap"
            aria-label="TanAW / AccessMap"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white grid place-items-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-4 h-4 fill-none stroke-current stroke-[2] stroke-linecap-round stroke-linejoin-round">
                <use href="#i-pin" />
              </svg>
            </div>
            {!isCollapsed && <span className="whitespace-nowrap font-bold text-slate-900">TanAW</span>}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsedPreference(!isCollapsedPreference)}
            className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-4 h-4 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-sidebar" />
            </svg>
          </button>
        </div>

        {/* Workspace Card */}
        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          className={`w-full text-left bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl mb-3 flex items-center cursor-pointer transition-colors ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 p-2'
          }`}
          title={`${displayName}${session.guest ? ' - Guest session' : ` - ${session.email}`}`}
          aria-label={`Workspace: ${displayName}`}
        >
          <span
            className={`w-6 h-6 rounded-full text-white grid place-items-center font-bold text-[10px] shrink-0 ${
              session.guest ? 'bg-slate-600' : 'bg-teal-700'
            }`}
          >
            {initials}
          </span>
          {!isCollapsed && (
            <>
              <div className="overflow-hidden min-w-0">
                <b className="block text-xs leading-tight text-slate-800 font-semibold truncate">
                  {displayName}
                </b>
                <small className="block text-slate-400 text-[10px] truncate">{roleLabel}</small>
              </div>
              <svg className="ml-auto text-slate-400 w-3.5 h-3.5 shrink-0 fill-none stroke-current stroke-[1.8]">
                <use href="#i-chev" />
              </svg>
            </>
          )}
        </button>

        {/* Primary Views */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={(e) => handleNavClick('map', e)}
            className={`flex items-center gap-2.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'map'
                ? 'bg-teal-50 text-teal-900 font-semibold'
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            } ${isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2'}`}
            title="Interactive Map"
          >
            <svg className={`w-4 h-4 shrink-0 fill-none stroke-current stroke-[1.8] ${activeTab === 'map' ? 'text-teal-700' : ''}`}>
              <use href="#i-pin" />
            </svg>
            {!isCollapsed && <span>Map View</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('vision', e)}
            className={`flex items-center gap-2.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-all bg-indigo-50/70 hover:bg-indigo-100/80 text-indigo-900 font-semibold border border-indigo-200/70 shadow-2xs ${
              isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2'
            }`}
            title="TanAW AI Agent (Gemini Storefront Analyzer)"
          >
            <svg className="w-4 h-4 shrink-0 text-indigo-600 fill-none stroke-current stroke-[1.8]">
              <use href="#i-sparkle" />
            </svg>
            {!isCollapsed && (
              <>
                <span>AI Agent</span>
                <span className="ml-auto text-[9px] font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                  SCAN
                </span>
              </>
            )}
          </button>

          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className={`flex items-center gap-2.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-colors text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 ${
                isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2'
              }`}
              title="Add a New Place"
            >
              <svg className="w-4 h-4 shrink-0 text-teal-600 fill-none stroke-current stroke-[1.8]">
                <use href="#i-plus" />
              </svg>
              {!isCollapsed && <span>Add Place</span>}
            </button>
          )}
        </div>

        {/* Section Divider */}
        <div className={isCollapsed ? 'my-2.5 h-px bg-slate-100 w-full' : 'my-3 h-px bg-slate-100 w-full'} />

        {/* Community & Personal */}
        {!isCollapsed && (
          <span className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Community
          </span>
        )}

        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={(e) => handleNavClick('community', e)}
            className={`flex items-center gap-2.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'community'
                ? 'bg-teal-50 text-teal-900 font-semibold'
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            } ${isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2'}`}
            title="Leaderboard"
          >
            <svg className="w-4 h-4 shrink-0 fill-none stroke-current stroke-[1.8]">
              <use href="#i-globe" />
            </svg>
            {!isCollapsed && <span>Leaderboard</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('saved', e)}
            className={`flex items-center gap-2.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'saved'
                ? 'bg-teal-50 text-teal-900 font-semibold'
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            } ${isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2'}`}
            title="Saved places"
          >
            <svg className="w-4 h-4 shrink-0 fill-none stroke-current stroke-[1.8]">
              <use href="#i-bookmark" />
            </svg>
            {!isCollapsed && <span>Saved Places</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('contributions', e)}
            className={`flex items-center gap-2.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'contributions'
                ? 'bg-teal-50 text-teal-900 font-semibold'
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            } ${isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2'}`}
            title="Contribution history"
          >
            <svg className="w-4 h-4 shrink-0 fill-none stroke-current stroke-[1.8]">
              <use href="#i-bars" />
            </svg>
            {!isCollapsed && <span>Contributions</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('messages', e)}
            className={`flex items-center gap-2.5 rounded-lg text-xs whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'messages'
                ? 'bg-teal-50 text-teal-900 font-semibold'
                : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
            } ${isCollapsed ? 'justify-center p-2' : 'px-2.5 py-2'}`}
            title="Messages"
          >
            <svg className="w-4 h-4 shrink-0 fill-none stroke-current stroke-[1.8]">
              <use href="#i-chat" />
            </svg>
            {!isCollapsed && <span>Messages</span>}
          </button>
        </div>

        {/* Promo Invite Button at bottom */}
        <button
          type="button"
          onClick={handleInviteClick}
          className={`mt-auto w-full rounded-xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 text-left cursor-pointer transition-colors flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 p-2.5'
          }`}
          title="Invite a mapper"
        >
          <span className="w-7 h-7 rounded-lg bg-teal-600 text-white grid place-items-center shrink-0">
            <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-[2]">
              <use href="#i-user" />
            </svg>
          </span>
          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <b className="block text-xs text-teal-950 font-semibold truncate">
                {inviteCopied ? 'Link Copied!' : 'Invite a Mapper'}
              </b>
              <small className="block text-teal-700 text-[10px] truncate">
                {inviteCopied ? 'Ready to share' : 'Help verify places'}
              </small>
            </div>
          )}
        </button>

        {/* Sign out */}
        <button
          type="button"
          onClick={handleSignOut}
          className={`mt-1 w-full rounded-xl border border-transparent text-slate-500 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 cursor-pointer transition-colors flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'gap-2.5 p-2.5'
          }`}
          title={`Sign out of ${displayName}'s session`}
          aria-label="Sign out"
        >
          <svg className="w-4 h-4 shrink-0 fill-none stroke-current stroke-[1.8]">
            <use href="#i-door" />
          </svg>
          {!isCollapsed && <span className="text-xs font-semibold">Sign out</span>}
        </button>
      </aside>
    </>
  );
};