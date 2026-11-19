/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { LocationPin } from '../types/accessibility';
import { calculateDistanceKm, getRatingColor } from '../utils/storage';
import {
  CityPreset,
  DEFAULT_CDO_CENTER,
  RoutePreviewResult,
  getCategoryIconSvg,
} from '../utils/routingAndSpatial';
import {
  PHILIPPINES_BOUNDS,
  loadGoogleMaps,
  buildGoogleMarkerSvg,
  calculateGoogleWalkingRoute,
} from '../utils/googleMapsLoader';
import { useA11y } from '../context/A11yContext';
import { MapFloatingCard } from './MapFloatingCard';
import {
  Locate,
  MapPin,
  ZoomIn,
  ZoomOut,
  Layers,
  Check,
  Radar,
  Crosshair,
  Navigation,
  Sparkles,
  Eye,
  Key,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface MapViewProps {
  locations: LocationPin[];
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  isAddingLocation: boolean;
  newPinCoords: { lat: number; lng: number } | null;
  onNewPinCoordsChange: (coords: { lat: number; lng: number }) => void;
  activeCity: CityPreset;
  activeRoute: RoutePreviewResult | null;
  onToggleRoutePreview: (loc: LocationPin) => void;
  onClearRoute: () => void;
  userCoords: { lat: number; lng: number } | null;
  onUserCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  nearbyRadiusKm: number | null;
  onNearbyRadiusChange: (radius: number | null) => void;
  onOpenAIAnalyzer?: () => void;
}

export type GoogleMapStyle = 'roadmap' | 'satellite' | 'hybrid' | 'terrain';

const GOOGLE_MAP_STYLES: Array<{ id: GoogleMapStyle; label: string; desc: string }> = [
  { id: 'roadmap', label: 'Standard Roadmap', desc: 'Google clean street & infrastructure map' },
  { id: 'satellite', label: 'Satellite', desc: 'High-resolution Google Earth satellite imagery' },
  { id: 'hybrid', label: 'Hybrid', desc: 'Satellite imagery with street & landmark labels' },
  { id: 'terrain', label: 'Terrain', desc: 'Topographic elevation and physical features' },
];

export const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
  isAddingLocation,
  newPinCoords,
  onNewPinCoordsChange,
  activeCity,
  activeRoute,
  onToggleRoutePreview,
  onClearRoute,
  userCoords,
  onUserCoordsChange,
  nearbyRadiusKm,
  onNearbyRadiusChange,
  onOpenAIAnalyzer,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const streetViewContainerRef = useRef<HTMLDivElement>(null);

  const googleMapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const newPinMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userCircleRef = useRef<any>(null);
  const routePolylineRef = useRef<any>(null);
  const routeCasingRef = useRef<any>(null);
  const streetViewPanoramaRef = useRef<any>(null);

  const { announce } = useA11y();
  const [isLocating, setIsLocating] = useState(false);
  const [showSummaryCard, setShowSummaryCard] = useState(true);
  const [mapStyle, setMapStyle] = useState<GoogleMapStyle>('roadmap');
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);
  const [showStreetView, setShowStreetView] = useState(false);

  // Google Maps SDK loading and error state
  const [isGoogleLoading, setIsGoogleLoading] = useState(true);
  const [googleLoadError, setGoogleLoadError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean>(
    Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)
  );

  // Initialize Google Map
  useEffect(() => {
    let isMounted = true;

    // Skip the SDK request until a key is configured; the setup banner explains why.
    if (!hasApiKey) {
      setIsGoogleLoading(false);
      return;
    }

    loadGoogleMaps()
      .then((googleMaps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const initialCenter = activeCity
          ? { lat: activeCity.lat, lng: activeCity.lng }
          : { lat: DEFAULT_CDO_CENTER.lat, lng: DEFAULT_CDO_CENTER.lng };

        const map = new googleMaps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: activeCity?.zoom || 14,
          mapTypeId: mapStyle,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          // STRICT PHILIPPINES BOUNDS RESTRICTION
          restriction: {
            latLngBounds: PHILIPPINES_BOUNDS,
            strictBounds: true,
          },
          clickableIcons: false,
        });

        googleMapInstanceRef.current = map;
        setIsGoogleLoading(false);

        // Map Click Listener for adding pin or dismissing card
        map.addListener('click', (e: any) => {
          if (!e.latLng) return;
          const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          if (isAddingLocation) {
            onNewPinCoordsChange(coords);
          } else {
            setShowSummaryCard(false);
          }
        });
      })
      .catch((err) => {
        if (isMounted) {
          setIsGoogleLoading(false);
          setGoogleLoadError(err.message || 'Could not load Google Maps SDK');
        }
      });

    return () => {
      isMounted = false;
      if (googleMapInstanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(googleMapInstanceRef.current);
      }
    };
  }, [hasApiKey]);

  // Update Map Type (Roadmap / Satellite / Hybrid / Terrain)
  useEffect(() => {
    if (googleMapInstanceRef.current) {
      googleMapInstanceRef.current.setMapTypeId(mapStyle);
    }
  }, [mapStyle]);

  // Fly / Pan to active city when changed
  useEffect(() => {
    if (!googleMapInstanceRef.current || !activeCity) return;
    googleMapInstanceRef.current.panTo({ lat: activeCity.lat, lng: activeCity.lng });
    googleMapInstanceRef.current.setZoom(activeCity.zoom);
  }, [activeCity?.id]);

  // Center on selected location
  useEffect(() => {
    if (selectedLocation && googleMapInstanceRef.current) {
      googleMapInstanceRef.current.panTo({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
      });
      googleMapInstanceRef.current.setZoom(Math.max(googleMapInstanceRef.current.getZoom(), 15));
      setShowSummaryCard(true);

      // If Street View is open, update panorama coordinates
      if (showStreetView && streetViewPanoramaRef.current) {
        streetViewPanoramaRef.current.setPosition({
          lat: selectedLocation.lat,
          lng: selectedLocation.lng,
        });
      }
    }
  }, [selectedLocation?.id]);

  // Render Google Custom Accessible Markers
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google?.maps) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const map = googleMapInstanceRef.current;
    const googleMaps = window.google.maps;

    locations.forEach((loc) => {
      const isSelected = selectedLocation?.id === loc.id;
      const colorMeta = getRatingColor(loc.averageRating, loc.totalReviews);
      const iconSvg = getCategoryIconSvg(loc.category);
      const markerIconUrl = buildGoogleMarkerSvg(
        colorMeta.hex,
        iconSvg,
        loc.averageRating,
        isSelected
      );

      const marker = new googleMaps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: map,
        title: `${loc.name} (${colorMeta.label})`,
        icon: {
          url: markerIconUrl,
          scaledSize: new googleMaps.Size(isSelected ? 48 : 40, isSelected ? 62 : 54),
          anchor: new googleMaps.Point(isSelected ? 24 : 20, isSelected ? 60 : 52),
        },
        zIndex: isSelected ? 1000 : 10,
        animation: isSelected ? googleMaps.Animation.BOUNCE : null,
      });

      if (isSelected) {
        setTimeout(() => marker.setAnimation(null), 750);
      }

      marker.addListener('click', () => {
        onSelectLocation(loc);
        setShowSummaryCard(true);
      });

      markersRef.current.push(marker);
    });
  }, [locations, selectedLocation]);

  // Render User Location & Proximity Radius Ring
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google?.maps) return;

    const map = googleMapInstanceRef.current;
    const googleMaps = window.google.maps;

    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    if (userCircleRef.current) userCircleRef.current.setMap(null);

    const origin = userCoords || (nearbyRadiusKm !== null ? DEFAULT_CDO_CENTER : null);
    if (!origin) return;

    // Radius Circle
    if (nearbyRadiusKm !== null) {
      userCircleRef.current = new googleMaps.Circle({
        map,
        center: { lat: origin.lat, lng: origin.lng },
        radius: nearbyRadiusKm * 1000,
        strokeColor: '#0d9488',
        strokeOpacity: 0.8,
        strokeWeight: 1.5,
        fillColor: '#14b8a6',
        fillOpacity: 0.08,
      });
    }

    // User GPS Marker
    userMarkerRef.current = new googleMaps.Marker({
      map,
      position: { lat: origin.lat, lng: origin.lng },
      title: userCoords ? 'Your Current Location' : 'Philippine Reference Point',
      icon: {
        path: googleMaps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#0d9488',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3,
      },
      zIndex: 999,
    });
  }, [userCoords, nearbyRadiusKm]);

  // Render Pedestrian Route Polyline
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google?.maps) return;

    const map = googleMapInstanceRef.current;
    const googleMaps = window.google.maps;

    if (routePolylineRef.current) routePolylineRef.current.setMap(null);
    if (routeCasingRef.current) routeCasingRef.current.setMap(null);

    if (!activeRoute || activeRoute.coordinates.length < 2) return;

    const path = activeRoute.coordinates.map((pt) => ({ lat: pt[0], lng: pt[1] }));

    // High-contrast casing
    routeCasingRef.current = new googleMaps.Polyline({
      map,
      path,
      strokeColor: '#0f172a',
      strokeOpacity: 0.45,
      strokeWeight: 7,
    });

    // Vibrant Google walking route line
    routePolylineRef.current = new googleMaps.Polyline({
      map,
      path,
      strokeColor: '#0284c7',
      strokeOpacity: 0.95,
      strokeWeight: 4,
    });

    // Fit bounds
    const bounds = new googleMaps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
  }, [activeRoute]);

  // Draggable pin for "+ Add Location"
  useEffect(() => {
    if (!googleMapInstanceRef.current || !window.google?.maps) return;

    const map = googleMapInstanceRef.current;
    const googleMaps = window.google.maps;

    if (isAddingLocation && newPinCoords) {
      if (!newPinMarkerRef.current) {
        newPinMarkerRef.current = new googleMaps.Marker({
          map,
          position: { lat: newPinCoords.lat, lng: newPinCoords.lng },
          draggable: true,
          title: 'Drag to adjust place coordinates',
          icon: {
            path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
            fillColor: '#0d9488',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 2,
            anchor: new googleMaps.Point(12, 24),
          },
          zIndex: 1200,
          animation: googleMaps.Animation.DROP,
        });

        newPinMarkerRef.current.addListener('dragend', (e: any) => {
          if (e.latLng) {
            onNewPinCoordsChange({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });
      } else {
        newPinMarkerRef.current.setPosition({ lat: newPinCoords.lat, lng: newPinCoords.lng });
      }
    } else if (newPinMarkerRef.current) {
      newPinMarkerRef.current.setMap(null);
      newPinMarkerRef.current = null;
    }
  }, [isAddingLocation, newPinCoords]);

  // Street View Panorama activation
  useEffect(() => {
    if (!showStreetView || !streetViewContainerRef.current || !window.google?.maps) return;

    const target = selectedLocation || (locations.length > 0 ? locations[0] : null);
    if (!target) return;

    const googleMaps = window.google.maps;
    const panorama = new googleMaps.StreetViewPanorama(streetViewContainerRef.current, {
      position: { lat: target.lat, lng: target.lng },
      pov: { heading: 165, pitch: 0 },
      zoom: 1,
      addressControl: true,
      fullscreenControl: false,
    });

    streetViewPanoramaRef.current = panorama;
  }, [showStreetView, selectedLocation]);

  // GPS Locate
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      announce('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onUserCoordsChange(coords);
        if (googleMapInstanceRef.current) {
          googleMapInstanceRef.current.panTo(coords);
          googleMapInstanceRef.current.setZoom(15);
          announce('Centered on your GPS location.');
        }
      },
      () => {
        setIsLocating(false);
        const coords = DEFAULT_CDO_CENTER;
        onUserCoordsChange(coords);
        if (googleMapInstanceRef.current) {
          googleMapInstanceRef.current.panTo(coords);
          googleMapInstanceRef.current.setZoom(15);
        }
        announce('Using reference location.');
      },
      { timeout: 7000 }
    );
  };

  const handleRecenter = () => {
    if (!googleMapInstanceRef.current) return;
    if (activeCity) {
      googleMapInstanceRef.current.panTo({ lat: activeCity.lat, lng: activeCity.lng });
      googleMapInstanceRef.current.setZoom(activeCity.zoom);
    } else {
      googleMapInstanceRef.current.panTo(DEFAULT_CDO_CENTER);
      googleMapInstanceRef.current.setZoom(14);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-100 overflow-hidden select-none">
      {/* Google Maps Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[350px]"
        tabIndex={0}
        aria-label="Google Maps Philippine Interactive Canvas"
      />

      {/* Embedded Google Street View Overlay Panel */}
      {showStreetView && (
        <div className="absolute inset-x-4 top-16 bottom-20 z-[600] bg-black rounded-3xl shadow-2xl overflow-hidden border-2 border-slate-700 flex flex-col animate-scale-up">
          <div className="p-3 bg-slate-900/90 backdrop-blur-md text-white flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold">
                Google Street View · 360° Storefront Audit
              </span>
              {selectedLocation && (
                <span className="text-xs text-slate-400">• {selectedLocation.name}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowStreetView(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              Exit Street View
            </button>
          </div>
          <div ref={streetViewContainerRef} className="w-full flex-1" />
        </div>
      )}

      {/* Missing API Key Guidance Banner (Graceful Buildathon Setup Notice) */}
      {!hasApiKey && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[550] w-11/12 max-w-lg">
          <div className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-amber-300 text-xs text-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 grid place-items-center shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <span>Google Maps Buildathon Ready</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                  PH Locked
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                Map locked to Philippine bounds (`strictBounds: true`). To activate live Google satellite & street view, paste your free key in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-800">.env</code>:
              </p>
              <code className="block mt-1 text-[10px] bg-slate-900 text-emerald-300 px-2 py-1 rounded font-mono select-all">
                VITE_GOOGLE_MAPS_API_KEY="AIzaSy..."
              </code>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps SDK Error Banner */}
      {googleLoadError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[550] w-11/12 max-w-lg">
          <div className="p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-rose-300 text-xs text-slate-800 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 grid place-items-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900">Google Maps could not load</div>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{googleLoadError}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                Check that Maps JavaScript API and Directions API are enabled, and that your key's HTTP referrer
                restrictions allow this origin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Left: Minimal City Badge & Google Maps Platform indicator */}
      <div className="absolute top-4 left-4 z-[500] pointer-events-none select-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800">
            <span className="sm:hidden">{activeCity.shortName || activeCity.name}</span>
            <span className="hidden sm:inline">{activeCity.name}</span>
          </span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="hidden sm:inline text-xs text-slate-500 font-medium">{locations.length} places</span>
          <span className="hidden sm:inline text-slate-300">•</span>
          <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200/60">
            Google Maps
          </span>
        </div>
      </div>

      {/* Top Center: Active Route Banner (Google Walking Route) */}
      {activeRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] pointer-events-auto animate-slide-up">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium shadow-lg flex items-center gap-2.5">
            <Navigation className="w-3.5 h-3.5 text-teal-400" />
            <span>
              <b>Google Walking Route: {activeRoute.distanceKm} km</b> (~{activeRoute.durationMinutes} min mobility transit)
            </span>
            <button
              type="button"
              onClick={onClearRoute}
              className="p-0.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Clear Route"
            >
              <Crosshair className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Right: Minimal Controls Pill (Map Style, Street View, Radar, Locate) */}
      <div className="absolute top-4 right-4 z-[500] flex items-center gap-1.5">
        <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-xs">
          {/* Google Map Type Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowLayerPicker(!showLayerPicker);
                setShowRadiusPicker(false);
              }}
              className={`p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ${
                showLayerPicker ? 'bg-slate-100 text-teal-700' : ''
              }`}
              title="Google Map Styles (Roadmap, Satellite, Terrain)"
              aria-label="Google Map Styles"
            >
              <Layers className="w-4 h-4" />
            </button>

            {showLayerPicker && (
              <div className="absolute top-11 right-0 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-[600] space-y-0.5 animate-scale-up">
                <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Google Map Type
                </span>
                {GOOGLE_MAP_STYLES.map((style) => {
                  const isActive = mapStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        setMapStyle(style.id);
                        setShowLayerPicker(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-teal-50 text-teal-900 font-semibold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{style.label}</div>
                        <div className="text-[10px] text-slate-500">{style.desc}</div>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Google Street View Toggle Button */}
          <button
            type="button"
            onClick={() => setShowStreetView(!showStreetView)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              showStreetView ? 'bg-amber-100 text-amber-900' : 'text-slate-700 hover:bg-slate-100'
            }`}
            title="Google Street View (360° Entrance Audit)"
            aria-label="Toggle Google Street View"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Proximity Radar */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowRadiusPicker(!showRadiusPicker);
                setShowLayerPicker(false);
              }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                nearbyRadiusKm !== null
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Filter nearby places by radius"
              aria-label="Filter nearby places by radius"
            >
              <Radar className="w-4 h-4" />
            </button>

            {showRadiusPicker && (
              <div className="absolute top-11 right-0 w-44 bg-white rounded-xl shadow-xl border border-slate-200 p-1.5 z-[600] space-y-0.5 animate-scale-up">
                <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Nearby Radius
                </span>
                {[
                  { label: 'Off (All distances)', val: null },
                  { label: 'Within 3 km', val: 3 },
                  { label: 'Within 5 km', val: 5 },
                  { label: 'Within 10 km', val: 10 },
                  { label: 'Within 25 km', val: 25 },
                ].map((opt) => (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => {
                      onNearbyRadiusChange(opt.val);
                      setShowRadiusPicker(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between text-left transition-colors cursor-pointer ${
                      nearbyRadiusKm === opt.val
                        ? 'bg-teal-50 text-teal-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {nearbyRadiusKm === opt.val && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* GPS Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Locate my position (GPS)"
            aria-label="Locate my position"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-teal-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Right: Zoom & Recenter Controls (above the floating navigation) */}
      <div className="absolute top-20 right-4 z-[500] flex flex-col gap-1 p-1 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => {
            if (googleMapInstanceRef.current) {
              googleMapInstanceRef.current.setZoom(googleMapInstanceRef.current.getZoom() + 1);
            }
          }}
          className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (googleMapInstanceRef.current) {
              googleMapInstanceRef.current.setZoom(googleMapInstanceRef.current.getZoom() - 1);
            }
          }}
          className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-slate-200 my-0.5" />
        <button
          type="button"
          onClick={handleRecenter}
          className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Recenter to active region"
          aria-label="Recenter to active region"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Left: Floating AI Agent Trigger (desktop; phones use the dock/panel entry points) */}
      {onOpenAIAnalyzer && (
        <div className="absolute bottom-36 left-4 z-[500] hidden md:block">
          <button
            type="button"
            onClick={onOpenAIAnalyzer}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white shadow-lg backdrop-blur-md border border-slate-700/80 text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Scan storefront photo with TanAW AI Agent"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
            <span>TanAW AI Scanner</span>
          </button>
        </div>
      )}

      {/* Floating Card at Bottom (Only when a place is actively selected) */}
      {showSummaryCard && selectedLocation && (
        <MapFloatingCard
          location={selectedLocation}
          onOpenDetails={onOpenDetails}
          onClose={() => setShowSummaryCard(false)}
          userCoords={userCoords}
          activeRoute={activeRoute}
          onToggleRoutePreview={onToggleRoutePreview}
        />
      )}
    </div>
  );
};
