/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocationPin } from '../types/accessibility';

/**
 * The app starts with an empty map. No venues, addresses, or accessibility
 * ratings are preloaded; every place is added by the user and persisted in
 * this browser's localStorage.
 *
 * To seed demo places again, append LocationPin objects here.
 */
export const INITIAL_LOCATIONS: LocationPin[] = [];

export interface SampleStorefront {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  expectedFeatures: string[];
  expectedBarriers: string[];
}

export const SAMPLE_STOREFRONTS: SampleStorefront[] = [
  {
    id: 'sample-ramp-entrance',
    title: 'Modern Clinic with Gentle Ramp & Handrails',
    description: 'Low-slope concrete ramp with dual yellow powder-coated handrails and automatic sliding glass doors.',
    imageUrl: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=900&q=80',
    expectedFeatures: ['Ramp available', 'Wheelchair-accessible entrance', 'Wide aisles / pathways'],
    expectedBarriers: [],
  },
  {
    id: 'sample-stepped-shop',
    title: 'Historic Brick Store with 3 Concrete Steps',
    description: 'Elevated entrance with three steep concrete steps, narrow wooden door, and no exterior ramp.',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=900&q=80',
    expectedFeatures: ['Staff trained in assistance'],
    expectedBarriers: ['3 concrete steps at entrance without ramp', 'Narrow swinging doorway'],
  },
  {
    id: 'sample-mall-entry',
    title: 'Shopping Center Glass Plaza',
    description: 'Wide level threshold entrance with elevator signage, automatic doors, and braille guidance plaques.',
    imageUrl: 'https://images.unsplash.com/photo-1567449303078-57ad995bd302?auto=format&fit=crop&w=900&q=80',
    expectedFeatures: ['Wheelchair-accessible entrance', 'Elevator access', 'Accessible parking', 'Wide aisles / pathways'],
    expectedBarriers: [],
  },
  {
    id: 'sample-cozy-cafe',
    title: 'Subdued Artisan Cafe & Patio',
    description: 'Ground-level patio seating with warm, low-glare lighting and level threshold doors.',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=900&q=80',
    expectedFeatures: ['Quiet / low-sensory zone', 'Wheelchair-accessible entrance', 'Staff trained in assistance'],
    expectedBarriers: [],
  },
];
