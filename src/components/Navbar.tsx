/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useA11y, TextSize } from '../context/A11yContext';
import {
  Accessibility,
  Eye,
  Plus,
  Sparkles,
  Map as MapIcon,
  List as ListIcon,
  Columns,
  RotateCcw,
} from 'lucide-react';

export type ViewMode = 'split' | 'map' | 'list';

interface NavbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenAIAnalyzer: () => void;
  onResetData: () => void;
  totalLocations: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onOpenAIAnalyzer,
  onResetData,
  totalLocations,
}) => {
  const { textSize, setTextSize, highContrast, toggleHighContrast, announce } = useA11y();

  const handleTextSizeCycle = () => {
    let next: TextSize = 'normal';
    if (textSize === 'normal') next = 'large';
    else if (textSize === 'large') next = 'extra-large';
    else next = 'normal';

    setTextSize(next);
    announce(`Text size changed to ${next}`);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 z-30 shrink-0">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-sm shrink-0 p-2">
            <img
              src="/logo-white.png"
              alt="Crowdsourced Accessibility Map Logo"
              className="w-6 h-6 object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 truncate">
                TanAW
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
                CDO
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate hidden md:block">
              Crowdsourced Accessibility • Cagayan de Oro
            </p>
          </div>
        </div>

        {/* View Switcher (Desktop/Tablet) */}
        <div
          role="radiogroup"
          aria-label="Display View Mode"
          className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200"
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'split'}
            onClick={() => onViewModeChange('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'split'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-4 h-4" />
            <span>Split</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'map'}
            onClick={() => onViewModeChange('map')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>Map Only</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === 'list'}
            onClick={() => onViewModeChange('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListIcon className="w-4 h-4" />
            <span>List Only</span>
          </button>
        </div>

        {/* Actions & Accessibility toggles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Text Size Scale Toggle */}
          <button
            type="button"
            onClick={handleTextSizeCycle}
            className="h-10 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            title={`Toggle text size (current: ${textSize})`}
            aria-label={`Toggle text size, currently ${textSize}`}
          >
            <span className="text-sm">A</span>
            <span className="text-[10px] text-sky-600 uppercase font-mono">
              {textSize === 'normal' ? '1x' : textSize === 'large' ? '1.15x' : '1.3x'}
            </span>
          </button>

          {/* High Contrast Mode Toggle */}
          <button
            type="button"
            onClick={() => {
              toggleHighContrast();
              announce(
                highContrast
                  ? 'High contrast mode disabled'
                  : 'High contrast mode enabled'
              );
            }}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
              highContrast
                ? 'bg-amber-400 text-black border-amber-500 font-bold'
                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
            }`}
            title={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
            aria-pressed={highContrast}
          >
            <Eye className="w-5 h-5" />
          </button>

          {/* AI Storefront Analyzer Button */}
          <button
            type="button"
            onClick={onOpenAIAnalyzer}
            className="h-10 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            title="Scan storefront photo for accessibility features with Gemini AI"
          >
            <Sparkles className="w-4 h-4 text-amber-300" aria-hidden="true" />
            <span className="hidden sm:inline">Analyze Storefront</span>
            <span className="sm:hidden font-bold">AI Scan</span>
          </button>

          {/* Add Pin Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="h-10 px-3 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
            title="Add a new accessible location pin"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span className="hidden sm:inline">Add Pin</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
};
