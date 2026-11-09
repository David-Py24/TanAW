/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CategoryType, LocationPin } from '../types/accessibility';
import { calculateDistanceKm, getRatingColor } from './storage';

export interface CityPreset {
  id: string;
  name: string;
  shortName: string;
  region: string;
  lat: number;
  lng: number;
  zoom: number;
}

export const MINDANAO_CITY_PRESETS: CityPreset[] = [
  {
    id: 'mindanao',
    name: 'Mindanao Island',
    shortName: 'Mindanao',
    region: 'All Regions • Southern Philippines',
    lat: 7.5,
    lng: 125.0,
    zoom: 7,
  },
  {
    id: 'cdo',
    name: 'Cagayan de Oro',
    shortName: 'CDO',
    region: 'Northern Mindanao (Region X)',
    lat: 8.4822,
    lng: 124.6496,
    zoom: 14,
  },
  {
    id: 'davao',
    name: 'Davao City',
    shortName: 'Davao',
    region: 'Davao Region (Region XI)',
    lat: 7.0731,
    lng: 125.6128,
    zoom: 13,
  },
  {
    id: 'gensan',
    name: 'General Santos',
    shortName: 'GenSan',
    region: 'SOCCSKSARGEN (Region XII)',
    lat: 6.1127,
    lng: 125.1748,
    zoom: 14,
  },
  {
    id: 'butuan',
    name: 'Butuan City',
    shortName: 'Butuan',
    region: 'Caraga (Region XIII)',
    lat: 8.9492,
    lng: 125.5406,
    zoom: 14,
  },
  {
    id: 'zamboanga',
    name: 'Zamboanga City',
    shortName: 'Zamboanga',
    region: 'Zamboanga Peninsula (Region IX)',
    lat: 6.9125,
    lng: 122.078,
    zoom: 14,
  },
  {
    id: 'iligan',
    name: 'Iligan City',
    shortName: 'Iligan',
    region: 'Northern Mindanao (Region X)',
    lat: 8.228,
    lng: 124.245,
    zoom: 13,
  },
  {
    id: 'cotabato',
    name: 'Cotabato City',
    shortName: 'Cotabato',
    region: 'BARMM',
    lat: 7.219,
    lng: 124.247,
    zoom: 14,
  },
];

export const DEFAULT_CDO_CENTER = { lat: 8.4822, lng: 124.6473 };

/**
 * Determines the active city or regional label based on map center and zoom level.
 */
export function detectActiveCityPreset(lat: number, lng: number, zoom: number): CityPreset {
  if (zoom <= 9) {
    return MINDANAO_CITY_PRESETS[0];
  }

  let closest = MINDANAO_CITY_PRESETS[1];
  let minDistance = Infinity;

  for (let i = 1; i < MINDANAO_CITY_PRESETS.length; i++) {
    const city = MINDANAO_CITY_PRESETS[i];
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return minDistance <= 45 ? closest : MINDANAO_CITY_PRESETS[0];
}

/**
 * Extracts district or city name from a location address string.
 */
export function extractDistrictOrCity(address: string): string {
  const parts = address.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }
  return parts[0] || 'Mindanao';
}

/**
 * Returns crisp inner SVG elements (24x24 viewBox) for each venue category.
 */
export function getCategoryIconSvg(category: CategoryType | string): string {
  const normalized = category.toLowerCase();

  if (normalized.includes('shopping') || normalized.includes('mall') || normalized.includes('market')) {
    return `
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    `;
  }

  if (normalized.includes('health') || normalized.includes('hospital') || normalized.includes('medical')) {
    return `
      <path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z" />
    `;
  }

  if (normalized.includes('dining') || normalized.includes('cafe') || normalized.includes('restaurant')) {
    return `
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    `;
  }

  if (normalized.includes('education') || normalized.includes('university') || normalized.includes('school') || normalized.includes('library')) {
    return `
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    `;
  }

  if (normalized.includes('public') || normalized.includes('park') || normalized.includes('plaza')) {
    return `
      <path d="M12 3a6 6 0 0 0-6 6c0 2.2 1.2 4.1 3 5.2V19h6v-4.8c1.8-1.1 3-3 3-5.2a6 6 0 0 0-6-6Z" />
      <path d="M9 19h6" />
      <path d="M10 22h4" />
    `;
  }

  if (normalized.includes('hotel') || normalized.includes('lodging')) {
    return `
      <path d="M2 4v16" />
      <path d="M2 8h18a2 2 0 0 1 2 2v10" />
      <path d="M2 17h20" />
      <path d="M6 8v9" />
    `;
  }

  // Default accessibility pin icon
  return `
    <circle cx="12" cy="10" r="3" />
    <path d="M12 2a8 8 0 0 0-8 8c0 5.4 8 12 8 12s8-6.6 8-12a8 8 0 0 0-8-8Z" />
  `;
}

