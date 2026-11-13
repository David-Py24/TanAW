/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useA11y } from '../context/A11yContext';

export interface SidebarRailProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAIAnalyzer: () => void;
  onOpenAddModal?: () => void;
  onResetData?: () => void;
  onToggleFilterPanel: () => void;
  isFilterPanelOpen: boolean;
}

export const SidebarRail: React.FC<SidebarRailProps> = ({
  activeTab,
  onTabChange,
  onOpenAIAnalyzer,
  onOpenAddModal,
  onToggleFilterPanel,
  isFilterPanelOpen,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [inviteCopied, setInviteCopied] = useState<boolean>(false);
  const { announce } = useA11y();

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

  return (
    <>
      {/* SVG Icon Definition Sprite from sidebar.html */}
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
        </defs>
      </svg>

      <aside
        aria-label="Primary Navigation"
        className={`bg-white border-r-[1.5px] border-[#0F172A] flex flex-col shrink-0 select-none overflow-y-auto overflow-x-hidden min-h-0 z-40 font-space transition-all duration-200 ${
          isCollapsed ? 'w-[68px] p-[16px_10px]' : 'w-[248px] p-[16px_12px]'
        }`}
        style={{
          colorScheme: 'light',
        }}
      >
        {/* Brand Header */}
        <div
          className={`flex items-center justify-between pb-3.5 ${
            isCollapsed ? 'flex-col gap-2 p-[2px_0_10px]' : 'p-[2px_6px_14px]'
          }`}
        >
          <button
            type="button"
            onClick={() => handleNavClick('map')}
            className="flex items-center gap-2.5 font-bold text-[20px] tracking-[-0.02em] text-[#0F172A] text-left cursor-pointer group"
            title="AccessMap Home"
            aria-label="AccessMap Home"
          >
            <div className="w-[30px] h-[30px] rounded-[9px] bg-[#21524B] text-white grid place-items-center border-[1.5px] border-[#0F172A] shadow-[0_2px_0_#0F172A] shrink-0 group-hover:scale-105 transition-transform">
              <svg className="w-[17px] h-[17px] fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                <use href="#i-pin" />
              </svg>
            </div>
            {!isCollapsed && <span className="whitespace-nowrap">AccessMap</span>}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-[34px] h-[34px] rounded-full border-[1.5px] border-transparent hover:border-[#0F172A] bg-transparent hover:bg-white text-[#475569] hover:text-[#0F172A] grid place-items-center p-0 transition-all cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className="w-[18px] h-[18px] fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-sidebar" />
            </svg>
          </button>
        </div>

        {/* Workspace Card */}
        <button
          type="button"
          onClick={() => handleNavClick('profile')}
          className={`w-full text-left bg-white border-[1.5px] border-[#0F172A] rounded-[12px] shadow-[0_2px_0_#0F172A] mb-3.5 flex items-center cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all ${
            isCollapsed ? 'justify-center p-[9px]' : 'gap-2.5 p-[9px_10px]'
          }`}
          title="Alex David - My workspace"
          aria-label="Workspace: Alex David"
        >
          <span className="w-[30px] h-[30px] rounded-full bg-[#21524B] text-white grid place-items-center font-bold text-[11px] shrink-0">
            AD
          </span>
          {!isCollapsed && (
            <>
              <div className="overflow-hidden min-w-0">
                <b className="block text-[13px] leading-[1.2] text-[#0F172A] font-bold truncate">
                  My workspace
                </b>
                <small className="block text-[#475569] text-[11px] truncate">Alex David</small>
              </div>
              <svg className="ml-auto text-[#475569] w-[15px] h-[15px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                <use href="#i-chev" />
              </svg>
            </>
          )}
        </button>

        {/* Top Navigation Items */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => handleNavClick('community', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'community'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Community (BETA)"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-globe" />
            </svg>
            {!isCollapsed && (
              <>
                <span>Community</span>
                <span className="ml-auto text-[9px] font-bold text-[#21524B] bg-[#E7F2F0] rounded-[6px] px-1.5 py-0.5 border border-[#21524B]/35">
                  BETA
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('dashboard', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Dashboard"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-grid" />
            </svg>
            {!isCollapsed && <span>Dashboard</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('messages', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'messages'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Messages"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-chat" />
            </svg>
            {!isCollapsed && <span>Messages</span>}
          </button>
        </div>

        {/* IDENTITY Group */}
        <div
          className={
            isCollapsed
              ? 'my-2 h-[1px] bg-[#D5E5EC] w-full block text-[0px]'
              : "flex items-center gap-2.5 text-[#475569] text-[10px] font-bold tracking-[0.09em] my-3.5 mx-1.5 uppercase after:content-[''] after:flex-1 after:h-[1px] after:bg-[#D5E5EC]"
          }
        >
          {!isCollapsed && 'IDENTITY'}
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => handleNavClick('profile', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'profile'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Profile"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-user" />
            </svg>
            {!isCollapsed && <span>Profile</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('saved', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'saved'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Saved places"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-bookmark" />
            </svg>
            {!isCollapsed && <span>Saved places</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('contributions', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'contributions'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Contribution history"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-bars" />
            </svg>
            {!isCollapsed && <span>Contribution history</span>}
          </button>
        </div>

        {/* EXPLORE Group */}
        <div
          className={
            isCollapsed
              ? 'my-2 h-[1px] bg-[#D5E5EC] w-full block text-[0px]'
              : "flex items-center gap-2.5 text-[#475569] text-[10px] font-bold tracking-[0.09em] my-3.5 mx-1.5 uppercase after:content-[''] after:flex-1 after:h-[1px] after:bg-[#D5E5EC]"
          }
        >
          {!isCollapsed && 'EXPLORE'}
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => handleNavClick('map', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'map'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Map view"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-pin" />
            </svg>
            {!isCollapsed && <span>Map view</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('vision', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all border-transparent font-medium hover:bg-[#EAF3F7] ${
              isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'
            }`}
            title="AI vision (Gemini Storefront Analyzer)"
          >
            <svg className="w-[18px] h-[18px] shrink-0 text-emerald-700 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-sparkle" />
            </svg>
            {!isCollapsed && <span>AI vision</span>}
          </button>

          {/* Quick Add Pin action */}
          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all border-transparent font-medium hover:bg-[#EAF3F7] ${
                isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'
              }`}
              title="Add New Location Pin"
            >
              <svg className="w-[18px] h-[18px] shrink-0 text-teal-700 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
                <use href="#i-plus" />
              </svg>
              {!isCollapsed && <span>Add place</span>}
            </button>
          )}
        </div>

        {/* SETTINGS Group */}
        <div
          className={
            isCollapsed
              ? 'my-2 h-[1px] bg-[#D5E5EC] w-full block text-[0px]'
              : "flex items-center gap-2.5 text-[#475569] text-[10px] font-bold tracking-[0.09em] my-3.5 mx-1.5 uppercase after:content-[''] after:flex-1 after:h-[1px] after:bg-[#D5E5EC]"
          }
        >
          {!isCollapsed && 'SETTINGS'}
        </div>

        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => handleNavClick('tags', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              activeTab === 'tags'
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Tags & badges"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-tag" />
            </svg>
            {!isCollapsed && <span>Tags &amp; badges</span>}
          </button>

          <button
            type="button"
            onClick={(e) => handleNavClick('filters', e)}
            className={`flex items-center gap-3 rounded-[10px] text-[13.5px] border-[1.5px] whitespace-nowrap text-[#0F172A] cursor-pointer transition-all ${
              isFilterPanelOpen
                ? 'bg-[#E7F2F0] border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                : 'border-transparent font-medium hover:bg-[#EAF3F7]'
            } ${isCollapsed ? 'justify-center p-[9px]' : 'p-[8px_10px]'}`}
            title="Filter settings"
          >
            <svg className="w-[18px] h-[18px] shrink-0 fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-sliders" />
            </svg>
            {!isCollapsed && <span>Filter settings</span>}
          </button>
        </div>

        {/* Invite a Mapper Promo Card */}
        <button
          type="button"
          onClick={handleInviteClick}
          className={`mt-auto w-full border-[1.5px] border-[#21524B] rounded-[12px] bg-gradient-to-br from-white to-[#E7F2F0] text-left cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-transform flex items-center shadow-xs ${
            isCollapsed ? 'justify-center p-[9px]' : 'gap-2.5 p-2.5'
          }`}
          title="Invite a mapper - Bring neighbors in to verify places"
          aria-label="Invite a mapper"
        >
          <span className="w-9 h-9 rounded-full bg-white border-[1.5px] border-[#0F172A] grid place-items-center text-[#21524B] shrink-0">
            <svg className="w-[18px] h-[18px] fill-none stroke-current stroke-[1.8] stroke-linecap-round stroke-linejoin-round">
              <use href="#i-user" />
            </svg>
          </span>
          {!isCollapsed && (
            <div className="overflow-hidden min-w-0">
              <b className="block text-[13px] leading-[1.2] text-[#0F172A] font-bold truncate">
                {inviteCopied ? 'Link Copied!' : 'Invite a mapper'}
              </b>
              <small className="block text-[#475569] text-[11px] leading-[1.3] truncate">
                {inviteCopied ? 'Share with neighbors' : 'Bring neighbors in to verify places.'}
              </small>
            </div>
          )}
        </button>
      </aside>
    </>
  );
};
