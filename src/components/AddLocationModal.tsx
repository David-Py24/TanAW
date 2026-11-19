/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { STANDARD_ACCESSIBILITY_TAGS } from '../prompts/storefrontPrompt';
import { analyzeStorefront } from '../utils/storefrontAnalysis';
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
  ShieldCheck,
} from 'lucide-react';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoords: { lat: number; lng: number } | null;
  initialTags?: string[];
  initialPhotoUrl?: string;
  initialAiSummary?: string;
  initialAiBarriers?: string[];
  onSaveLocation: (newPin: LocationPin) => void;
  onOpenStorefrontScanner: () => void;
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
  onSaveLocation,
  onOpenStorefrontScanner,
}) => {
  const { announce } = useA11y();

  // Pin Coordinates
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialCoords || { lat: 8.4822, lng: 124.6473 }
  );

  // Place Information
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('Shopping');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [overallRating, setOverallRating] = useState(5);

  // Storefront Photo & AI State
  const [photoUrl, setPhotoUrl] = useState<string>(initialPhotoUrl || '');
  const [photoName, setPhotoName] = useState<string>('');
  const [isScanningAI, setIsScanningAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | undefined>(initialAiSummary);
  const [aiBarriers, setAiBarriers] = useState<string[] | undefined>(initialAiBarriers);

  // Tag list & individual star ratings (1–5)
  const [tags, setTags] = useState<string[]>(() => {
    return initialTags.length > 0
      ? initialTags
      : [
          'Wheelchair-accessible entrance',
          'Ramp available',
          'Wide aisles / pathways',
        ];
  });

  const [tagRatings, setTagRatings] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    (initialTags.length > 0
      ? initialTags
      : [
          'Wheelchair-accessible entrance',
          'Ramp available',
          'Wide aisles / pathways',
        ]
    ).forEach((t) => {
      init[t] = 5;
    });
    return init;
  });

  const [tagInput, setTagInput] = useState('');

  // Community consensus checkboxes
  const [allowCommunityVerification, setAllowCommunityVerification] = useState(true);
  const [isOpenPublicPlace, setIsOpenPublicPlace] = useState(true);

  // GPS locating state
  const [isLocating, setIsLocating] = useState(false);

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
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: latitude, lng: longitude });
        announce('Pin updated to your current coordinates.');
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err);
        announce('Unable to detect location. Using Cagayan de Oro center.');
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Upload storefront photo & offer immediate AI analysis
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPhotoUrl(result);
      announce(`Storefront photo ${file.name} uploaded. You can run AI analysis now.`);
    };
    reader.readAsDataURL(file);
  };

  // In-form AI Storefront Scan with Gemini
  const handleRunInFormAIScan = async () => {
    if (!photoUrl) return;
    setIsScanningAI(true);
    announce('Analyzing storefront accessibility with Gemini AI...');

    try {
      const data: StorefrontAnalysisResult = await analyzeStorefront(photoUrl);
      setAiSummary(data.summary);
      setAiBarriers(data.possible_barriers);

      // Auto-merge suggested tags into form
      if (Array.isArray(data.suggested_tags)) {
        const merged = Array.from(new Set([...tags, ...data.suggested_tags]));
        setTags(merged);
        const updatedRatings = { ...tagRatings };
        data.suggested_tags.forEach((t) => {
          if (!updatedRatings[t]) updatedRatings[t] = 5;
        });
        setTagRatings(updatedRatings);
      }

      announce(`AI analysis complete: ${data.summary}`);
    } catch (err) {
      console.error('In-form AI scan error:', err);
      announce('AI analysis unavailable. You can manually rate features.');
    } finally {
      setIsScanningAI(false);
    }
  };

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagRatings({ ...tagRatings, [trimmed]: 5 });
      setTagInput('');
      announce(`Added accessibility tag: ${trimmed}`);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    const nextRatings = { ...tagRatings };
    delete nextRatings[tagToRemove];
    setTagRatings(nextRatings);
    announce(`Removed tag: ${tagToRemove}`);
  };

  const handleQuickAddSuggestedTag = (suggested: string) => {
    if (!tags.includes(suggested)) {
      setTags([...tags, suggested]);
      setTagRatings({ ...tagRatings, [suggested]: 5 });
      announce(`Added suggested tag: ${suggested}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      announce('Please enter the place name.');
      return;
    }

    if (tags.length === 0) {
      announce('Please select at least one accessibility tag.');
      return;
    }

    // Compute average rating from tags or overall
    const tagRatingValues = Object.values(tagRatings);
    const avgScore =
      tagRatingValues.length > 0
        ? Math.round((tagRatingValues.reduce((a, b) => a + b, 0) / tagRatingValues.length) * 10) / 10
        : overallRating;

    const locationTags: LocationTag[] = tags.map((tName) => {
      const isFromAI = Boolean(aiSummary && initialTags.includes(tName));
      return {
        name: tName,
        rating: tagRatings[tName] || 5,
        ratingCount: 1,
        confirmations: 1, // Submitting user provides first verification
        disputes: 0,
        isAiSuggested: isFromAI,
      };
    });

    const newId = `pin-${Date.now()}`;
    const initialReview: Review = {
      id: `rev-${Date.now()}`,
      authorName: authorName.trim() || 'TanAW Auditor',
      rating: avgScore,
      comment: description.trim() || `Verified accessibility features for ${name.trim()}.`,
      date: new Date().toISOString().split('T')[0],
      tagRatings,
      photos: photoUrl ? [photoUrl] : [],
    };

    const newPin: LocationPin = {
      id: newId,
      name: name.trim(),
      category,
      address: address.trim() || 'Cagayan de Oro City',
      lat: coords.lat,
      lng: coords.lng,
      averageRating: avgScore,
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
    announce(`Location "${newPin.name}" pinned to Cagayan de Oro TanAW!`);
    onClose();
  };

  const remainingSuggestions = STANDARD_ACCESSIBILITY_TAGS.filter(
    (st) => !tags.includes(st)
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pin New Accessible Location"
      className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      {/* Floating Card replicating the reference UI container */}
      <div className="bg-white rounded-[24px] shadow-[8px_8px_0px_#0F172A] border-[2px] border-[#0F172A] w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-scale-up select-none font-space">
        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Header with Icon, Title, and Subtitle */}
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#21524B] text-white border-[1.5px] border-[#0F172A] shadow-[0_1.5px_0_#0F172A] flex items-center justify-center">
                  <Accessibility className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
                  Pin Accessible Place
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-[#0F172A] bg-white hover:bg-[#EAF3F7] border-[1.5px] border-[#0F172A] shadow-[0_1.5px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-[#0F172A]" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-[#0F172A]/70 font-medium mt-1.5">
              Add a venue in Cagayan de Oro and record verified accessibility features for the community.
            </p>
          </div>

          {/* Storefront Photo Upload Dropzone (Recreation of Reference Dropzone + AI Scanning) */}
          <div className="space-y-2">
            <label
              htmlFor="storefront-upload"
              className="border-2 border-dashed border-[#0F172A] hover:bg-[#EAF3F7] rounded-[20px] p-6 sm:p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all group bg-[#F8FAFC] shadow-[0_2px_0_#0F172A]"
            >
              <div className="w-12 h-12 rounded-full bg-[#E7F2F0] text-[#21524B] border-[1.5px] border-[#0F172A] shadow-[0_1.5px_0_#0F172A] flex items-center justify-center group-hover:scale-105 transition-all mb-2.5">
                <UploadCloud className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#0F172A]">
                {photoName ? photoName : 'Select storefront photo or drag and drop here'}
              </span>
              <span className="text-[11px] sm:text-xs text-[#0F172A]/70 mt-0.5 font-medium">
                JPG, PNG or WebP, up to 15MB • Enables Gemini AI entrance scan
              </span>
              <input
                id="storefront-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>

            {/* Photo preview thumbnail & AI Trigger */}
            {photoUrl && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-2 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={photoUrl}
                      alt="Storefront preview"
                      className="w-12 h-9 rounded-lg object-cover border border-slate-300 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-800 truncate">
                        {photoName || 'storefront_image.jpg'}
                      </span>
                      <span className="block text-[11px] text-slate-400">
                        Ready for AI accessibility inspection
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleRunInFormAIScan}
                      disabled={isScanningAI}
                      className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
                    >
                      {isScanningAI ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Scanning...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Scan with AI</span>
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

                {/* AI Findings Summary Banner */}
                {aiSummary && (
                  <div className="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-200 text-xs text-indigo-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Gemini Storefront Assessment:</span>
                    </div>
                    <p className="leading-relaxed">{aiSummary}</p>
                    {aiBarriers && aiBarriers.length > 0 && (
                      <div className="pt-1 text-rose-700 text-[11px] flex items-start gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>Barriers detected: {aiBarriers.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2-Column Row: Place Name * & Category * */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Place Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Centrio Mall, Cafe Demitasse"
                className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Category <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as CategoryType)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-2 focus:outline-slate-900 transition-colors appearance-none cursor-pointer"
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

          {/* Street Address / Landmark */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Street Address or Landmark
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Claro M. Recto Ave & Corrales Ave, Cagayan de Oro"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900 transition-colors"
            />
          </div>

          {/* Description & Accessibility Notes * */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Accessibility Notes & Scope <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe entrance ramps, door clearance width, elevator access, restrooms, and sensory conditions..."
              className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900 transition-colors resize-none"
            />
          </div>

          {/* Accessibility Tags with '+' Input & Removable Pills */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800">
                Accessibility Tags <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                {tags.length} selected
              </span>
            </div>

            {/* Tag Input with '+' on right */}
            <div className="relative flex items-center">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add custom or standard tag (e.g. Ramp available, Braille menu)"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900 transition-colors"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                className="absolute right-2 p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
                title="Add tag"
                aria-label="Add tag"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Removable Tag Pills matching Reference: [Wheelchair entrance X] with Star Rating */}
            <div className="space-y-1.5 pt-1">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 shadow-2xs text-xs font-medium text-slate-800 transition-all"
                  >
                    <span className="text-slate-500">{getTagIcon(tag)}</span>
                    <span className="font-semibold">{tag}</span>

                    {/* Star rating selector inside pill */}
                    <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-200">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setTagRatings({ ...tagRatings, [tag]: s })}
                          className="cursor-pointer hover:scale-125 transition-transform"
                          title={`Rate ${tag} ${s} stars`}
                        >
                          <Star
                            className={`w-3 h-3 ${
                              (tagRatings[tag] || 5) >= s
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-700 rounded-full p-0.5 cursor-pointer ml-1"
                      title={`Remove ${tag}`}
                      aria-label={`Remove ${tag}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            {remainingSuggestions.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar text-[11px] text-slate-500">
                <span className="shrink-0 font-semibold text-slate-400">Suggestions:</span>
                {remainingSuggestions.slice(0, 4).map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleQuickAddSuggestedTag(sug)}
                    className="shrink-0 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors font-medium"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auditor Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Auditor / Submitter Handle
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Maria Santos, PWD Advocate"
              className="w-full px-3.5 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-2 focus:outline-slate-900 transition-colors"
            />
          </div>

          {/* Members with access / Community verification section */}
          <div className="space-y-2 pt-1">
            <span className="block text-xs font-bold text-slate-800">
              Community verification & visibility
            </span>

            <div className="space-y-2 text-xs text-slate-600">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowCommunityVerification}
                  onChange={(e) => setAllowCommunityVerification(e.target.checked)}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer"
                />
                <span>Allow community members to confirm or dispute these accessibility tags</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOpenPublicPlace}
                  onChange={(e) => setIsOpenPublicPlace(e.target.checked)}
                  className="w-4 h-4 text-slate-900 rounded border-slate-300 focus:ring-slate-900 cursor-pointer"
                />
                <span>Include in Cagayan de Oro public crowdsourced accessibility map</span>
              </label>
            </div>
          </div>

          {/* Coordinates indicator & GPS sync */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-mono">
              <MapPin className="w-4 h-4 text-slate-700 shrink-0" />
              <span>
                Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isLocating}
              className="text-slate-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-sky-600' : ''}`} />
              <span>Locate Me (GPS)</span>
            </button>
          </div>

          {/* Footer Actions (Direct Recreation: Cancel / [📍 Pin location]) */}
          <div className="pt-2 flex items-center justify-end gap-3 font-space">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-bold text-[#0F172A] bg-white rounded-xl border-[1.5px] border-[#0F172A] shadow-[0_1.5px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 bg-[#21524B] hover:bg-[#1a423d] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border-[1.5px] border-[#0F172A] shadow-[0_2px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-white" />
              <span>Pin location</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