export interface SpatialCluster {
  id: string;
  isCluster: true;
  lat: number;
  lng: number;
  count: number;
  locations: LocationPin[];
  averageRating: number;
  ratedCount: number;
  bounds: [[number, number], [number, number]];
}

export interface SingleMarkerItem {
  id: string;
  isCluster: false;
  lat: number;
  lng: number;
  location: LocationPin;
}

export type MapRenderItem = SpatialCluster | SingleMarkerItem;

/**
 * Converts latitude/longitude to Web Mercator pixel coordinates at a given zoom level.
 */
function latLngToPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/**
 * Groups nearby locations into clusters when zoomed out, and spiderfies overlapping pins when zoomed in.
 */
export function computeMapClusters(
  locations: LocationPin[],
  zoom: number,
  selectedId?: string | null
): MapRenderItem[] {
  if (locations.length === 0) return [];

  // At street-level zoom (>= 14), show individual pins with micro-offset if two pins share exact coordinates
  if (zoom >= 14) {
    const coordCounts = new Map<string, number>();
    return locations.map((loc) => {
      const key = `${loc.lat.toFixed(4)}_${loc.lng.toFixed(4)}`;
      const seen = coordCounts.get(key) || 0;
      coordCounts.set(key, seen + 1);

      if (seen === 0) {
        return {
          id: loc.id,
          isCluster: false,
          lat: loc.lat,
          lng: loc.lng,
          location: loc,
        };
      }

      // Apply a tiny spiral offset (~15 meters) so overlapping pins remain individually clickable
      const angle = seen * (Math.PI / 3);
      const radius = 0.00018 * Math.ceil(seen / 6);
      return {
        id: loc.id,
        isCluster: false,
        lat: loc.lat + Math.sin(angle) * radius,
        lng: loc.lng + Math.cos(angle) * radius,
        location: loc,
      };
    });
  }

  // Pixel radius threshold for clustering at lower zooms
  const clusterPixelRadius = zoom <= 8 ? 64 : zoom <= 11 ? 54 : 44;
  const visited = new Set<string>();
  const result: MapRenderItem[] = [];

  const points = locations.map((loc) => ({
    loc,
    pixel: latLngToPixel(loc.lat, loc.lng, zoom),
  }));

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    if (visited.has(current.loc.id)) continue;

    // If a pin is currently selected and zoom >= 12, keep it unclustered for clarity
    if (selectedId && current.loc.id === selectedId && zoom >= 12) {
      visited.add(current.loc.id);
      result.push({
        id: current.loc.id,
        isCluster: false,
        lat: current.loc.lat,
        lng: current.loc.lng,
        location: current.loc,
      });
      continue;
    }

    const group: LocationPin[] = [current.loc];
    visited.add(current.loc.id);

    for (let j = i + 1; j < points.length; j++) {
      const candidate = points[j];
      if (visited.has(candidate.loc.id)) continue;

      const dx = current.pixel.x - candidate.pixel.x;
      const dy = current.pixel.y - candidate.pixel.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);

      if (pixelDist <= clusterPixelRadius) {
        group.push(candidate.loc);
        visited.add(candidate.loc.id);
      }
    }

    if (group.length === 1) {
      result.push({
        id: current.loc.id,
        isCluster: false,
        lat: current.loc.lat,
        lng: current.loc.lng,
        location: current.loc,
      });
    } else {
      let sumLat = 0;
      let sumLng = 0;
      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLng = Infinity;
      let maxLng = -Infinity;
      let ratedSum = 0;
      let ratedCount = 0;

      group.forEach((item) => {
        sumLat += item.lat;
        sumLng += item.lng;
        if (item.lat < minLat) minLat = item.lat;
        if (item.lat > maxLat) maxLat = item.lat;
        if (item.lng < minLng) minLng = item.lng;
        if (item.lng > maxLng) maxLng = item.lng;
        if (item.averageRating > 0 && item.totalReviews > 0) {
          ratedSum += item.averageRating;
          ratedCount++;
        }
      });

      const avgRating = ratedCount > 0 ? ratedSum / ratedCount : 0;

      result.push({
        id: `cluster_${group.map((g) => g.id).slice(0, 3).join('_')}_${group.length}`,
        isCluster: true,
        lat: sumLat / group.length,
        lng: sumLng / group.length,
        count: group.length,
        locations: group,
        averageRating: avgRating,
        ratedCount,
        bounds: [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
      });
    }
  }

  return result;
}

