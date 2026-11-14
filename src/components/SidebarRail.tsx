/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useA11y, TextSize } from '../context/A11yContext';
import { AuthUser } from '../utils/storage';
import {
  Moon,
  Sun,
  HelpCircle,
  X,
  MapPin,
  List,
  Plus,
  PanelLeft,
  Share2,
  Sparkles,
  LogOut,
  Users,
  User,
} from 'lucide-react';

export type AppViewMode = 'map' | 'community' | 'profile';

export interface SidebarRailProps {
  activeView: AppViewMode;
  onViewChange: (view: AppViewMode) => void;
  currentUser: AuthUser;
  onSignOut: () => void;
  onOpenAIAnalyzer: () => void;
  onOpenAddModal: () => void;
  onToggleFilterPanel: () => void;
  isFilterPanelOpen: boolean;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  onOpenHowItWorks?: () => void;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeView,
  onViewChange,
  currentUser,
  onSignOut,
  onOpenAIAnalyzer,
  onOpenAddModal,
  onToggleFilterPanel,
  isFilterPanelOpen,
  isMobileOpen = false,
  onCloseMobile,
  onOpenHowItWorks,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [inviteCopied, setInviteCopied] = useState<boolean>(false);
  const { textSize, setTextSize, highContrast, toggleHighContrast, announce } = useA11y();

  const showLabels = !isCollapsed || isMobileOpen;

  const handleTextSizeCycle = () => {
    let next: TextSize = 'normal';
    if (textSize === 'normal') next = 'large';
    else if (textSize === 'large') next = 'extra-large';
    else next = 'normal';
    setTextSize(next);
    announce(`Text size changed to ${next}`);
  };

