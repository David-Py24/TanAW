/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { LocationPin, CategoryType } from '../../types/accessibility';
import { calculateDistanceKm } from '../../utils/storage';
import {
  Crosshair,
  Locate,
  MapPin,
  Layers,
  Check,
  Navigation,
  Info,
  X,
  Sparkles,
  ClipboardList,
  Compass,
  Calendar,
  Bookmark,
  BookOpen,
  Scan,
  ChevronRight,
  ChevronLeft,
  Settings,
  Award,
  Search,
  ChevronUp,
  ChevronDown,
  Globe,
  LogOut,
} from 'lucide-react';
import { MapTileStyle } from '../MapView';

export interface MobileRiftFloraLayoutProps {
  locations: LocationPin[];
  filteredLocations: LocationPin[];
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin | null) => void;
  onOpenDetails: (loc: LocationPin) => void;
  onRunAIScan: (loc: LocationPin | null) => void;
  onLocateMe: () => void;
  isLocating: boolean;
  onResetCenter: () => void;
  mapStyle: MapTileStyle;
  onSelectMapStyle: (style: MapTileStyle) => void;
  userCoords: { lat: number; lng: number } | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryType | 'All';
  onCategoryChange: (cat: CategoryType | 'All') => void;
  onNavigateTab: (tabId: string) => void;
  onTogglePin?: (pinId: string) => void;
}

