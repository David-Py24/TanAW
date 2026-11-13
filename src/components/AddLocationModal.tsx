/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { STANDARD_ACCESSIBILITY_TAGS } from '../prompts/storefrontPrompt';
import { analyzeStorefront } from '../utils/storefrontAnalysis';
import { compressImageFile } from '../utils/storage';
import {
  CategoryType,
  LocationPin,
  LocationTag,
  Review,
  StorefrontAnalysisResult,
} from '../types/accessibility';
import { getTagIcon } from '../utils/tagHelpers';
import { useA11y } from '../context/A11yContext';
import {
  Accessibility,
  UploadCloud,
  MapPin,
  Plus,
  X,
  Star,
  Check,
  Sparkles,
  Locate,
  AlertTriangle,
  Building2,
  Loader2,
} from 'lucide-react';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoords: { lat: number; lng: number } | null;
  initialTags?: string[];
  initialPhotoUrl?: string;
  initialAiSummary?: string;
  initialAiBarriers?: string[];
  currentUserName?: string;
  onSaveLocation: (newPin: LocationPin) => void;
}

const CATEGORIES: CategoryType[] = [
  'Shopping',
  'Dining & Cafe',
  'Healthcare',
  'Education',
  'Public Space',
  'Hotel & Lodging',
  'Service',
  'Other',
];

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  initialCoords,
  initialTags = [],
  initialPhotoUrl,
  initialAiSummary,
  initialAiBarriers,
  currentUserName,
  onSaveLocation,
}) => {
  const { announce } = useA11y();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 8.4822, lng: 124.6473 }
  );
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('Shopping');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [overallRating, setOverallRating] = useState(5);

  const [photoUrl, setPhotoUrl] = useState<string>(initialPhotoUrl || '');
  const [photoName, setPhotoName] = useState<string>('');
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | undefined>(initialAiSummary);
  const [aiBarriers, setAiBarriers] = useState<string[] | undefined>(initialAiBarriers);

  const [tags, setTags] = useState<string[]>(() =>
    initialTags.length > 0
      ? initialTags
      : ['Wheelchair-accessible entrance', 'Ramp available']
  );
  const [tagInput, setTagInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (initialCoords) {
      setCoords(initialCoords);
    }
  }, [initialCoords]);

  if (!isOpen) return null;

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      announce('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    announce('Detecting current GPS location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        announce('Pin updated to your current coordinates.');
      },
      () => {
        setIsLocating(false);
        announce('Unable to detect location. Using Cagayan de Oro center.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    try {
      const compressedDataUrl = await compressImageFile(file);
      setPhotoUrl(compressedDataUrl);
      announce(`Storefront photo ${file.name} ready. Tap Scan with AI to auto-detect features.`);
    } catch {
      announce('Could not process photo.');
    }
  };

  const handleRunInFormAIScan = async () => {
    if (!photoUrl) return;
    setIsScanningAI(true);
    announce('Analyzing storefront accessibility with Gemini AI...');

    try {
      const data: StorefrontAnalysisResult = await analyzeStorefront(photoUrl);
      setAiSummary(data.summary);
      setAiBarriers(data.possible_barriers);

      if (Array.isArray(data.suggested_tags)) {
        setTags((prev) => Array.from(new Set([...prev, ...data.suggested_tags])));
      }
      announce(`AI analysis complete: ${data.summary}`);
    } catch {
      announce('AI analysis unavailable. You can toggle features below.');
    } finally {
      setIsScanningAI(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
      announce(`Added accessibility tag: ${trimmed}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      announce('Please enter the place name.');
      return;
    }
    if (tags.length === 0) {
      announce('Please select at least one accessibility feature.');
      return;
    }

    const locationTags: LocationTag[] = tags.map((tName) => ({
      name: tName,
      rating: overallRating,
      ratingCount: 1,
      confirmations: 1,
      disputes: 0,
      isAiSuggested: Boolean(aiSummary),
    }));

    const newId = `pin-${Date.now()}`;
    const initialReview: Review = {
      id: `rev-${Date.now()}`,
      authorName: currentUserName || 'Verified Mapper',
      rating: overallRating,
      comment: description.trim() || `Added accessibility details for ${name.trim()}.`,
      date: new Date().toISOString().split('T')[0],
      photos: photoUrl ? [photoUrl] : [],
    };

    const newPin: LocationPin = {
      id: newId,
      name: name.trim(),
      category,
      address: address.trim() || 'Cagayan de Oro City',
      lat: coords.lat,
      lng: coords.lng,
      averageRating: overallRating,
      totalReviews: 1,
      tags: locationTags,
      photos: photoUrl ? [photoUrl] : [],
      reviews: [initialReview],
      description: description.trim() || undefined,
      aiSummary,
      aiBarriers,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveLocation(newPin);
    announce(`Location "${newPin.name}" pinned to TanAW!`);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pin New Accessible Location"
      className="fixed inset-0 z-[1100] bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-scale-up select-none">
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shrink-0">
                <Accessibility className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">
                  Pin Accessible Place
                </h2>
                <p className="text-xs text-slate-500">
                  Share an accessible place or report a barrier in seconds.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 1. Place Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Place Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Centrio Mall, City Hospital"
                className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-2 focus:outline-slate-900 appearance-none cursor-pointer"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Optional Street / Landmark + GPS */}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street address or landmark (optional)"
              className="flex-1 px-3.5 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900"
            />
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              title={`Coordinates: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
            >
              <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-600' : ''}`} />
              <span>Use My GPS</span>
            </button>
          </div>

          {/* 2. Overall Rating + Tap-to-Select Accessibility Tags */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Overall Accessibility Rating
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOverallRating(star)}
                    className="p-0.5 cursor-pointer hover:scale-110 transition-transform"
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    <Star
                      className={`w-5 h-5 ${
                        overallRating >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-1 text-xs font-extrabold text-slate-700">
                  {overallRating}.0★
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">
                  Tap Features Present <span className="text-rose-500">*</span>
                </span>
                <span className="text-[11px] font-semibold text-emerald-700">
                  {tags.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {STANDARD_ACCESSIBILITY_TAGS.map((tag) => {
                  const selected = tags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        selected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {getTagIcon(tag)}
                      <span>{tag}</span>
                      {selected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>

              {/* Optional Custom Tag Input */}
              <div className="relative flex items-center mt-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Add custom tag (optional)..."
                  className="w-full pl-3 pr-9 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="absolute right-1.5 p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
                  aria-label="Add custom tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3. Short Note */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Short Accessibility Note <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Smooth ramp at main entrance, wide doors, elevator near lobby..."
              className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900 resize-none"
            />
          </div>

          {/* 4. Optional Storefront Photo + AI Scan */}
          <div className="space-y-2">
            {!photoUrl ? (
              <label
                htmlFor="storefront-upload"
                className="border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-800 truncate">
                      Add Entrance Photo (Optional)
                    </span>
                    <span className="block text-[11px] text-slate-400 truncate">
                      Auto-compressed • Can scan with Gemini AI
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                  Browse
                </span>
                <input
                  id="storefront-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={photoUrl}
                      alt="Storefront preview"
                      className="w-12 h-9 rounded-lg object-cover border border-slate-300 shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {photoName || 'Entrance photo attached'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleRunInFormAIScan}
                      disabled={isScanningAI}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {isScanningAI ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Auto-Tag with AI</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl('');
                        setPhotoName('');
                        setAiSummary(undefined);
                        setAiBarriers(undefined);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {aiSummary && (
                  <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-1">
                    <p className="font-semibold leading-snug">{aiSummary}</p>
                    {aiBarriers && aiBarriers.length > 0 && (
                      <div className="text-rose-700 text-[11px] flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Barriers: {aiBarriers.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-white" />
              <span>Pin Location</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
