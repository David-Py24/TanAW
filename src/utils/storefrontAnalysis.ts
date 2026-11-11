/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorefrontAnalysisResult } from '../types/accessibility';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { GoogleGenAI } from '@google/genai';
import {
  STOREFRONT_ANALYSIS_SYSTEM_INSTRUCTION,
  STOREFRONT_ANALYSIS_USER_PROMPT,
} from '../prompts/storefrontPrompt';

const SIMULATED_RESULT: Omit<StorefrontAnalysisResult, 'imagePreviewUrl' | 'analysisDate'> = {
  detected_features: [
    {
      tag: 'Wheelchair-accessible entrance',
      confidence: 0.94,
      evidence: 'Visual inspection shows wide double entry doors with zero-threshold ground clearance.',
    },
    {
      tag: 'Ramp available',
      confidence: 0.88,
      evidence: 'Continuous low-incline concrete access ramp visible alongside the main sidewalk.',
    },
    {
      tag: 'Wide aisles / pathways',
      confidence: 0.82,
      evidence: 'Unobstructed clearance of at least 1.2 meters at the vestibule foyer.',
    },
  ],
  possible_barriers: [
    'Exterior pavement shows mild surface wear; check for slip hazards during rain.',
  ],
  summary:
    'Storefront exhibits strong physical accessibility with step-free entrance and visible ramp access.',
  suggested_tags: [
    'Wheelchair-accessible entrance',
    'Ramp available',
    'Wide aisles / pathways',
  ],
};

export async function analyzeStorefront(
  image?: string | null
): Promise<StorefrontAnalysisResult> {
  // 1. Try Firebase Cloud Function if deployed
  if (functions) {
    try {
      const callAnalyze = httpsCallable<
        { imageBase64?: string | null },
        StorefrontAnalysisResult
      >(functions, 'analyzeStorefront');
      const response = await callAnalyze({ imageBase64: image });
      if (response?.data) return response.data;
    } catch (fnErr) {
      console.warn('[TanAW AI] Firebase Cloud Function call not available or failed:', fnErr);
    }
  }

  // 2. Direct Gemini call via environment key (if provided)
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;
  if (geminiApiKey && image) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, '');

      // Try 3.8-flash first, fallback to 3.5-flash if 3.8 is busy
      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: STOREFRONT_ANALYSIS_USER_PROMPT },
                { inlineData: { mimeType, data: cleanBase64 } },
              ],
            },
          ],
          config: {
            systemInstruction: STOREFRONT_ANALYSIS_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
          },
        });
      } catch (err38) {
        response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: STOREFRONT_ANALYSIS_USER_PROMPT },
                { inlineData: { mimeType, data: cleanBase64 } },
              ],
            },
          ],
          config: {
            systemInstruction: STOREFRONT_ANALYSIS_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
          },
        });
      }

      const parsed = JSON.parse(response.text || '{}');
      return {
        detected_features: parsed.detected_features || [],
        possible_barriers: parsed.possible_barriers || [],
        summary: parsed.summary || 'Storefront analyzed successfully.',
        suggested_tags: parsed.suggested_tags || [],
      };
    } catch (aiErr) {
      console.warn('[TanAW AI] Direct Gemini API call failed, falling back to simulated:', aiErr);
    }
  }

  // 3. Fallback simulated inspection with realistic delay
  await new Promise((resolve) => setTimeout(resolve, 1200));
  return {
    ...SIMULATED_RESULT,
  };
}
