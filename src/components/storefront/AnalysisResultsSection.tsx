/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LocationPin, StorefrontAnalysisResult } from '../../types/accessibility';
import { getTagIcon } from '../../utils/tagHelpers';
import { CheckCircle2, ShieldAlert, Info } from 'lucide-react';

interface AnalysisResultsSectionProps {
  analysisResult: StorefrontAnalysisResult;
  acceptedTagsMap: Record<string, boolean>;
  onToggleTagAcceptance: (tagName: string) => void;
  targetLocation?: LocationPin | null;
  locations: LocationPin[];
  selectedLocationId: string;
  onSelectLocationId: (id: string) => void;
}

export const AnalysisResultsSection: React.FC<AnalysisResultsSectionProps> = ({
  analysisResult,
  acceptedTagsMap,
  onToggleTagAcceptance,
  targetLocation,
  locations,
  selectedLocationId,
  onSelectLocationId,
}) => {
  const acceptedCount = Object.values(acceptedTagsMap).filter(Boolean).length;

  return (
    <div className="space-y-4 pt-2 border-t border-slate-200 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>AI Storefront Review Results</span>
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {acceptedCount} tags accepted
        </span>
      </div>

      {/* Summary Card */}
      <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-2xl space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-sky-900">
          Architectural Assessment:
        </span>
        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
          {analysisResult.summary}
        </p>
      </div>

      {/* Detected Physical Features with Confidence & Visual Evidence */}
      {analysisResult.detected_features && analysisResult.detected_features.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Observed Accessibility Features & Evidence
          </span>
          <div className="space-y-2">
            {analysisResult.detected_features.map((feat, idx) => {
              const confidencePct = Math.round((feat.confidence || 0.8) * 100);
              return (
                <div
                  key={idx}
                  className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      {getTagIcon(feat.tag)}
                      <span>{feat.tag}</span>
                    </span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                      {confidencePct}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">
                    <strong className="text-slate-800">Visual Evidence:</strong>{' '}
                    {feat.evidence}
                  </p>

                  {/* Progress gauge */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${confidencePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Barriers Box */}
      {analysisResult.possible_barriers && analysisResult.possible_barriers.length > 0 && (
        <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>Identified Physical Obstacles & Barriers</span>
          </div>
          <ul className="text-xs text-amber-800 list-disc list-inside space-y-1">
            {analysisResult.possible_barriers.map((barrier, bIdx) => (
              <li key={bIdx} className="font-medium">
                {barrier}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Tags to Accept or Reject */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Accept or Reject Suggested Tags:
          </span>
          <span className="text-[11px] text-slate-500">
            Check the tags you want to apply
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {analysisResult.suggested_tags?.map((tag) => {
            const isAccepted = Boolean(acceptedTagsMap[tag]);
            return (
              <label
                key={tag}
                className={`p-3 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  isAccepted
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isAccepted}
                    onChange={() => onToggleTagAcceptance(tag)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {tag}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isAccepted
                      ? 'bg-emerald-200 text-emerald-900'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isAccepted ? 'Accepted' : 'Rejected'}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* AI Disclaimer */}
      <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 flex items-start gap-2 text-[11px] text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p>
          <strong>Disclaimer:</strong> AI analysis is based on photographic visual inspection only and may be inaccurate or incomplete. All AI-suggested tags will display an "AI-suggested" badge on TanAW until confirmed on-site by community members.
        </p>
      </div>

      {/* Location Target Selection (if not launched from an existing location) */}
      {!targetLocation && (
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Select Existing Location Pin to Update:
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => onSelectLocationId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800"
          >
            <option value="">-- Choose a location in Cagayan de Oro --</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.category})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

