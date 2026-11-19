/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RoutePreviewResult } from './routingAndSpatial';

// Declare Google on window for type safety
declare global {
  interface Window {
    google?: any;
    __googleMapsPromise?: Promise<any>;
  }
}

/**
 * Strict geographic bounding box locking the map to the Philippine archipelago.
 * Northern tip: Batanes (21.5° N)
 * Southern tip: Tawi-Tawi (4.5° N)
 * Western edge: Palawan (116.5° E)
 * Eastern edge: Mindanao / Pacific (127.0° E)
 */
export const PHILIPPINES_BOUNDS = {
  north: 21.5,
  south: 4.5,
  west: 116.5,
  east: 127.0,
};

/**
 * Dynamically loads the official Google Maps JavaScript API with Philippine region biasing.
 */
export function loadGoogleMaps(apiKey?: string): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));

  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (window.__googleMapsPromise) {
    return window.__googleMapsPromise;
  }

  const key = apiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  window.__googleMapsPromise = new Promise((resolve, reject) => {
    // Check if script is already injected
    const existing = document.getElementById('google-maps-js');
    if (existing) {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        existing.addEventListener('load', () => resolve(window.google.maps));
        existing.addEventListener('error', (err) => reject(err));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-js';
    // Append region=PH and language=en for Philippine localization
    const keyParam = key ? `&key=${encodeURIComponent(key)}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?v=weekly${keyParam}&libraries=places,geometry,marker&region=PH&language=en`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps SDK loaded but window.google.maps is undefined.'));
      }
    };

    script.onerror = (err) => {
      reject(new Error('Failed to load Google Maps script. Check your internet connection or API key.'));
    };

    document.head.appendChild(script);
  });

  return window.__googleMapsPromise;
}

/**
 * Generates an SVG data URL for a Google Maps custom accessibility marker.
 */
export function buildGoogleMarkerSvg(
  colorHex: string,
  categoryIconSvg: string,
  rating: number,
  isSelected: boolean
): string {
  const ratingText = rating > 0 ? rating.toFixed(1) : '–';
  const strokeWidth = isSelected ? 3 : 2;
  const strokeColor = isSelected ? '#0f766e' : '#ffffff';
  const size = isSelected ? 48 : 40;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 14}" viewBox="0 0 44 58" fill="none">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <!-- Pin Body -->
        <path d="M22 2C11 2 2 11 2 22C2 35 22 56 22 56C22 56 42 35 42 22C42 11 33 2 22 2Z" 
              fill="${colorHex}" 
              stroke="${strokeColor}" 
              stroke-width="${strokeWidth}" />
        <!-- White Inner Disc -->
        <circle cx="22" cy="22" r="14" fill="#ffffff" />
        <!-- Category Icon Centered -->
        <g transform="translate(14, 14) scale(0.66)" stroke="${colorHex}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round">
          ${categoryIconSvg}
        </g>
      </g>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/**
 * Calculates accessible pedestrian routes using the Google Maps Directions Service.
 */
export async function calculateGoogleWalkingRoute(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number }
): Promise<RoutePreviewResult> {
  const google = await loadGoogleMaps();

  return new Promise((resolve, reject) => {
    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.WALKING,
        provideRouteAlternatives: false,
        region: 'PH',
      },
      (result: any, status: any) => {
        if (status === 'OK' && result && result.routes && result.routes[0]) {
          const route = result.routes[0];
          const leg = route.legs[0];

          // Extract path points
          const coordinates: [number, number][] = [];
          if (route.overview_path) {
            route.overview_path.forEach((pt: any) => {
              coordinates.push([pt.lat(), pt.lng()]);
            });
          }

          const distKm = Math.round(((leg.distance?.value || 1000) / 1000) * 10) / 10;
          const durationMins = Math.max(1, Math.round((leg.duration?.value || 60) / 60));

          resolve({
            coordinates,
            distanceKm: distKm,
            durationMinutes: durationMins,
            isFallbackArc: false,
            summaryText: `Google Pedestrian Route (${distKm} km • ~${durationMins} min mobility transit)`,
          });
        } else {
          reject(new Error(`Google Directions failed with status: ${status}`));
        }
      }
    );
  });
}
