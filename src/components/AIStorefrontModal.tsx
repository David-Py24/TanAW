/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LocationPin, StorefrontAnalysisResult } from '../types/accessibility';
import { analyzeStorefront } from '../utils/storefrontAnalysis';
import { useA11y } from '../context/A11yContext';
import { Modal } from './ui/Modal';
import { PhotoInputSection } from './storefront/PhotoInputSection';
import { AnalysisResultsSection } from './storefront/AnalysisResultsSection';
import { Sparkles, AlertTriangle, ArrowRight, Plus, RefreshCw } from 'lucide-react';

interface AIStorefrontModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetLocation?: LocationPin | null;
  locations: LocationPin[];
  onApplyTagsToLocation: (
    locationId: string,
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult
  ) => void;
  onStartNewPinFromAnalysis: (
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult,
    photoDataUrl: string
  ) => void;
}

export const AIStorefrontModal: React.FC<AIStorefrontModalProps> = ({
  isOpen,
  onClose,
  targetLocation,
  locations,
  onApplyTagsToLocation,
  onStartNewPinFromAnalysis,
}) => {
  const { announce } = useA11y();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<StorefrontAnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Accepted tags state: map of tagName -> boolean
  const [acceptedTagsMap, setAcceptedTagsMap] = useState<Record<string, boolean>>({});

  // Target location selection if none pre-selected
  const [selectedLocationId, setSelectedLocationId] = useState<string>(
    targetLocation ? targetLocation.id : ''
  );

  // Run Gemini analysis API call
  const handleAnalyzePhoto = async () => {
    if (!selectedImage) {
      setErrorMsg('Please upload a storefront photo or select a sample image first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    announce('Analyzing storefront accessibility with Gemini AI. Please wait a moment.');

    try {
      const data: StorefrontAnalysisResult = await analyzeStorefront(selectedImage);
      data.imagePreviewUrl = selectedImage;
      data.analysisDate = new Date().toISOString();

      setAnalysisResult(data);

      // Pre-select all suggested tags as accepted by default
      const initialMap: Record<string, boolean> = {};
      if (Array.isArray(data.suggested_tags)) {
        data.suggested_tags.forEach((tag) => {
          initialMap[tag] = true;
        });
      }
      setAcceptedTagsMap(initialMap);
      announce(
        `Analysis complete! Detected ${data.detected_features?.length || 0} features and ${
          data.possible_barriers?.length || 0
        } potential barriers.`
      );
    } catch (err: any) {
      console.error('Storefront analysis error:', err);
      setErrorMsg(
        err.message ||
          'Could not analyze photo. The image may be blurry, lack architectural context, or the AI service encountered an error.'
      );
      announce('Analysis failed. Please check the photo or try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleTagAcceptance = (tagName: string) => {
    setAcceptedTagsMap((prev) => {
      const next = { ...prev, [tagName]: !prev[tagName] };
      announce(
        next[tagName]
          ? `Accepted tag ${tagName}`
          : `Rejected tag ${tagName}`
      );
      return next;
    });
  };

  const getAcceptedTagsList = (): string[] => {
    return Object.keys(acceptedTagsMap).filter((tag) => acceptedTagsMap[tag]);
  };

  const handleApplyToExisting = () => {
    const locId = targetLocation ? targetLocation.id : selectedLocationId;
    if (!locId) {
      setErrorMsg('Please select a location to update.');
      return;
    }
    if (!analysisResult) return;

    const accepted = getAcceptedTagsList();
    onApplyTagsToLocation(locId, accepted, analysisResult);
    announce('Accessibility tags applied to location.');
    onClose();
  };

  const handleCreateNewPin = () => {
    if (!analysisResult || !selectedImage) return;
    const accepted = getAcceptedTagsList();
    onStartNewPinFromAnalysis(accepted, analysisResult, selectedImage);
    announce('Opening Add Location pin flow with accepted AI tags.');
    onClose();
  };

  const modalFooter = (
    <div className="w-full flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
      >
        Cancel
      </button>

      {selectedImage && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedImage(null);
              setAnalysisResult(null);
              setErrorMsg(null);
            }}
            className="px-4 py-2 border-2 border-slate-300 hover:border-indigo-500 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Change Photo</span>
          </button>

          {analysisResult && (
            <>
              <button
                type="button"
                onClick={handleCreateNewPin}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Pin</span>
              </button>

              <button
                type="button"
                onClick={handleApplyToExisting}
                disabled={!targetLocation && !selectedLocationId}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-transform active:scale-95"
              >
                <span>Apply to Pin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Storefront Accessibility Analyzer"
      subtitle="Powered by Gemini Vision • Automatic Entrance & Barrier Detection"
      headerClassName="bg-slate-50"
      maxWidthClassName="max-w-3xl"
      icon={
        <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
          <Sparkles className="w-5 h-5 text-amber-300" />
        </div>
      }
      footer={modalFooter}
    >
      <div className="space-y-6">
        <PhotoInputSection
          selectedImage={selectedImage}
          onSelectImage={(img) => {
            setSelectedImage(img);
            if (!img) setAnalysisResult(null);
            setErrorMsg(null);
          }}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyzePhoto}
        />

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Analysis notice: </span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {analysisResult && (
          <AnalysisResultsSection
            analysisResult={analysisResult}
            acceptedTagsMap={acceptedTagsMap}
            onToggleTagAcceptance={toggleTagAcceptance}
            targetLocation={targetLocation}
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelectLocationId={setSelectedLocationId}
          />
        )}
      </div>
    </Modal>
  );
};
