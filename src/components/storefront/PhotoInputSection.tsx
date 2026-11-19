/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SAMPLE_STOREFRONTS, SampleStorefront } from '../../data/initialLocations';
import { Upload, Sparkles, Loader2 } from 'lucide-react';

interface PhotoInputSectionProps {
  selectedImage: string | null;
  onSelectImage: (img: string | null) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
}

export const PhotoInputSection: React.FC<PhotoInputSectionProps> = ({
  selectedImage,
  onSelectImage,
  isAnalyzing,
  onAnalyze,
}) => {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onSelectImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: SampleStorefront) => {
    onSelectImage(sample.imageUrl);
  };

  return (
    <div className="space-y-4 font-space">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">
          1. Provide a Storefront or Entrance Photograph
        </label>
        {selectedImage && (
          <button
            type="button"
            onClick={() => onSelectImage(null)}
            className="text-xs font-bold text-[#21524B] hover:underline cursor-pointer"
          >
            Change Photo
          </button>
        )}
      </div>

      {!selectedImage ? (
        <div className="space-y-4">
          {/* Drag and Drop / File Input Box */}
          <label className="border-2 border-dashed border-[#0F172A] hover:bg-[#EAF3F7] rounded-[20px] p-6 flex flex-col items-center justify-center gap-2.5 cursor-pointer transition-all text-center group bg-[#F8FAFC] shadow-[0_2px_0_#0F172A]">
            <div className="w-12 h-12 rounded-full bg-[#E7F2F0] text-[#21524B] border-[1.5px] border-[#0F172A] shadow-[0_1.5px_0_#0F172A] flex items-center justify-center transition-all group-hover:scale-105">
              <Upload className="w-6 h-6" />
            </div>
            <span className="text-sm font-bold text-[#0F172A]">
              Click to upload storefront photo
            </span>
            <span className="text-xs font-medium text-[#0F172A]/70">
              Supports JPG, PNG, WebP up to 15MB • Shows doors, steps, and ramps
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>

          {/* Preset sample photo quick picker */}
          <div>
            <span className="text-xs font-bold text-[#0F172A] block mb-2">
              Or select a pre-loaded test storefront:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SAMPLE_STOREFRONTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="group relative rounded-[14px] overflow-hidden border-[1.8px] border-[#0F172A] shadow-[0_2px_0_#0F172A] hover:-translate-y-0.5 hover:shadow-[0_3px_0_#0F172A] text-left transition-all cursor-pointer aspect-4/3 bg-[#EAF3F7]"
                >
                  <img
                    src={sample.imageUrl}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-2.5 flex flex-col justify-end text-white">
                    <span className="text-[11px] font-bold line-clamp-1">
                      {sample.title}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Photo Preview & Analysis Trigger matching .scan and .panel */
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-[16px] border-[1.8px] border-[#0F172A] shadow-[0_3px_0_#0F172A]">
          <div className="w-full sm:w-56 h-36 rounded-[14px] overflow-hidden border-[1.5px] border-[#0F172A] shadow-[0_2px_0_#0F172A] relative shrink-0 bg-slate-900 group">
            <img
              src={selectedImage}
              alt="Selected storefront for AI analysis"
              className="w-full h-full object-cover opacity-90"
            />
            
            {/* Visual AI scanning laser beam overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute left-0 right-0 h-[2px] bg-[#7DD3C8] shadow-[0_0_14px_3px_rgba(125,211,200,0.8)] laser-scan-beam" />
              {/* Target Bounding Boxes */}
              <div className="absolute left-[12%] top-[24%] w-[38%] h-[60%] border-2 border-[#7DD3C8] rounded bg-[rgba(125,211,200,0.12)]">
                <span className="absolute -top-3.5 left-0 text-[9px] font-bold bg-white text-[#0F172A] px-1.5 py-0.2 rounded border border-[#0F172A] whitespace-nowrap shadow-[0_1px_0_#0F172A]">
                  Entrance door
                </span>
              </div>
              <div className="absolute left-[54%] top-[64%] w-[38%] h-[26%] border-2 border-dashed border-[#FBBF24] rounded bg-[rgba(251,191,36,0.12)]">
                <span className="absolute -top-3.5 left-0 text-[9px] font-bold bg-white text-[#0F172A] px-1.5 py-0.2 rounded border border-[#0F172A] whitespace-nowrap shadow-[0_1px_0_#0F172A]">
                  Step / Ramp zone
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-[#0F172A]">
                Storefront Photo Ready
              </h4>
              <span className="inline-flex items-center gap-1.5 bg-[#E7F2F0] text-[#13332E] border border-[#21524B] rounded-full text-[10px] font-bold px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#21524B] animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-[#475569] font-medium leading-relaxed">
              Gemini will inspect doors, steps, thresholds, ramps, signage, and pathway clearance.
            </p>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="btn-neo btn-neo-accent btn-neo-glow w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Inspecting Features with Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Run AI Accessibility Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

