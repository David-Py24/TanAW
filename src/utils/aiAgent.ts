/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocationPin } from '../types/accessibility';
import { CityPreset, MINDANAO_CITY_PRESETS } from './routingAndSpatial';

export interface AIAgentResponse {
  answer: string;
  matchedLocationIds: string[];
  suggestedTags: string[];
  suggestedCity?: CityPreset;
}

const PRESET_QUERIES = [
  {
    prompt: 'Find step-free places with low-incline ramps in CDO',
    label: 'Ramps in CDO',
  },
  {
    prompt: 'Show venues with accessible restrooms & wide doors',
    label: 'Accessible Restrooms',
  },
  {
    prompt: 'Wheelchair-friendly hospitals and medical clinics',
    label: 'Hospitals & Clinics',
  },
  {
    prompt: 'Quiet / low-sensory dining and cafes',
    label: 'Quiet Cafes',
  },
];

export { PRESET_QUERIES };

/**
 * Intelligent AI Assistant for semantic accessibility queries across Mindanao.
 */
export function queryAIAgent(
  query: string,
  locations: LocationPin[],
  activeCity: CityPreset
): AIAgentResponse {
  const q = query.toLowerCase().trim();

  // City detection in query
  let matchedCity: CityPreset | undefined;
  for (const city of MINDANAO_CITY_PRESETS) {
    if (city.id !== 'mindanao' && (q.includes(city.name.toLowerCase()) || q.includes(city.shortName.toLowerCase()))) {
      matchedCity = city;
      break;
    }
  }

  const targetCity = matchedCity || activeCity;

  // Filter candidate locations by city if applicable
  const cityFiltered =
    targetCity.id === 'mindanao'
      ? locations
      : locations.filter((l) => {
          const addr = l.address.toLowerCase();
          return (
            addr.includes(targetCity.name.toLowerCase()) ||
            addr.includes(targetCity.shortName.toLowerCase()) ||
            l.name.toLowerCase().includes(targetCity.shortName.toLowerCase())
          );
        });

  const pool = cityFiltered.length > 0 ? cityFiltered : locations;

  // Semantic scoring based on tags, barriers, category, description, and AI summaries
  const scored = pool.map((loc) => {
    let score = 0;
    const name = loc.name.toLowerCase();
    const desc = (loc.description || '').toLowerCase();
    const aiSum = (loc.aiSummary || '').toLowerCase();
    const cat = loc.category.toLowerCase();
    const tagNames = loc.tags.map((t) => t.name.toLowerCase());

    // Ramp queries
    if (q.includes('ramp') || q.includes('step-free') || q.includes('wheelchair')) {
      if (tagNames.some((t) => t.includes('ramp'))) score += 5;
      if (tagNames.some((t) => t.includes('wheelchair'))) score += 5;
      if (aiSum.includes('ramp') || aiSum.includes('step-free') || aiSum.includes('sliding')) score += 4;
    }

    // Restroom queries
    if (q.includes('restroom') || q.includes('toilet') || q.includes('bathroom')) {
      if (tagNames.some((t) => t.includes('restroom'))) score += 6;
      if (desc.includes('restroom') || aiSum.includes('restroom')) score += 3;
    }

    // Elevator queries
    if (q.includes('elevator') || q.includes('lift') || q.includes('multi-level') || q.includes('floors')) {
      if (tagNames.some((t) => t.includes('elevator'))) score += 6;
    }

    // Quiet / sensory queries
    if (q.includes('quiet') || q.includes('sensory') || q.includes('calm') || q.includes('peaceful')) {
      if (tagNames.some((t) => t.includes('quiet') || t.includes('sensory'))) score += 6;
    }

    // Healthcare queries
    if (q.includes('hospital') || q.includes('clinic') || q.includes('doctor') || q.includes('medical') || q.includes('health')) {
      if (cat.includes('health')) score += 6;
    }

    // Dining queries
    if (q.includes('cafe') || q.includes('dining') || q.includes('restaurant') || q.includes('food') || q.includes('eat')) {
      if (cat.includes('dining')) score += 6;
    }

    // Shopping queries
    if (q.includes('shop') || q.includes('mall') || q.includes('store') || q.includes('market')) {
      if (cat.includes('shopping')) score += 6;
    }

    // General keyword match
    const keywords = q.split(/\s+/).filter((w) => w.length > 2);
    for (const kw of keywords) {
      if (name.includes(kw)) score += 3;
      if (desc.includes(kw)) score += 2;
      if (aiSum.includes(kw)) score += 2;
    }

    // Favor higher community rating and verification
    if (loc.averageRating >= 4.0) score += 2;

    return { loc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const bestMatches = scored.filter((s) => s.score > 0).slice(0, 5);

  if (bestMatches.length === 0) {
    return {
      answer: `I searched across ${targetCity.name}, but couldn't find an exact match for "${query}". Try searching for ramps, wheelchair entry, elevators, or add a new place to the map.`,
      matchedLocationIds: [],
      suggestedTags: ['Wheelchair-accessible entrance', 'Ramp available'],
      suggestedCity: matchedCity,
    };
  }

  const top = bestMatches[0].loc;
  const matchNames = bestMatches.map((m) => m.loc.name).join(', ');

  let answerText = `I analyzed accessibility records for **${targetCity.name}** and identified **${bestMatches.length} matching places**: ${matchNames}. `;
  if (top.aiSummary) {
    answerText += `Top recommendation is **${top.name}** (rated ${top.averageRating > 0 ? top.averageRating.toFixed(1) + '★' : 'Unrated'}) — ${top.aiSummary}`;
  } else {
    answerText += `Top recommendation is **${top.name}** with verified community accessibility ratings.`;
  }

  return {
    answer: answerText,
    matchedLocationIds: bestMatches.map((m) => m.loc.id),
    suggestedTags: top.tags.map((t) => t.name).slice(0, 3),
    suggestedCity: matchedCity,
  };
}
