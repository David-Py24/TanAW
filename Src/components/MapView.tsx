/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { CategoryType, LocationPin } from '../types/accessibility';
import { calculateDistanceKm, getRatingColor } from '../utils/storage';
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
import {
  ACCESSIBILITY_QUICK_FILTERS,
  MapSearchFilterBar,
} from './MapSearchFilterBar';
import {
  Crosshair,
  Locate,
  MapPin,
  ZoomIn,
  ZoomOut,
  Layers,
  Check,
  Radar,
  Navigation,
} from 'lucide-react';

interface MapViewProps {
  locations: LocationPin[];
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  isAddingLocation: boolean;
  newPinCoords: { lat: number; lng: number } | null;
  onNewPinCoordsChange: (coords: { lat: number; lng: number }) => void;
}

export type MapTileStyle = 'osm' | 'positron' | 'dark' | 'hot';

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
    label: 'Standard OSM',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  positron: {
    name: 'Carto Positron (Clean Light)',
    label: 'Minimalist Light',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  dark: {
    name: 'Carto Dark (High Contrast)',
    label: 'Dark Mode',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  hot: {
    name: 'OpenStreetMap Humanitarian',
    label: 'Humanitarian OSM',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by Humanitarian OSM Team',
    maxZoom: 19,
  },
};

// Geographic center of Mindanao, framed to show the full island.
const MINDANAO_CENTER: [number, number] = [7.5, 125.0];
const DEFAULT_ZOOM = 7;

export const MapView: React.FC<MapViewProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  onOpenDetails,
  isAddingLocation,
  newPinCoords,
  onNewPinCoordsChange,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const newPinMarkerRef = useRef<L.Marker | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const { highContrast, announce } = useA11y();
  const [isLocating, setIsLocating] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(true);

  // Viewport & Clustering state
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [activeCity, setActiveCity] = useState<CityPreset>(MINDANAO_CITY_PRESETS[0]);

  // Search, Category, Tag & Proximity Radius Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [activeA11yFilters, setActiveA11yFilters] = useState<string[]>([]);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number | null>(null);
  const [showRadiusPicker, setShowRadiusPicker] = useState(false);

  // Route Preview state
  const [activeRoute, setActiveRoute] = useState<RoutePreviewResult | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Active Map Tile Style state (defaults to standard OpenStreetMap)
  const [mapStyle, setMapStyle] = useState<MapTileStyle>('osm');
  const [showLayerPicker, setShowLayerPicker] = useState(false);

  // Filter locations based on search query, category, accessibility tags, and proximity radius
  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const origin = userCoords || DEFAULT_CDO_CENTER;

    return locations.filter((loc) => {
      if (selectedCategory !== 'All' && loc.category !== selectedCategory) {
        return false;
      }

      if (query) {
        const matchesName = loc.name.toLowerCase().includes(query);
        const matchesAddress = loc.address.toLowerCase().includes(query);
        const matchesCategory = loc.category.toLowerCase().includes(query);
        const matchesTag = loc.tags.some((t) => t.name.toLowerCase().includes(query));
        if (!matchesName && !matchesAddress && !matchesCategory && !matchesTag) {
          return false;
        }
      }

      if (activeA11yFilters.length > 0) {
        for (const filterId of activeA11yFilters) {
          const def = ACCESSIBILITY_QUICK_FILTERS.find((f) => f.id === filterId);
          if (!def) continue;
          if (def.minRating && loc.averageRating < def.minRating) {
            return false;
          }
          if (def.tagKeyword) {
            const hasVerifiedTag = loc.tags.some(
              (t) =>
                t.name.toLowerCase().includes(def.tagKeyword!) &&
                t.confirmations >= t.disputes
            );
            if (!hasVerifiedTag) return false;
          }
        }
      }

      if (nearbyRadiusKm !== null) {
        const dist = calculateDistanceKm(origin.lat, origin.lng, loc.lat, loc.lng);
        if (dist > nearbyRadiusKm) {
          return false;
        }
      }

      return true;
    });
  }, [locations, searchQuery, selectedCategory, activeA11yFilters, nearbyRadiusKm, userCoords]);

  // Initialize Map with OpenStreetMap + Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MINDANAO_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // Custom accessible controls
    });

    mapInstanceRef.current = map;

    // Standard OpenStreetMap Tile Layer
    const activeConfig = highContrast ? TILE_CONFIGS.dark : TILE_CONFIGS[mapStyle];
    const tileLayer = L.tileLayer(activeConfig.url, {
      maxZoom: activeConfig.maxZoom,
      attribution: activeConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = tileLayer;

    // Layer groups
    const routeLayer = L.layerGroup().addTo(map);
    routeLayerRef.current = routeLayer;

    const userLayer = L.layerGroup().addTo(map);
    userLocationLayerRef.current = userLayer;

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    // Track zoom and center changes for dynamic clustering and city header
    const updateViewportState = () => {
      const z = map.getZoom();
      const center = map.getCenter();
      setCurrentZoom(z);
      setActiveCity(detectActiveCityPreset(center.lat, center.lng, z));
    };

    map.on('zoomend', updateViewportState);
    map.on('moveend', updateViewportState);

    // Map click handler for adding location
    map.on('click', (e: L.LeafletMouseEvent) => {
      onNewPinCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapStyle or High Contrast mode toggles
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const activeConfig = highContrast ? TILE_CONFIGS.dark : TILE_CONFIGS[mapStyle];
    const newLayer = L.tileLayer(activeConfig.url, {
      maxZoom: activeConfig.maxZoom,
      attribution: activeConfig.attribution,
    }).addTo(map);

    tileLayerRef.current = newLayer;
  }, [mapStyle, highContrast]);

  // Render Clustered & Category-Aware Location Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    const renderItems = computeMapClusters(
      filteredLocations,
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
  }, [filteredLocations, currentZoom, selectedLocation]);

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

  // Render User GPS Marker & Proximity Radius Ring
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocationLayerRef.current) return;
    const layer = userLocationLayerRef.current;
    layer.clearLayers();

    const origin = userCoords || (nearbyRadiusKm !== null ? DEFAULT_CDO_CENTER : null);
    if (!origin) return;

    if (nearbyRadiusKm !== null) {
      L.circle([origin.lat, origin.lng], {
        radius: nearbyRadiusKm * 1000,
        color: '#0284c7',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#38bdf8',
        fillOpacity: 0.08,
      }).addTo(layer);
    }

    const userIcon = L.divIcon({
      className: 'custom-pin-marker',
      html: `
        <div style="position: relative; width: 26px; height: 26px;" title="${
          userCoords ? 'Your GPS Location' : 'CDO Reference Center'
        }">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: #0284c7; opacity: 0.32; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 18px; height: 18px; margin: 4px; border-radius: 9999px; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    L.marker([origin.lat, origin.lng], {
      icon: userIcon,
      title: userCoords ? 'Your Current Location' : 'Downtown CDO Reference Point',
    }).addTo(layer);
  }, [userCoords, nearbyRadiusKm]);

  // Render Accessible Route Polyline when activeRoute updates
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;
    const layer = routeLayerRef.current;
    layer.clearLayers();

    if (!activeRoute || activeRoute.coordinates.length < 2) return;

    // Outer casing for high contrast visibility across both light and dark tiles
    L.polyline(activeRoute.coordinates, {
      color: '#0f172a',
      weight: 8,
      opacity: 0.65,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    // Inner vibrant route line
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

  // Clear route if selected location changes while route is open
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
            animation: bounce 1s infinite alternate;
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

  // Locate User Action
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

  // Toggle or refresh accessible route preview
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

  const handleToggleA11yFilter = (filterId: string) => {
    setActiveA11yFilters((prev) =>
      prev.includes(filterId) ? prev.filter((id) => id !== filterId) : [...prev, filterId]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setActiveA11yFilters([]);
    setNearbyRadiusKm(null);
    announce('All map filters reset.');
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

  const activeCardLocation =
    selectedLocation || (filteredLocations.length > 0 ? filteredLocations[0] : null);

  const currentFilteredIndex = useMemo(() => {
    if (!activeCardLocation) return 0;
    const idx = filteredLocations.findIndex((l) => l.id === activeCardLocation.id);
    return idx >= 0 ? idx : 0;
  }, [activeCardLocation, filteredLocations]);

  const handleNavigateRelative = (direction: 'prev' | 'next') => {
    if (filteredLocations.length === 0) return;
    const nextIdx =
      direction === 'next'
        ? (currentFilteredIndex + 1) % filteredLocations.length
        : (currentFilteredIndex - 1 + filteredLocations.length) % filteredLocations.length;
    const nextLoc = filteredLocations[nextIdx];
    onSelectLocation(nextLoc);
    setShowSummaryCard(true);
    announce(`Viewing ${nextLoc.name} (${nextIdx + 1} of ${filteredLocations.length})`);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#e5e5e5] overflow-hidden select-none">
      {/* Interactive Leaflet container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[350px]"
        tabIndex={0}
        aria-label={`Interactive OpenStreetMap and Leaflet map of ${activeCity.name}`}
      />

      {/* Prominent Dynamic City Header Watermark & OpenStreetMap + Leaflet service badge */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-6 z-[500] pointer-events-none select-none flex flex-col gap-1.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-sm shadow-lg pointer-events-auto p-1.5">
            <img
              src="/logo-white.png"
              alt="AccessMap Logo"
              className="w-5 h-5 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 drop-shadow-xs leading-none">
              {activeCity.name}
            </h2>
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-600 mt-0.5">
              {activeCity.region} • {filteredLocations.length} Venues
            </p>
          </div>
        </div>

        {/* Free OpenStreetMap + Leaflet Service Tag */}
        <div className="hidden sm:flex items-center gap-1.5 pl-1">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-white/95 text-emerald-800 border border-emerald-300 shadow-xs pointer-events-auto flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>OpenStreetMap + Leaflet</span>
            <span className="text-slate-400 font-normal">| Zoom {currentZoom}</span>
          </span>
        </div>
      </div>

      {/* Floating Interactive Search, Category & Accessibility Filter Bar */}
      <MapSearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        activeA11yFilters={activeA11yFilters}
        onToggleA11yFilter={handleToggleA11yFilter}
        onResetFilters={handleResetFilters}
        filteredLocations={filteredLocations}
        totalLocationsCount={locations.length}
        onSelectLocationFromSearch={(loc) => {
          onSelectLocation(loc);
          setShowSummaryCard(true);
        }}
        activeCityId={activeCity.id}
        onSelectCityPreset={handleSelectCityPreset}
        userCoords={userCoords}
        nearbyRadiusKm={nearbyRadiusKm}
      />

      {/* Floating Map Controls in Top Right */}
      <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-[500] flex items-center gap-2">
        {/* Layer Switcher (OpenStreetMap Standard / Positron / Humanitarian / Dark) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowLayerPicker(!showLayerPicker);
              setShowRadiusPicker(false);
            }}
            className={`h-10 px-3 bg-white/95 backdrop-blur-xs hover:bg-white text-slate-800 rounded-2xl shadow-md border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs font-bold ${
              showLayerPicker ? 'border-sky-500 ring-2 ring-sky-200' : 'border-slate-200/90'
            }`}
            title="Switch OpenStreetMap tile layer"
            aria-label="Switch map layer"
            aria-expanded={showLayerPicker}
          >
            <Layers className="w-4 h-4 text-sky-600" />
            <span className="hidden lg:inline">{TILE_CONFIGS[mapStyle].label}</span>
          </button>

          {/* Layer selection dropdown menu */}
          {showLayerPicker && (
            <div className="absolute top-12 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 z-[600] animate-scale-up">
              <span className="block px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Choose Free Map Service:
              </span>
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
              <div className="pt-2 px-3 pb-1 border-t border-slate-100 text-[11px] text-slate-500">
                All tile layers are 100% open-source, free, and require no API key.
              </div>
            </div>
          )}
        </div>

        {/* Proximity Radar & GPS Simulation Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowRadiusPicker(!showRadiusPicker);
              setShowLayerPicker(false);
            }}
            className={`h-10 px-3 bg-white/95 backdrop-blur-xs hover:bg-white rounded-2xl shadow-md border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer text-xs font-bold ${
              nearbyRadiusKm !== null
                ? 'bg-sky-600 text-white border-sky-700'
                : 'text-slate-800 border-slate-200/90'
            }`}
            title="Proximity Radar & Nearby Filter"
            aria-label="Toggle GPS proximity radius filter"
            aria-expanded={showRadiusPicker}
          >
            <Radar className={`w-4 h-4 ${nearbyRadiusKm !== null ? 'text-white' : 'text-emerald-600'}`} />
            {nearbyRadiusKm !== null && <span>{nearbyRadiusKm}km</span>}
          </button>

          {showRadiusPicker && (
            <div className="absolute top-12 right-0 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 space-y-1.5 z-[600] animate-scale-up">
              <span className="block px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                GPS Proximity Radar Ring
              </span>
              {[null, 1, 3, 5].map((rad) => {
                const isSelected = nearbyRadiusKm === rad;
                return (
                  <button
                    key={String(rad)}
                    type="button"
                    onClick={() => {
                      setNearbyRadiusKm(rad);
                      if (rad !== null && !userCoords) {
                        handleSimulateCdoLocation();
                      }
                      setShowRadiusPicker(false);
                    }}
                    className={`w-full px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-sky-50 text-sky-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{rad === null ? 'Off (Show All Distances)' : `Within ${rad} km Radius`}</span>
                    {isSelected && <Check className="w-4 h-4 text-sky-600" />}
                  </button>
                );
              })}
              <div className="pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleSimulateCdoLocation();
                    setShowRadiusPicker(false);
                  }}
                  className="w-full px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Simulate Downtown CDO GPS</span>
                </button>
              </div>
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
        <div className="hidden sm:flex items-center bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-slate-200/90 overflow-hidden">
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

      {/* Adding pin guide banner */}
      {isAddingLocation && (
        <div className="absolute top-36 sm:top-24 left-6 z-[500] bg-amber-500 text-amber-950 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-600 flex items-center gap-3 animate-fade-in">
          <MapPin className="w-5 h-5 shrink-0 text-amber-950 animate-bounce" />
          <p className="text-xs sm:text-sm font-bold">
            Click anywhere on the map or drag the gold marker to position your new location pin.
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
          totalFilteredCount={filteredLocations.length}
        />
      )}
    </div>
  );
};