/**
 * Generates HTML for an interactive category-aware SVG pin with rating badge and pulse ring.
 */
export function buildInteractivePinHtml(
  loc: LocationPin,
  isSelected: boolean,
  showRatingPill: boolean
): string {
  const colorMeta = getRatingColor(loc.averageRating, loc.totalReviews);
  const ratingText = loc.averageRating > 0 ? `${loc.averageRating.toFixed(1)}★` : 'NEW';
  const categorySvg = getCategoryIconSvg(loc.category);

  const isVerified =
    loc.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
    loc.averageRating >= 4.0;

  const pulseRing = isSelected
    ? `<span style="
        position: absolute;
        inset: -8px;
        border-radius: 9999px;
        border: 3px solid ${colorMeta.hex};
        opacity: 0.55;
        animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
        pointer-events: none;
      "></span>`
    : '';

  const verifiedDot = isVerified
    ? `<span style="
        position: absolute;
        top: -3px;
        right: -3px;
        width: 14px;
        height: 14px;
        border-radius: 9999px;
        background: #bef264;
        color: #0f172a;
        border: 2px solid #0f172a;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: 900;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
      " title="Community Verified">✓</span>`
    : '';

  const pillHtml =
    showRatingPill || isSelected
      ? `<div style="
          margin-top: 2px;
          padding: 1px 6px;
          border-radius: 9999px;
          background: ${isSelected ? '#0f172a' : 'rgba(15, 23, 42, 0.92)'};
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          line-height: 1.3;
          letter-spacing: -0.01em;
          white-space: nowrap;
          border: 1.5px solid ${colorMeta.hex};
          box-shadow: 0 2px 6px rgba(0,0,0,0.28);
        ">${ratingText}</div>`
      : '';

  return `
    <div
      class="accessmap-pin-wrapper"
      style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: ${isSelected ? 'scale(1.18) translateY(-4px)' : 'scale(1)'};
        transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        cursor: pointer;
      "
      aria-label="${loc.name}, ${loc.category}, Rating: ${ratingText}"
    >
      <div style="
        position: relative;
        width: 40px;
        height: 40px;
        border-radius: 14px 14px 14px 4px;
        transform: rotate(-45deg);
        background: ${colorMeta.hex};
        border: ${isSelected ? '3px solid #0f172a' : '2.5px solid #ffffff'};
        box-shadow: ${
          isSelected
            ? '0 10px 22px -4px rgba(0,0,0,0.45), 0 0 0 3px rgba(255,255,255,0.9)'
            : '0 6px 14px -2px rgba(0,0,0,0.32)'
        };
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        ${pulseRing}
        <div style="
          transform: rotate(45deg);
          width: 26px;
          height: 26px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.96);
          color: ${colorMeta.hex === '#94a3b8' ? '#334155' : colorMeta.hex};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
            ${categorySvg}
          </svg>
        </div>
        <div style="transform: rotate(45deg); position: absolute; inset: 0; pointer-events: none;">
          ${verifiedDot}
        </div>
      </div>
      ${pillHtml}
    </div>
  `;
}

/**
 * Generates HTML for a spatial cluster marker.
 */
