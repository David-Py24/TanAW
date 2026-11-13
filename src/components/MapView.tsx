/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { CategoryType, LocationPin } from '../types/accessibility';
import { getRatingColor } from '../utils/storage';
import {
  CityPreset,
  DEFAULT_CDO_CENTER,
  MINDANAO_CITY_PRESETS,
  RoutePreviewResult,
  buildClusterPinHtml,
  buildInteractivePinHtml,
  computeMapClusters,
  detectActiveCityPreset,
  fetchAccessibleRoute,
} from '../utils/routingAndSpatial';
import { useA11y } from '../context/A11yContext';
import { MapFloatingCard } from './MapFloatingCard';
import { MapSearchFilterBar } from './MapSearchFilterBar';
import {
  Crosshair,
  Locate,
  MapPin,
  ZoomIn,
  ZoomOut,
  Layers,
  Check,
} from 'lucide-react';

interface MapViewProps {
  locations: LocationPin[];
  totalLocationsCount: number;
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  isAddingLocation: boolean;
  newPinCoords: { lat: number; lng: number } | null;
  onNewPinCoordsChange: (coords: { lat: number; lng: number }) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: CategoryType | 'All';
  onCategoryChange: (cat: CategoryType | 'All') => void;
  onResetFilters: () => void;
  onOpenHowItWorks?: () => void;
  isPlacesPanelOpen?: boolean;
}

export type MapTileStyle = 'osm' | 'hot';

interface TileConfig {
  name: string;
  label: string;
  url: string;
  attribution: string;
  maxZoom: number;
}