  const handleInviteClick = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.origin);
    }
    setInviteCopied(true);
    announce('Invite link copied to clipboard.');
    setTimeout(() => setInviteCopied(false), 2500);
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[750] md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Primary Navigation & Accessibility Controls"
        className={`bg-white border-r border-slate-200 flex-col shrink-0 select-none overflow-y-auto overflow-x-hidden min-h-0 transition-all duration-200 ${
          isMobileOpen
            ? 'fixed inset-y-0 left-0 flex z-[800] w-[260px] p-4 shadow-2xl'
            : 'hidden md:flex z-40 ' + (isCollapsed ? 'w-[68px] p-2.5' : 'w-[228px] p-3.5')
        }`}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between pb-3 mb-2 border-b border-slate-100 ${
            !showLabels ? 'flex-col gap-2' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => onCloseMobile?.()}
            className="flex items-center gap-2.5 font-extrabold text-lg tracking-tight text-slate-900 text-left cursor-pointer"
            title="TanAW CDO"
            aria-label="TanAW Home"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white grid place-items-center shadow-xs shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            {showLabels && <span className="whitespace-nowrap">TanAW</span>}
          </button>

          {isMobileOpen ? (
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-700 grid place-items-center cursor-pointer"
              aria-label="Close navigation menu"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 grid place-items-center transition-colors cursor-pointer"
              title={isCollapsed ? 'Expand sidebar labels' : 'Collapse sidebar'}
              aria-label={isCollapsed ? 'Expand sidebar labels' : 'Collapse sidebar'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Core Actions */}
        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => {
              onViewChange('map');
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeView === 'map'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100 border border-transparent'
            } ${!showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
            title="Interactive Accessibility Map"
          >
            <MapPin className="w-4 h-4 shrink-0" />
            {showLabels && <span>Map View</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              onViewChange('map');
              onToggleFilterPanel();
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeView === 'map' && isFilterPanelOpen
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100 border border-transparent'
            } ${!showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
            title={isFilterPanelOpen ? 'Hide Places List' : 'Show Places List'}
          >
            <List className="w-4 h-4 shrink-0" />
            {showLabels && <span>Places List</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              onOpenAIAnalyzer();
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3 rounded-xl text-xs font-bold whitespace-nowrap text-slate-800 hover:bg-emerald-50/80 border border-transparent hover:border-emerald-200 cursor-pointer transition-all ${
              !showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'
            }`}
            title="AI Storefront Scanner — Scan a photo to check accessibility"
          >
            <Sparkles className="w-4 h-4 shrink-0 text-emerald-600" />
            {showLabels && <span>AI Storefront Scan</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              onViewChange('map');
              onOpenAddModal();
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-white shadow-xs cursor-pointer transition-all ${
              !showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'
            }`}
            title="Pin a new accessible place"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {showLabels && <span>Pin a Place</span>}
          </button>

          <div className="my-1.5 h-px bg-slate-200 w-full" />

          <button
            type="button"
            onClick={() => {
              onViewChange('community');
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeView === 'community'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100 border border-transparent'
            } ${!showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
            title="Community Leaderboard & Activity"
          >
            <Users className="w-4 h-4 shrink-0" />
            {showLabels && <span>Community</span>}
          </button>

          <button
            type="button"
            onClick={() => {
              onViewChange('profile');
              onCloseMobile?.();
            }}
            className={`flex items-center gap-3 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeView === 'profile'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'text-slate-700 hover:bg-slate-100 border border-transparent'
            } ${!showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
            title="My Profile, Contributions, Saved Places & Messages"
          >
            <User className="w-4 h-4 shrink-0" />
            {showLabels && <span>My Profile</span>}
          </button>
        </div>

        {/* Accessibility & Help Section */}
        <div className="my-3 h-px bg-slate-200 w-full" />

        <div className="flex flex-col gap-1.5">
          {showLabels && (
            <span className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Accessibility &amp; Help
            </span>
          )}

          {/* Text Size Toggle */}
          <button
            type="button"
            onClick={handleTextSizeCycle}
            className={`flex items-center gap-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer transition-all ${
              !showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'
            }`}
            title={`Text size: ${textSize} (Click to change)`}
          >
            <span className="w-4 h-4 shrink-0 grid place-items-center font-extrabold text-[11px] border border-slate-700 rounded">
              A
            </span>
            {showLabels && (
              <>
                <span>Text Size</span>
                <span className="ml-auto text-[10px] font-bold text-emerald-800 bg-emerald-50 rounded px-1.5 py-0.5 border border-emerald-200 uppercase">
                  {textSize === 'normal' ? '1x' : textSize === 'large' ? '1.15x' : '1.3x'}
                </span>
              </>
            )}
          </button>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              toggleHighContrast();
              announce(highContrast ? 'Dark mode disabled' : 'Dark mode enabled');
            }}
            className={`flex items-center gap-3 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              highContrast
                ? 'bg-slate-800 text-amber-300 border border-slate-700 font-bold'
                : 'text-slate-700 hover:bg-slate-100'
            } ${!showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'}`}
            title="Toggle Dark Mode"
          >
            {highContrast ? (
              <Moon className="w-4 h-4 shrink-0 text-amber-300" />
            ) : (
              <Sun className="w-4 h-4 shrink-0 text-slate-600" />
            )}
            {showLabels && (
              <>
                <span>Dark Mode</span>
                <span className="ml-auto text-[10px] font-bold">
                  {highContrast ? 'ON' : 'OFF'}
                </span>
              </>
            )}
          </button>

          {/* How It Works Guide */}
          {onOpenHowItWorks && (
            <button
              type="button"
              onClick={() => {
                onOpenHowItWorks();
                onCloseMobile?.();
              }}
              className={`flex items-center gap-3 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer transition-all ${
                !showLabels ? 'justify-center p-2.5' : 'px-3 py-2.5'
              }`}
              title="How TanAW Works"
            >
              <HelpCircle className="w-4 h-4 shrink-0 text-sky-600" />
              {showLabels && <span>How It Works</span>}
            </button>
          )}
        </div>

        {/* Share + Signed-in User Account Footer */}
        <div className="mt-auto pt-3 space-y-2">
          <button
            type="button"
            onClick={handleInviteClick}
            className={`w-full border border-emerald-200 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/80 text-left cursor-pointer transition-colors flex items-center ${
              !showLabels ? 'justify-center p-2.5' : 'gap-2.5 p-2.5'
            }`}
            title="Copy link to share TanAW with neighbors"
            aria-label="Share TanAW link"
          >
            <Share2 className="w-4 h-4 text-emerald-800 shrink-0" />
            {showLabels && (
              <div className="overflow-hidden min-w-0">
                <span className="block text-xs font-bold text-slate-900 truncate">
                  {inviteCopied ? 'Link Copied!' : 'Share TanAW'}
                </span>
                <span className="block text-[11px] text-slate-500 truncate">
                  Invite neighbors to map
                </span>
              </div>
            )}
          </button>

          {/* Signed-in User Badge & Sign Out */}
          <div
            className={`border border-slate-200 rounded-xl bg-slate-50 flex items-center ${
              !showLabels ? 'flex-col gap-1.5 p-2' : 'justify-between gap-2 p-2.5'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                onViewChange('profile');
                onCloseMobile?.();
              }}
              className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
              title="Open My Profile"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-800 text-white text-xs font-extrabold grid place-items-center shrink-0 uppercase">
                {currentUser.name.charAt(0)}
              </div>
              {showLabels && (
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {currentUser.name}
                  </span>
                  <span className="block text-[10px] text-emerald-700 font-semibold truncate">
                    {currentUser.role}
                  </span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