export const MobileRiftFloraLayout: React.FC<MobileRiftFloraLayoutProps> = ({
  locations,
  filteredLocations,
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
  onRunAIScan,
  onLocateMe,
  isLocating,
  onResetCenter,
  mapStyle,
  onSelectMapStyle,
  userCoords,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onNavigateTab,
  onTogglePin,
}) => {
  // Mobile drawer state: 'closed' | 'missions' | 'details'
  const [drawerState, setDrawerState] = useState<'closed' | 'missions' | 'details'>('closed');
  const [isSheetExpanded, setIsSheetExpanded] = useState<boolean>(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'ramps' | 'verified' | 'barriers'>('all');
  const [activeLeftTab, setActiveLeftTab] = useState<'explore' | 'missions' | 'events' | 'saved'>('explore');

  // When drawerState changes or closed, reset to partial-opened (half-sheet)
  React.useEffect(() => {
    setIsSheetExpanded(false);
  }, [drawerState]);

  // When selectedLocation changes from outside, auto-open details sheet on mobile
  React.useEffect(() => {
    if (selectedLocation) {
      setDrawerState('details');
    }
  }, [selectedLocation?.id]);

  // Filter locations according to sheet sub-tabs
  const displayLocations = useMemo(() => {
    let list = filteredLocations;
    if (activeTab === 'ramps') {
      list = list.filter((l) =>
        l.tags.some((t) => t.name.toLowerCase().includes('ramp') || t.name.toLowerCase().includes('step-free'))
      );
    } else if (activeTab === 'verified') {
      list = list.filter((l) =>
        l.tags.some((t) => t.confirmations >= 2) || l.averageRating >= 4.0
      );
    } else if (activeTab === 'barriers') {
      list = list.filter((l) => (l.aiBarriers && l.aiBarriers.length > 0) || l.averageRating < 3.0);
    }
    return list;
  }, [filteredLocations, activeTab]);

  // Nearest location count / mission progression simulation
  const progressCount = useMemo(() => {
    const verifiedCount = locations.filter((l) => l.tags.some((t) => t.confirmations >= 2)).length;
    return {
      current: Math.min(verifiedCount, 2),
      target: 2,
    };
  }, [locations]);

  return (
    <div className="md:hidden pointer-events-none select-none font-space">
      {/* ================================================================= */}
      {/* 1. TOP FLOATING HUD PILL: Active Mission / Step-Free Route        */}
      {/* ================================================================= */}
      <div className="fixed top-3 left-4 right-4 z-[500] flex justify-center pointer-events-auto">
        <button
          type="button"
          onClick={() => {
            setDrawerState('missions');
            setActiveLeftTab('missions');
          }}
          className="w-full max-w-sm bg-[#0F172A]/90 hover:bg-[#0F172A] backdrop-blur-md text-white rounded-full py-2 px-4 shadow-[0_4px_20px_rgba(0,0,0,0.35)] border border-slate-700/80 flex flex-col items-center gap-1 transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="w-full flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B8F500] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#B8F500]"></span>
              </span>
              <span className="font-bold text-slate-100 truncate text-[12px]">
                {selectedLocation
                  ? `Target: ${selectedLocation.name}`
                  : `Discover nearest accessible ramp (${progressCount.current}/${progressCount.target})`}
              </span>
            </div>
            <span className="text-[10px] uppercase font-extrabold tracking-wider bg-[#B8F500] text-[#0F172A] px-2 py-0.5 rounded-full shrink-0">
              HUD
            </span>
          </div>

          {/* Lime Green Progress Indicator Strip */}
          <div className="w-full h-[3px] bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#B8F500] rounded-full transition-all duration-500 shadow-[0_0_8px_#B8F500]"
              style={{
                width: selectedLocation
                  ? '100%'
                  : `${(progressCount.current / progressCount.target) * 100}%`,
              }}
            />
          </div>
        </button>
      </div>

      {/* ================================================================= */}
      {/* 2. LEFT FLOATING VERTICAL DOCK: Navigation & Modes                 */}
      {/* ================================================================= */}
      <div className="fixed left-3 top-20 z-[500] pointer-events-auto flex flex-col items-center gap-2 p-1.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_rgba(15,23,42,0.18)] border border-slate-200/90">
        {/* Mission / Tasks */}
        <button
          type="button"
          onClick={() => {
            setActiveLeftTab('missions');
            setDrawerState('missions');
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeLeftTab === 'missions' && drawerState === 'missions'
              ? 'bg-[#0F172A] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Missions & Audit Tasks"
          aria-label="Missions & Audit Tasks"
        >
          <ClipboardList className="w-4 h-4" />
        </button>

        {/* Explore / Map View */}
        <button
          type="button"
          onClick={() => {
            setActiveLeftTab('explore');
            setDrawerState('closed');
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeLeftTab === 'explore' && drawerState === 'closed'
              ? 'bg-[#0F172A] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Explore Map"
          aria-label="Explore Map"
        >
          <Compass className="w-4 h-4" />
        </button>

        {/* Community / Events */}
        <button
          type="button"
          onClick={() => {
            setActiveLeftTab('events');
            onNavigateTab('profile');
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeLeftTab === 'events'
              ? 'bg-[#0F172A] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Community & Contributions"
          aria-label="Community & Contributions"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Saved / Daily */}
        <button
          type="button"
          onClick={() => {
            setActiveLeftTab('saved');
            onNavigateTab('saved');
          }}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeLeftTab === 'saved'
              ? 'bg-[#0F172A] text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          title="Saved Places & Bookmarks"
          aria-label="Saved Places & Bookmarks"
        >
          <Bookmark className="w-4 h-4" />
        </button>
      </div>

      {/* ================================================================= */}
      {/* 3. RIGHT FLOATING UTILITY STACK: Quick Map Controls               */}
      {/* ================================================================= */}
      <div className="fixed right-3 top-20 z-[500] pointer-events-auto flex flex-col items-center gap-2.5">
        {/* Landing Page */}
        <a
          href="index.html"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Return to Landing Page"
          aria-label="Landing Page"
        >
          <Globe className="w-4 h-4" />
        </a>

        {/* Settings */}
        <button
          type="button"
          onClick={() => onNavigateTab('settings')}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Settings & Accessibility Preferences"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* GPS Locate Me */}
        <button
          type="button"
          onClick={onLocateMe}
          disabled={isLocating}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Locate me (GPS)"
          aria-label="Locate me"
        >
          <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-600' : ''}`} />
        </button>

        {/* Orientation / Center Overview */}
        <button
          type="button"
          onClick={onResetCenter}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
          title="Reset to Mindanao Map Overview"
          aria-label="Reset Map Overview"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* Layer Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200/90 text-slate-700 hover:text-slate-950 flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Switch Map Layers"
            aria-label="Switch Map Layers"
          >
            <Layers className="w-4 h-4 text-[#21524B]" />
          </button>

          {/* Quick Layer Switcher Dropdown */}
          {showLayerMenu && (
            <div className="absolute right-12 top-0 w-44 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-[600] animate-scale-up space-y-1">
              {(
                [
                  { id: 'positron', label: 'Minimalist Light' },
                  { id: 'osm', label: 'Standard OSM' },
                  { id: 'dark', label: 'High Contrast Dark' },
                  { id: 'hot', label: 'Humanitarian' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onSelectMapStyle(opt.id);
                    setShowLayerMenu(false);
                  }}
                  className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl text-left flex items-center justify-between ${
                    mapStyle === opt.id
                      ? 'bg-[#E7F2F0] text-[#21524B] font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {mapStyle === opt.id && <Check className="w-3.5 h-3.5 text-[#21524B]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. BOTTOM FLOATING COMMAND BAR: Places | AI Scanner | Collection  */}
      {/* ================================================================= */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[86%] max-w-[320px] z-[500] pointer-events-auto">
        <div className="bg-[#0F172A] text-white rounded-full py-2 px-5 shadow-[0_8px_30px_rgba(15,23,42,0.4)] border border-slate-800 flex items-center justify-between">
          {/* Left: Directory / Places */}
          <button
            type="button"
            onClick={() => {
              setDrawerState(drawerState === 'missions' ? 'closed' : 'missions');
              setActiveLeftTab('missions');
            }}
            className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Browse Accessible Places"
            aria-label="Browse Accessible Places"
          >
            <BookOpen className="w-5 h-5" />
          </button>

          {/* Center: AI Scanner / Probe CTA (Neon Lime Glow) */}
          <button
            type="button"
            onClick={() => onRunAIScan(selectedLocation)}
            className="w-13 h-13 -my-3 rounded-full bg-white text-[#0F172A] border-[2.5px] border-[#B8F500] shadow-[0_0_18px_rgba(184,245,0,0.6)] flex items-center justify-center font-extrabold hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Scan Storefront Photo with Gemini AI"
            aria-label="Scan Storefront Photo with Gemini AI"
          >
            <Scan className="w-6 h-6 text-[#0F172A]" />
          </button>

          {/* Right: Saved / Profile Collection */}
          <button
            type="button"
            onClick={() => onNavigateTab('saved')}
            className="p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Saved Places Collection"
            aria-label="Saved Places Collection"
          >
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 5. RIFT FLORA BOTTOM SHEET: Mission (Screen 2) & Details (Screen 3) */}
      {/* ================================================================= */}
      {drawerState !== 'closed' && (
        <div
          className={`fixed inset-x-0 bottom-0 z-[600] pointer-events-auto bg-white rounded-t-[32px] shadow-[0_-12px_45px_rgba(15,23,42,0.25)] border-t border-slate-200 flex flex-col transition-all duration-300 ${
            isSheetExpanded ? 'h-[84vh]' : 'h-[50vh]'
          } animate-slide-up overflow-hidden`}
        >
          {/* Drag Handle Bar */}
          <div
            onClick={() => setIsSheetExpanded((prev) => !prev)}
            className="pt-3 pb-1 shrink-0 flex items-center justify-center cursor-pointer group"
            title={isSheetExpanded ? 'Collapse to partial sheet' : 'Expand full sheet'}
          >
            <div className="w-12 h-1.5 bg-slate-300 group-hover:bg-slate-400 rounded-full transition-colors" />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* SCREEN 2: MISSION / PLACES LIST VIEW                           */}
          {/* ------------------------------------------------------------- */}
          {drawerState === 'missions' && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="px-5 pt-2 pb-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight">Mission</h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#EAF3F7] text-[#21524B]">
                    {displayLocations.length} spots
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSheetExpanded((prev) => !prev)}
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                    title={isSheetExpanded ? 'Collapse to partial sheet' : 'Expand full sheet'}
                    aria-label={isSheetExpanded ? 'Collapse to partial sheet' : 'Expand full sheet'}
                  >
                    {isSheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerState('closed')}
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                    aria-label="Close sheet"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sub-tab Pill Switcher */}
              <div className="px-5 pb-3 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                    activeTab === 'all'
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>All Venues</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ramps')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    activeTab === 'ramps'
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ramps & Entrances
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('verified')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    activeTab === 'verified'
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Verified 4★+
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('barriers')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    activeTab === 'barriers'
                      ? 'bg-[#0F172A] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Barriers to Audit
                </button>
              </div>

              {/* Mission Items List */}
              <div className="flex-1 overflow-y-auto px-5 py-2 space-y-2.5 pb-20">
                {displayLocations.map((loc, idx) => {
                  const distance = userCoords
                    ? `${calculateDistanceKm(userCoords.lat, userCoords.lng, loc.lat, loc.lng).toFixed(1)} km away`
                    : `${loc.category}`;
                  const verifiedTagCount = loc.tags.filter((t) => t.confirmations > 0).length;

                  return (
                    <div
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc);
                        setDrawerState('details');
                      }}
                      className="p-3.5 bg-slate-50 hover:bg-[#EAF3F7] rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition-all cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-[#0F172A] truncate group-hover:text-[#21524B]">
                            {loc.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                          <span>{distance}</span>
                          <span>•</span>
                          <span className="text-[#21524B] font-semibold">
                            {verifiedTagCount > 0 ? `${verifiedTagCount} verified tags` : 'Needs audit'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[11px] font-mono font-bold text-slate-400">
                          {idx % 2 === 0 ? '1/2' : '2/3'}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* SCREEN 3: MISSION / PLACE DETAIL VIEW                          */}
          {/* ------------------------------------------------------------- */}
          {drawerState === 'details' && selectedLocation && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header with Circular Back Button */}
              <div className="px-5 pt-2 pb-3.5 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => setDrawerState('missions')}
                    className="w-8 h-8 rounded-full bg-[#0F172A] hover:bg-black text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs transition-transform active:scale-90"
                    title="Back to Mission List"
                    aria-label="Back to Mission List"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <h2 className="text-base font-extrabold text-[#0F172A] truncate">
                    {selectedLocation.name}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSheetExpanded((prev) => !prev)}
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer transition-colors"
                    title={isSheetExpanded ? 'Collapse to partial sheet' : 'Expand full sheet'}
                    aria-label={isSheetExpanded ? 'Collapse to partial sheet' : 'Expand full sheet'}
                  >
                    {isSheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDrawerState('closed')}
                    className="w-8 h-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 flex items-center justify-center cursor-pointer"
                    aria-label="Close sheet"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Detail Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Category Row */}
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    Category
                  </span>
                  <span className="font-extrabold text-[#0F172A]">{selectedLocation.category}</span>
                </div>

                {/* Progress Metric & Lime Green Progress Bar */}
                <div className="space-y-1.5 py-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                      Accessibility Progress
                    </span>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {selectedLocation.tags.filter((t) => t.confirmations > 0).length} /{' '}
                      {selectedLocation.tags.length || 3}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/90">
                    <div
                      className="h-full bg-[#B8F500] rounded-full transition-all duration-500 shadow-[0_0_8px_#B8F500]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            30,
                            (selectedLocation.tags.filter((t) => t.confirmations > 0).length /
                              (selectedLocation.tags.length || 1)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Hint Row */}
                <div
                  onClick={() => onOpenDetails(selectedLocation)}
                  className="p-3 bg-[#EAF3F7] rounded-2xl border border-slate-200/90 flex items-center justify-between cursor-pointer hover:bg-[#dcebf2] transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-[10px] uppercase font-bold text-[#21524B] tracking-wider">
                      Hint
                    </div>
                    <div className="text-xs font-semibold text-[#0F172A] truncate">
                      View hints & barrier photos provided by other explorers
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#21524B] shrink-0" />
                </div>

                {/* Reward Row */}
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                        Reward
                      </div>
                      <div className="text-xs font-bold text-emerald-950">
                        TanAW Contributor Points x 200
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-full border border-emerald-300">
                    +200 XP
                  </span>
                </div>

                {/* Verified Tags Chips */}
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
                    Verified Features
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedLocation.tags.map((tag) => (
                      <span
                        key={tag.name}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#0F172A] bg-white text-[#0F172A] shadow-[0_1px_0_#0F172A]"
                      >
                        {tag.name} ({tag.confirmations})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Full-Width Pill CTA: "Continue to probe" */}
              <div className="p-4 pt-2 border-t border-slate-100 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => onRunAIScan(selectedLocation)}
                  className="w-full py-3.5 px-4 rounded-full bg-[#0F172A] hover:bg-black text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <Scan className="w-4 h-4 text-[#B8F500]" />
                  <span>Continue to probe · Scan Storefront</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
