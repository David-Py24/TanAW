/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SAMPLE_STOREFRONTS, SampleStorefront } from '../../data/initialLocations';
import { compressImageFile } from '../../utils/storage';
import { Upload, Camera, Sparkles, Loader2 } from 'lucide-react';

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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await compressImageFile(file);
    onSelectImage(compressed);
  };

  const handleSelectSample = (sample: SampleStorefront) => {
    onSelectImage(sample.imageUrl);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
          1. Provide a Storefront or Entrance Photograph
        </label>
        {selectedImage && (
          <button
            type="button"
            onClick={() => onSelectImage(null)}
            className="text-xs text-slate-500 hover:text-rose-600 cursor-pointer"
          >
            Change Photo
          </button>
        )}
      </div>

      {!selectedImage ? (
        <div className="space-y-3">
          {/* Camera & File Upload Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="border-2 border-dashed border-indigo-300 bg-indigo-50/30 hover:border-indigo-500 hover:bg-indigo-50/70 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group">
              <div className="w-12 h-12 rounded-full bg-indigo-600 group-hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-xs">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                Take Photo with Camera
              </span>
              <span className="text-xs text-slate-500">
                Opens your mobile rear camera to snap an entrance directly
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            <label className="border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center group">
              <div className="w-12 h-12 rounded-full bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center transition-colors">
                <Upload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                Upload Storefront Photo
              </span>
              <span className="text-xs text-slate-500">
                Choose from gallery or files (JPG, PNG, WebP)
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>

          {/* Preset sample photo quick picker */}
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-2">
              Or select a pre-loaded test storefront:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_STOREFRONTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className="group relative rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-500 text-left transition-all hover:shadow-md cursor-pointer aspect-4/3 bg-slate-100"
                >
                  <img
                    src={sample.imageUrl}
                    alt={sample.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-2 flex flex-col justify-end text-white">
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
        /* Photo Preview & Analysis Trigger */
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div className="w-full sm:w-44 h-32 rounded-xl overflow-hidden border border-slate-300 relative shrink-0 bg-black">
            <img
              src={selectedImage}
              alt="Selected storefront for AI analysis"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-2 text-center sm:text-left">
            <h4 className="text-sm font-bold text-slate-900">
              Storefront Photo Ready
            </h4>
            <p className="text-xs text-slate-500">
              Gemini will inspect doors, steps, thresholds, ramps, signage, and pathway clearance.
            </p>

            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
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

