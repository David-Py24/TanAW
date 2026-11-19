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
    <div className="space-y-4 pt-3 border-t-[1.5px] border-[#0F172A] animate-fade-in font-space">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#21524B]" />
          <span>AI Storefront Review Results</span>
        </h3>
        <span className="inline-flex items-center gap-1.5 bg-[#E7F2F0] text-[#13332E] border border-[#21524B] rounded-full text-[11px] font-bold px-2.5 py-0.5 shadow-[0_1px_0_#21524B]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#21524B]"></span>
          <span>{acceptedCount} tags accepted</span>
        </span>
      </div>

      {/* Summary Card matching .tile in sidebar pages */}
      <div className="p-4 bg-white border-[1.8px] border-[#0F172A] rounded-[14px] shadow-[0_2px_0_#0F172A] space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#21524B]">
          Architectural Assessment:
        </span>
        <p className="text-xs sm:text-sm text-[#0F172A] leading-relaxed font-bold">
          {analysisResult.summary}
        </p>
      </div>

      {/* Detected Physical Features with Confidence & Visual Evidence matching .ci */}
      {analysisResult.detected_features && analysisResult.detected_features.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#475569] uppercase tracking-wider">
            Observed Accessibility Features & Evidence
          </span>
          <div className="space-y-2.5">
            {analysisResult.detected_features.map((feat, idx) => {
              const confidencePct = Math.round((feat.confidence || 0.8) * 100);
              return (
                <div
                  key={idx}
                  className="p-3.5 bg-white border-[1.5px] border-[#0F172A] rounded-[14px] shadow-[0_2px_0_#0F172A] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#21524B] text-white flex items-center justify-center font-bold text-[10px]">✓</span>
                      <span>{feat.tag}</span>
                    </span>
                    <span className="font-bold text-[#13332E] bg-[#E7F2F0] border border-[#21524B] px-2.5 py-0.5 rounded-full text-[11px]">
                      {confidencePct}% Confidence
                    </span>
                  </div>

                  <p className="text-xs text-[#475569] font-medium">
                    <strong className="text-[#0F172A]">Visual Evidence:</strong>{' '}
                    {feat.evidence}
                  </p>

                  {/* Progress gauge matching .bar */}
                  <div className="w-full bg-[#E2E8F0] h-[5px] rounded-full overflow-hidden">
                    <div
                      className="bg-[#21524B] h-full rounded-full transition-all"
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
        <div className="p-3.5 bg-[#FEE2E2] border-[1.5px] border-[#991B1B] rounded-[14px] space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B]">
            <ShieldAlert className="w-4 h-4 text-[#991B1B]" />
            <span>Identified Physical Obstacles & Barriers</span>
          </div>
          <ul className="text-xs text-[#991B1B] list-disc list-inside space-y-1 font-medium">
            {analysisResult.possible_barriers.map((barrier, bIdx) => (
              <li key={bIdx}>
                {barrier}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Tags to Accept or Reject */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">
            Accept or Reject Suggested Tags:
          </span>
          <span className="text-[11px] font-bold text-[#475569]">
            Check the tags you want to apply
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {analysisResult.suggested_tags?.map((tag) => {
            const isAccepted = Boolean(acceptedTagsMap[tag]);
            return (
              <label
                key={tag}
                className={`p-3 rounded-[12px] border-[1.5px] flex items-center justify-between gap-2 cursor-pointer transition-all ${
                  isAccepted
                    ? 'bg-[#E7F2F0] border-[#21524B] shadow-[0_2px_0_#21524B]'
                    : 'bg-white border-[#0F172A]/40 opacity-70 hover:opacity-100 shadow-[0_1px_0_#0F172A]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <input
                    type="checkbox"
                    checked={isAccepted}
                    onChange={() => onToggleTagAcceptance(tag)}
                    className="w-4 h-4 text-[#21524B] rounded border-[#0F172A] focus:ring-[#21524B]"
                  />
                  <span className="text-xs font-bold text-[#0F172A] truncate">
                    {tag}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isAccepted
                      ? 'bg-[#21524B] text-white border-[#0F172A]'
                      : 'bg-white text-[#475569] border-slate-300'
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
      <div className="p-3 bg-[#EAF3F7] rounded-[12px] border border-[#21524B]/30 flex items-start gap-2.5 text-[11px] text-[#475569] font-medium">
        <Info className="w-4 h-4 text-[#21524B] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#0F172A]">Disclaimer:</strong> AI analysis is based on photographic visual inspection only and may be inaccurate or incomplete. All AI-suggested tags will display an "AI-suggested" badge on TanAW until confirmed on-site by community members.
        </p>
      </div>

      {/* Location Target Selection (if not launched from an existing location) */}
      {!targetLocation && (
        <div className="pt-2">
          <label className="block text-xs font-bold text-[#0F172A] mb-1">
            Select Existing Location Pin to Update:
          </label>
          <select
            value={selectedLocationId}
            onChange={(e) => onSelectLocationId(e.target.value)}
            className="w-full p-2.5 bg-white border-[1.5px] border-[#0F172A] rounded-full px-4 text-xs sm:text-sm font-bold text-[#0F172A] shadow-[0_2px_0_#0F172A] focus:outline-none"
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