export function buildClusterPinHtml(cluster: SpatialCluster): string {
  const colorMeta = getRatingColor(cluster.averageRating, cluster.ratedCount);
  const size = cluster.count >= 15 ? 54 : cluster.count >= 6 ? 48 : 44;
  const ratingBadge =
    cluster.ratedCount > 0 ? `${cluster.averageRating.toFixed(1)}★ avg` : `${cluster.count} pins`;

  return `
    <div
      style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      "
      title="${cluster.count} locations in this area (Click to expand)"
      aria-label="Cluster of ${cluster.count} locations. Click to zoom in."
    >
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        border-radius: 9999px;
        background: rgba(15, 23, 42, 0.92);
        border: 3px solid ${colorMeta.hex};
        box-shadow: 0 0 0 4px ${colorMeta.hex}33, 0 8px 20px rgba(0,0,0,0.35);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ffffff;
      ">
        <span style="font-size: 14px; font-weight: 900; line-height: 1;">${cluster.count}</span>
        <span style="font-size: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #cbd5e1; margin-top: 1px;">Venues</span>
      </div>
      <div style="
        margin-top: 2px;
        padding: 1px 6px;
        border-radius: 9999px;
        background: ${colorMeta.hex};
        color: #ffffff;
        font-size: 9px;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 2px 5px rgba(0,0,0,0.25);
      ">${ratingBadge}</div>
    </div>
  `;
}

export interface RoutePreviewResult {
  coordinates: [number, number][]; // [lat, lng][]
  distanceKm: number;
  durationMinutes: number;
  isFallbackArc: boolean;
  summaryText: string;
}

/**
 * Generates a smooth curved geodesic arc between two points when offline or across long distances.
 */
export function generateGeodesicArc(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  segments = 32
): [number, number][] {
  const coords: [number, number][] = [];
  const dLat = endLat - startLat;
  const dLng = endLng - startLng;
  // Perpendicular offset for visual curvature
  const offsetLat = -dLng * 0.14;
  const offsetLng = dLat * 0.14;
  const controlLat = (startLat + endLat) / 2 + offsetLat;
  const controlLng = (startLng + endLng) / 2 + offsetLng;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const oneMinusT = 1 - t;
    const lat =
      oneMinusT * oneMinusT * startLat +
      2 * oneMinusT * t * controlLat +
      t * t * endLat;
    const lng =
      oneMinusT * oneMinusT * startLng +
      2 * oneMinusT * t * controlLng +
      t * t * endLng;
    coords.push([lat, lng]);
  }
  return coords;
}

/**
 * Fetches an accessible street route preview between origin and destination using OSRM,
 * with automatic graceful fallback to a geodesic arc.
 */
export async function fetchAccessibleRoute(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<RoutePreviewResult> {
  const straightDistKm = calculateDistanceKm(originLat, originLng, destLat, destLng);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://router.project-osrm.org/route/v1/foot/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coords: [number, number][] = route.geometry.coordinates.map(
          (pair: [number, number]) => [pair[1], pair[0]]
        );
        const distKm = Math.max(0.1, Math.round((route.distance / 1000) * 10) / 10);
        // Estimate wheelchair / assisted mobility travel time (~4.2 km/h = 70 m/min)
        const durationMins = Math.max(1, Math.round(route.distance / 70));

        return {
          coordinates: coords,
          distanceKm: distKm,
          durationMinutes: durationMins,
          isFallbackArc: false,
          summaryText: `Street route via OpenStreetMap (${distKm} km • ~${durationMins} min mobility transit)`,
        };
      }
    }
  } catch {
    // Gracefully fall back to geodesic arc if offline or blocked
  }

  const estimatedStreetKm = Math.max(0.1, Math.round(straightDistKm * 1.25 * 10) / 10);
  const estimatedMins = Math.max(2, Math.round((estimatedStreetKm * 1000) / 70));

  return {
    coordinates: generateGeodesicArc(originLat, originLng, destLat, destLng),
    distanceKm: estimatedStreetKm,
    durationMinutes: estimatedMins,
    isFallbackArc: true,
    summaryText: `Direct path preview (~${estimatedStreetKm} km • ~${estimatedMins} min est.)`,
  };
}

