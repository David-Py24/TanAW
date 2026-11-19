/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';

interface AiAnalysisSectionProps {
  summary?: string;
  barriers?: string[];
}

export const AiAnalysisSection: React.FC<AiAnalysisSectionProps> = ({
  summary,
  barriers,
}) => {
  if (!summary && (!barriers || barriers.length === 0)) return null;

  return (
    <div className="bg-[#EAF3F7] p-4 rounded-[18px] border-[1.8px] border-[#0F172A] shadow-[0_2.5px_0_#0F172A] space-y-3 font-space">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#21524B]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
            AI Storefront Visual Analysis
          </h3>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#21524B] text-white border-[1.2px] border-[#0F172A] shadow-[0_1px_0_#0F172A]">
          Gemini Vision
        </span>
      </div>

      {summary && (
        <p className="text-xs sm:text-sm text-[#0F172A] font-medium leading-relaxed">
          {summary}
        </p>
      )}

      {barriers && barriers.length > 0 && (
        <div className="bg-[#FEE2E2] p-3.5 rounded-xl border-[1.5px] border-[#991B1B]">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#991B1B] mb-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Reported Potential Barriers</span>
          </div>
          <ul className="text-xs text-[#991B1B] list-disc list-inside space-y-0.5 font-medium">
            {barriers.map((barrier, i) => (
              <li key={i}>{barrier}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-[11px] text-[#0F172A]/70 italic">
        Note: AI visual assessments are photographic estimates. Community verification is recommended.
      </div>
    </div>
  );
};