const TILE_CONFIGS: Record<MapTileStyle, TileConfig> = {
  osm: {
    name: 'OpenStreetMap (Standard)',
    label: 'Standard Map',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  hot: {
    name: 'OpenStreetMap Humanitarian',
    label: 'Humanitarian',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
};

const MINDANAO_CENTER: [number, number] = [7.5, 125.0];
const DEFAULT_ZOOM = 7;

export const MapView: React.FC<MapViewProps> = ({
  locations,
  totalLocationsCount,
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
  isAddingLocation,
  newPinCoords,
  onNewPinCoordsChange,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  onResetFilters,
  onOpenHowItWorks,
  isPlacesPanelOpen = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const newPinMarkerRef = useRef<L.Marker | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const isAddingLocationRef = useRef<boolean>(isAddingLocation);

  useEffect(() => {
    isAddingLocationRef.current = isAddingLocation;
  }, [isAddingLocation]);

  const { highContrast, announce } = useA11y();
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(true);

  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [activeCity, setActiveCity] = useState<CityPreset>(MINDANAO_CITY_PRESETS[0]);

  const [activeRoute, setActiveRoute] = useState<RoutePreviewResult | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  const [mapStyle, setMapStyle] = useState<MapTileStyle>('osm');
  const [showLayerPicker, setShowLayerPicker] = useState(false);

  // Initialize Map with OpenStreetMap + Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MINDANAO_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
    });

    mapInstanceRef.current = map;

    const activeConfig = TILE_CONFIGS[mapStyle];
    const tileLayer = L.tileLayer(activeConfig.url, {
      maxZoom: activeConfig.maxZoom,
      attribution: activeConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;

    const userLayer = L.layerGroup().addTo(map);
    userLocationLayerRef.current = userLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    const updateViewportState = () => {
      const z = map.getZoom();
      const center = map.getCenter();
      setCurrentZoom(z);
      setActiveCity(detectActiveCityPreset(center.lat, center.lng, z));
    };

    map.on('zoomend', updateViewportState);
    map.on('moveend', updateViewportState);

    // Only update newPinCoords when user is actively in "Add Location" mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (isAddingLocationRef.current) {
        onNewPinCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapStyle changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const activeConfig = TILE_CONFIGS[mapStyle];
    const newLayer = L.tileLayer(activeConfig.url, {
      maxZoom: activeConfig.maxZoom,
      attribution: activeConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapStyle]);

  // Render Clustered & Category-Aware Location Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const renderItems = computeMapClusters(
      locations,
      currentZoom,
      selectedLocation?.id
    );
    const showRatingPill = currentZoom >= 13;

    renderItems.forEach((item) => {
      if (item.isCluster) {
        const clusterIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: buildClusterPinHtml(item),
          iconSize: [52, 62],
          iconAnchor: [26, 31],
        });

        const clusterMarker = L.marker([item.lat, item.lng], {
          icon: clusterIcon,
          title: `${item.count} accessible locations (Click to expand)`,
        });

        clusterMarker.on('click', () => {
          map.flyToBounds(item.bounds, {
            padding: [70, 70],
            maxZoom: Math.min(16, currentZoom + 3),
            duration: 0.75,
          });
          announce(`Expanded cluster of ${item.count} venues.`);
        });

        clusterMarker.addTo(layer);
      } else {
        const loc = item.location;
        const isSelected = selectedLocation?.id === loc.id;
        const colorMeta = getRatingColor(loc.averageRating, loc.totalReviews);
        const ratingText = loc.averageRating > 0 ? loc.averageRating.toFixed(1) : 'Unrated';

        const customIcon = L.divIcon({
          className: 'custom-pin-marker',
          html: buildInteractivePinHtml(loc, isSelected, showRatingPill),
          iconSize: [44, 58],
          iconAnchor: [22, 46],
        });

        const marker = L.marker([item.lat, item.lng], {
          icon: customIcon,
          title: `${loc.name} (${colorMeta.label})`,
          zIndexOffset: isSelected ? 1000 : 0,
        });

        marker.bindTooltip(
          `<div style="font-weight:800;font-size:12px;color:#0f172a;">${loc.name}</div>
           <div style="font-size:10px;font-weight:600;color:#475569;">${loc.category} • ${ratingText}★</div>`,
          {
            direction: 'top',
            offset: [0, -42],
            opacity: 0.96,
          }
        );

        marker.on('click', () => {
          onSelectLocation(loc);
          setShowSummaryCard(true);
          announce(`Selected location: ${loc.name}, rated ${ratingText} stars.`);
        });

        marker.addTo(layer);
      }
    });
  }, [locations, currentZoom, selectedLocation]);

  // Center on selected location if changed
  useEffect(() => {
    if (selectedLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(
        [selectedLocation.lat, selectedLocation.lng],
        Math.max(mapInstanceRef.current.getZoom(), 15),
        { duration: 0.8 }
      );
      setShowSummaryCard(true);
    }
  }, [selectedLocation]);

  // Render User GPS Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocationLayerRef.current) return;
    const layer = userLocationLayerRef.current;
    layer.clearLayers();

    if (!userCoords) return;

    const userIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="position: relative; width: 26px; height: 26px;" title="Your GPS Location">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: #0284c7; opacity: 0.32; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 18px; height: 18px; margin: 4px; border-radius: 9999px; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    L.marker([userCoords.lat, userCoords.lng], {
      icon: userIcon,
      title: 'Your Current Location',
    }).addTo(layer);
  }, [userCoords]);

  // Render Accessible Route Polyline when activeRoute updates
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    const layer = routeLayerRef.current;
    layer.clearLayers();

    if (!activeRoute || activeRoute.coordinates.length < 2) return;

    L.polyline(activeRoute.coordinates, {
      color: '#0f172a',
      weight: 8,
      opacity: 0.65,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    const routeLine = L.polyline(activeRoute.coordinates, {
      color: '#0ea5e9',
      weight: 4.5,
      opacity: 0.98,
      dashArray: activeRoute.isFallbackArc ? '8, 8' : undefined,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    mapInstanceRef.current.fitBounds(routeLine.getBounds(), {
      padding: [90, 90],
      maxZoom: 16,
    });
  }, [activeRoute]);

  useEffect(() => {
    if (activeRoute && selectedLocation) {
      handlePreviewRoute(selectedLocation, true);
    }
  }, [selectedLocation?.id]);

  // Handle draggable placement pin when adding location
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (isAddingLocation && newPinCoords) {
      const goldIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="
            background: #f59e0b; 
            color: #ffffff; 
            width: 44px; 
            height: 44px; 
            border-radius: 9999px;
            display: flex; 
            align-items: center; 
            justify-content: center; 
            border: 3px solid #ffffff;
            box-shadow: 0 0 0 4px #d97706, 0 8px 16px rgba(0,0,0,0.4);
          ">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });

      if (!newPinMarkerRef.current) {
        const marker = L.marker([newPinCoords.lat, newPinCoords.lng], {
          icon: goldIcon,
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onNewPinCoordsChange({ lat: pos.lat, lng: pos.lng });
          announce(`Pin placed at lat ${pos.lat.toFixed(4)}, lng ${pos.lng.toFixed(4)}`);
        });

        newPinMarkerRef.current = marker;
      } else {
        newPinMarkerRef.current.setLatLng([newPinCoords.lat, newPinCoords.lng]);
      }
    } else {
      if (newPinMarkerRef.current) {
        newPinMarkerRef.current.remove();
        newPinMarkerRef.current = null;
      }
    }
  }, [isAddingLocation, newPinCoords]);

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      handleSimulateCdoLocation();
      return;
    }

    setIsLocating(true);
    announce('Detecting current GPS location...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
          announce('Map centered on your current GPS location.');
        }
      },
      () => {
        setIsLocating(false);
        handleSimulateCdoLocation();
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSimulateCdoLocation = () => {
    setUserCoords(DEFAULT_CDO_CENTER);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([DEFAULT_CDO_CENTER.lat, DEFAULT_CDO_CENTER.lng], 15, {
        duration: 1.0,
      });
    }
    announce('Using Downtown Cagayan de Oro reference GPS location.');
  };

  const handlePreviewRoute = async (targetLoc: LocationPin, forceRefresh = false) => {
    if (activeRoute && !forceRefresh) {
      setActiveRoute(null);
      announce('Cleared route preview.');
      return;
    }

    const origin = userCoords || DEFAULT_CDO_CENTER;
    if (!userCoords) {
      setUserCoords(DEFAULT_CDO_CENTER);
    }

    setIsRoutingLoading(true);
    announce(`Calculating accessible route to ${targetLoc.name}...`);

    const routeResult = await fetchAccessibleRoute(
      origin.lat,
      origin.lng,
      targetLoc.lat,
      targetLoc.lng
    );

    setIsRoutingLoading(false);
    setActiveRoute(routeResult);
    announce(routeResult.summaryText);
  };

  const handleSelectCityPreset = (preset: CityPreset) => {
    setActiveCity(preset);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], preset.zoom, { duration: 0.9 });
      announce(`Viewport moved to ${preset.name}`);
    }
  };

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(MINDANAO_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
      announce('Map recentered to show Mindanao.');
    }
  };

  const handleZoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  const activeCardLocation = selectedLocation;

  const currentFilteredIndex = useMemo(() => {
    if (!activeCardLocation) return 0;
    const idx = locations.findIndex((l) => l.id === activeCardLocation.id);
    return idx >= 0 ? idx : 0;
  }, [activeCardLocation, locations]);

  const handleNavigateRelative = (direction: 'prev' | 'next') => {
    if (locations.length === 0) return;
    const nextIdx =
      direction === 'next'
        ? (currentFilteredIndex + 1) % locations.length
        : (currentFilteredIndex - 1 + locations.length) % locations.length;
    const nextLoc = locations[nextIdx];
    onSelectLocation(nextLoc);
    setShowSummaryCard(true);
    announce(`Viewing ${nextLoc.name} (${nextIdx + 1} of ${locations.length})`);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#e5e5e5] overflow-hidden select-none">
      {/* Interactive Leaflet container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[300px]"
        tabIndex={0}
        aria-label={`Interactive OpenStreetMap and Leaflet map of ${activeCity.name}`}
      />

      {/* Calm, Minimal Top Map Overlay Bar */}
      <div className="absolute top-3 left-3 right-3 sm:top-4 sm:left-4 sm:right-4 z-[500] pointer-events-none flex flex-col xl:flex-row xl:items-start justify-between gap-2.5">
        {/* Top-Left: City Selector & Pin Color Legend */}
        <div className="order-2 xl:order-1 flex items-center justify-between xl:justify-start gap-2 flex-wrap">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-md border border-slate-200/90 flex items-center gap-2.5">
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <select
                  aria-label="Jump to Mindanao city"
                  value={activeCity.id}
                  onChange={(e) => {
                    const preset = MINDANAO_CITY_PRESETS.find((c) => c.id === e.target.value);
                    if (preset) handleSelectCityPreset(preset);
                  }}
                  className="text-xs sm:text-sm font-black tracking-tight text-slate-900 bg-transparent cursor-pointer focus:outline-none pr-1"
                >
                  {MINDANAO_CITY_PRESETS.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {locations.length} places
                </span>
              </div>

              {/* Scannable Pin Color Key */}
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  4★+ Verified
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Partial
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                  Barrier
                </span>
              </div>
            </div>
          </div>

          {/* Mobile/Tablet Quick Controls */}
          <div className="flex xl:hidden items-center gap-1.5 pointer-events-auto">
            {onOpenHowItWorks && (
              <button
                type="button"
                onClick={onOpenHowItWorks}
                className="h-9 px-2.5 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200/90 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                title="How TanAW Works"
              >
                <span>? Guide</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocating}
              className="w-9 h-9 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 cursor-pointer"
              title="Locate me (GPS)"
              aria-label="Locate me using GPS"
            >
              <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-600' : 'text-slate-700'}`} />
            </button>
            <button
              type="button"
              onClick={handleResetCenter}
              className="w-9 h-9 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-xl shadow-md border border-slate-200/90 flex items-center justify-center active:scale-95 cursor-pointer"
              title="Reset to Mindanao Overview"
              aria-label="Reset map view to Mindanao"
            >
              <Crosshair className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>

        {/* Center Search Bar: Shown only when PlacesPanel is closed so there is never a duplicate search bar */}
        <div
          className={`order-1 xl:order-2 w-full xl:flex-1 xl:max-w-xl mx-auto ${
            isPlacesPanelOpen ? 'md:hidden' : ''
          }`}
        >
          <MapSearchFilterBar
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            selectedCategory={selectedCategory}
            onCategoryChange={onCategoryChange}
            onResetFilters={onResetFilters}
            filteredLocations={locations}
            totalLocationsCount={totalLocationsCount}
            onSelectLocationFromSearch={(loc) => {
              onSelectLocation(loc);
              setShowSummaryCard(true);
            }}
            userCoords={userCoords}
          />
        </div>

        {/* Right (Desktop): Minimal Map Controls */}
        <div className="order-3 hidden xl:flex items-center gap-1.5 pointer-events-auto shrink-0">
          {/* Layer Switcher */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerPicker(!showLayerPicker)}
              className={`h-10 px-3 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-2xl shadow-md border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs font-bold ${
                showLayerPicker ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200/90'
              }`}
              title="Switch map style"
              aria-label="Switch map style"
              aria-expanded={showLayerPicker}
            >
              <Layers className="w-4 h-4 text-sky-600" />
              <span>{TILE_CONFIGS[mapStyle].label}</span>
            </button>

            {showLayerPicker && (
              <div className="absolute top-12 right-0 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 z-[600] animate-scale-up">
                {(Object.keys(TILE_CONFIGS) as MapTileStyle[]).map((key) => {
                  const config = TILE_CONFIGS[key];
                  const isActive = mapStyle === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setMapStyle(key);
                        setShowLayerPicker(false);
                        announce(`Map layer changed to ${config.name}`);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-sky-50 text-sky-800 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{config.name}</span>
                      {isActive && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* GPS Locate Me */}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="w-10 h-10 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-2xl shadow-md border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Locate me (GPS)"
            aria-label="Locate me using GPS"
          >
            <Locate className={`w-4 h-4 ${isLocating ? 'animate-spin text-sky-600' : 'text-slate-700'}`} />
          </button>

          {/* Mindanao Center Reset */}
          <button
            type="button"
            onClick={handleResetCenter}
            className="w-10 h-10 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-2xl shadow-md border border-slate-200/90 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Reset to Mindanao Overview"
            aria-label="Reset map view to Mindanao"
          >
            <Crosshair className="w-4 h-4 text-slate-700" />
          </button>

          {/* Zoom controls */}
          <div className="flex items-center bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-slate-200/90 overflow-hidden">
            <button
              type="button"
              onClick={handleZoomIn}
              className="w-10 h-10 hover:bg-slate-50 text-slate-800 flex items-center justify-center border-r border-slate-200/80 transition-colors cursor-pointer"
              title="Zoom in"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="w-10 h-10 hover:bg-slate-50 text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="Zoom out"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4 text-slate-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Adding pin guide banner */}
      {isAddingLocation && (
        <div className="absolute top-36 sm:top-28 left-4 right-4 sm:left-6 sm:right-auto max-w-md z-[500] bg-amber-500 text-amber-950 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-600 flex items-center gap-3 animate-fade-in">
          <MapPin className="w-5 h-5 shrink-0 text-amber-950 animate-bounce" />
          <p className="text-xs sm:text-sm font-bold">
            Tap anywhere on the map or drag the gold marker to place your new pin.
          </p>
        </div>
      )}

      {/* Floating Bottom Details Card */}
      {showSummaryCard && activeCardLocation && !isAddingLocation && (
        <MapFloatingCard
          location={activeCardLocation}
          onOpenDetails={onOpenDetails}
          onClose={() => setShowSummaryCard(false)}
          userCoords={userCoords}
          activeRoute={activeRoute}
          isRoutingLoading={isRoutingLoading}
          onToggleRoutePreview={(loc) => handlePreviewRoute(loc)}
          onNavigateRelative={handleNavigateRelative}
          currentIndex={currentFilteredIndex}
          totalFilteredCount={locations.length}
        />
      )}
    </div>
  );
};
