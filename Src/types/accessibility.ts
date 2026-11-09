/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StandardAccessibilityTag } from '../prompts/storefrontPrompt';

export type CategoryType =
  | 'Shopping'
  | 'Dining & Cafe'
  | 'Healthcare'
  | 'Education'
  | 'Public Space'
  | 'Hotel & Lodging'
  | 'Service'
  | 'Other';

export interface LocationTag {
  name: string;
  rating: number; // 1-5 rating average for this tag
  ratingCount: number;
  confirmations: number;
  disputes: number;
  isAiSuggested?: boolean;
  userVoted?: 'confirm' | 'dispute';
}

export interface TagRatingInput {
  name: string;
  rating: number;
  isAiSuggested?: boolean;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number; // 1-5 overall
  comment: string;
  date: string;
  tagRatings?: Record<string, number>;
  photos?: string[];
}

export interface LocationPin {
  id: string;
  name: string;
  category: CategoryType;
  address: string;
  lat: number;
  lng: number;
  averageRating: number; // 0 if unrated, otherwise 1.0 - 5.0
  totalReviews: number;
  tags: LocationTag[];
  photos: string[];
  reviews: Review[];
  description?: string;
  aiSummary?: string;
  aiBarriers?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DetectedFeature {
  tag: string;
  confidence: number;
  evidence: string;
}

export interface StorefrontAnalysisResult {
  detected_features: DetectedFeature[];
  possible_barriers: string[];
  summary: string;
  suggested_tags: string[];
  imagePreviewUrl?: string;
  analysisDate?: string;
}
