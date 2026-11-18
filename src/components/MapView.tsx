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
  buildGuiCardHtml,
  buildInteractivePinHtml,
  computeMapClusters,
  detectActiveCityPreset,
  fetchAccessibleRoute,
} from '../utils/routingAndSpatial';
import { useA11y } from '../context/A11yContext';
import {
  ACCESSIBILITY_QUICK_FILTERS,
  MapSearchFilterBar,
} from './MapSearchFilterBar';
import { MobileRiftFloraLayout } from './mobile/MobileRiftFloraLayout';
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
  Info,
  X,
  Sparkles,
  Plus,
} from 'lucide-react';

interface MapViewProps {
  locations: LocationPin[];
  selectedLocation: LocationPin | null;
  onSelectLocation: (loc: LocationPin) => void;
  onOpenDetails: (loc: LocationPin) => void;
  isAddingLocation: boolean;
  newPinCoords: { lat: number; lng: number } | null;
  onNewPinCoordsChange: (coords: { lat: number; lng: number }) => void;
  onQuickAddPin?: (pin: {
    lat: number;
    lng: number;
    name: string;
    category?: CategoryType;
    tags?: string[];
    description?: string;
  }) => void;
  onTogglePinLocation?: (pinId: string) => void;
  onRunAIScan?: (loc: LocationPin | null) => void;
  onNavigateTab?: (tabId: string) => void;
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
  onQuickAddPin,
  onTogglePinLocation,
  onRunAIScan,
  onNavigateTab,
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

  // Context Menu & Adjacent Side Panel State
  const [contextMenu, setContextMenu] = useState<{
    lat: number;
    lng: number;
    x: number;
    y: number;
    location: LocationPin | null;
    activeSidePanel: 'pin' | 'details' | null;
  } | null>(null);

  // Form states for Pin placeholder form
  const [pinFormName, setPinFormName] = useState('');
  const [pinFormCategory, setPinFormCategory] = useState<CategoryType>('Shopping');
  const [pinFormTags, setPinFormTags] = useState<string[]>([
    'Wheelchair-accessible entrance',
    'Ramp available',
  ]);
  const [pinFormNotes, setPinFormNotes] = useState('');

  // Form states for Details placeholder form
  const [detailsFormTitle, setDetailsFormTitle] = useState('');
  const [detailsFormArea, setDetailsFormArea] = useState('');
  const [detailsFormDoorWidth, setDetailsFormDoorWidth] = useState('95 cm');
  const [detailsFormStepFree, setDetailsFormStepFree] = useState(true);
  const [detailsFormAuditor, setDetailsFormAuditor] = useState('');
  const [detailsFormSensory, setDetailsFormSensory] = useState('Quiet / low-sensory zone');

  // Helper to open context menu and initialize placeholder forms
  const openContextMenu = (
    lat: number,
    lng: number,
    x: number,
    y: number,
    loc: LocationPin | null
  ) => {
    setContextMenu({
      lat,
      lng,
      x,
      y,
      location: loc,
      activeSidePanel: null,
    });
    setPinFormName(loc ? loc.name : '');
    setPinFormCategory(loc ? loc.category : 'Shopping');
    setPinFormNotes(loc?.description || '');
    setDetailsFormTitle(loc ? loc.name : `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    setDetailsFormArea(loc ? loc.address : 'Downtown District, Northern Mindanao');
  };

  // Close context menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Global window handler for direct pinning from hover GUI cards
  useEffect(() => {
    (window as unknown as { accessMapTogglePin?: (id: string, e?: Event) => void }).accessMapTogglePin = (
      id: string,
      e?: Event
    ) => {
      e?.stopPropagation();
      e?.preventDefault();
      if (onTogglePinLocation) {
        onTogglePinLocation(id);
      }
    };
    return () => {
      delete (window as unknown as { accessMapTogglePin?: unknown }).accessMapTogglePin;
    };
  }, [onTogglePinLocation]);

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

    // Right-click context menu handler on the map canvas
    map.on('contextmenu', (e: L.LeafletMouseEvent) => {
      e.originalEvent.preventDefault();
      const pt = map.latLngToContainerPoint(e.latlng);
      openContextMenu(e.latlng.lat, e.latlng.lng, pt.x, pt.y, null);
      announce(`Map context menu opened at ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}.`);
    });

    // Map click handler for adding location and dismissing context menu
    map.on('click', (e: L.LeafletMouseEvent) => {
      setContextMenu(null);
      onNewPinCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('movestart', () => {
      setContextMenu(null);
    });

    // Invalidate map size when container dimensions change (e.g. sidebar collapse/expand)
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
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
          buildGuiCardHtml(loc),
          {
            direction: 'right',
            offset: [16, -10],
            opacity: 1,
            className: 'gui-card',
            interactive: true,
          }
        );

        // Turn pin green on hover, restore to dark on mouseout (unless selected)
        marker.on('mouseover', () => {
          const el = marker.getElement();
          const img = el?.querySelector('.accessmap-pin-img') as HTMLImageElement | null;
          if (img) img.src = '/logo-green.png';
        });

        marker.on('mouseout', () => {
          const el = marker.getElement();
          const img = el?.querySelector('.accessmap-pin-img') as HTMLImageElement | null;
          if (img && selectedLocation?.id !== loc.id) {
            img.src = '/logo-dark.png';
          }
        });

        marker.on('click', () => {
          onSelectLocation(loc);
          announce(
            `Selected location: ${loc.name}, rated ${ratingText} stars, pinned by ${
              loc.pinCount ?? 1
            } users.`
          );
        });

        marker.on('contextmenu', (e: L.LeafletMouseEvent) => {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
          const pt = map.latLngToContainerPoint(e.latlng);
          openContextMenu(loc.lat, loc.lng, pt.x, pt.y, loc);
          announce(`Context menu opened for ${loc.name}.`);
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
        <div style="position: relative; width: 28px; height: 28px;" title="${
          userCoords ? 'Your GPS Location' : 'CDO Reference Center'
        }">
          <div style="position: absolute; width: 100%; height: 100%; border-radius: 9999px; background: #B8F500; opacity: 0.45; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 18px; height: 18px; margin: 5px; border-radius: 9999px; background: #B8F500; border: 3px solid #0F172A; box-shadow: 0 0 12px rgba(184,245,0,0.85);"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
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
      opacity: 0.75,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(layer);

    // Inner vibrant route line (Neon Lime green navigation trail matching Rift Flora)
    const routeLine = L.polyline(activeRoute.coordinates, {
      color: '#B8F500',
      weight: 4.5,
      opacity: 0.98,
      dashArray: activeRoute.isFallbackArc ? '8, 8' : '4, 8',
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

  return (
    <div className="relative w-full h-full flex flex-col bg-[#e5e5e5] overflow-hidden select-none">
      {/* Interactive Leaflet container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[350px]"
        tabIndex={0}
        aria-label="Interactive OpenStreetMap and Leaflet map"
      />

      {/* Floating Interactive Search, Category & Accessibility Filter Bar - Desktop Only */}
      <div className="hidden md:block">
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
          }}
          activeCityId={activeCity.id}
          onSelectCityPreset={handleSelectCityPreset}
          userCoords={userCoords}
          nearbyRadiusKm={nearbyRadiusKm}
        />
      </div>

      {/* Floating Map Controls Relocated to Bottom Right - Desktop Only */}
      <div className="hidden md:flex absolute bottom-6 right-6 z-[500] items-center flex-wrap-reverse justify-end gap-2 pointer-events-auto">
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

          {/* Layer selection dropdown menu - Opens Upward */}
          {showLayerPicker && (
            <div className="absolute bottom-12 right-0 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 space-y-1 z-[600] animate-scale-up">
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

        {/* Proximity Radar & GPS Simulation Picker - Opens Upward */}
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
            <div className="absolute bottom-12 right-0 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 space-y-1.5 z-[600] animate-scale-up">
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

      {/* Mobile Rift Flora Layout & HUD - Exclusive to Mobile (< md) */}
      <MobileRiftFloraLayout
        locations={locations}
        filteredLocations={filteredLocations}
        selectedLocation={selectedLocation}
        onSelectLocation={(loc) => {
          if (loc) {
            onSelectLocation(loc);
          }
        }}
        onOpenDetails={onOpenDetails}
        onRunAIScan={onRunAIScan || (() => {})}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
        onResetCenter={handleResetCenter}
        mapStyle={mapStyle}
        onSelectMapStyle={(style) => {
          setMapStyle(style);
          announce(`Map layer changed to ${TILE_CONFIGS[style].name}`);
        }}
        userCoords={userCoords}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        onNavigateTab={onNavigateTab || (() => {})}
        onTogglePin={onTogglePinLocation}
      />

      {/* Adding pin guide banner */}
      {isAddingLocation && (
        <div className="absolute top-36 sm:top-24 left-6 z-[500] bg-amber-500 text-amber-950 px-4 py-2.5 rounded-2xl shadow-xl border border-amber-600 flex items-center gap-3 animate-fade-in">
          <MapPin className="w-5 h-5 shrink-0 text-amber-950 animate-bounce" />
          <p className="text-xs sm:text-sm font-bold">
            Click anywhere on the map or drag the gold marker to position your new location pin.
          </p>
        </div>
      )}

      {/* Context Menu & Side Panel Overlay */}
      {contextMenu && (
        <>
          {/* Transparent Backdrop to dismiss on outside click */}
          <div
            className="absolute inset-0 z-[580]"
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />

          {/* Context Menu Popup */}
          <div
            className="absolute z-[590] bg-white border-[1.8px] border-[#0F172A] rounded-[16px] shadow-[4px_4px_0px_#0F172A,0_20px_35px_-4px_rgba(15,23,42,0.25)] p-2.5 w-[225px] animate-scale-up font-space select-none"
            style={{
              left: Math.max(
                12,
                Math.min(
                  contextMenu.x,
                  (mapContainerRef.current?.clientWidth || 800) - 240
                )
              ),
              top: Math.max(
                12,
                Math.min(
                  contextMenu.y,
                  (mapContainerRef.current?.clientHeight || 600) - 170
                )
              ),
            }}
            role="menu"
            aria-label="Map location context menu"
          >
            {/* Header info */}
            <div className="px-1.5 py-1 border-b-[1.5px] border-dashed border-[#9DBBC7] mb-2 flex items-center justify-between gap-1.5">
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#586E7D]">
                  {contextMenu.location ? 'Venue Point' : 'Map Coordinate'}
                </div>
                <div className="text-xs font-mono font-bold text-[#0F172A] truncate">
                  {contextMenu.location
                    ? contextMenu.location.name
                    : `${contextMenu.lat.toFixed(4)}, ${contextMenu.lng.toFixed(4)}`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContextMenu(null)}
                className="w-6 h-6 rounded-full border-[1.5px] border-[#0F172A] bg-white hover:bg-[#EAF3F7] text-[#0F172A] flex items-center justify-center text-xs font-bold shadow-[0_1.5px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* Option 1: Pin */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setContextMenu((prev) =>
                  prev ? { ...prev, activeSidePanel: 'pin' } : null
                );
                announce('Opened Pin placeholder form side panel.');
              }}
              className={`w-full px-2.5 py-2 rounded-[12px] border-[1.8px] text-left text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                contextMenu.activeSidePanel === 'pin'
                  ? 'bg-[#21524B] text-white border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                  : 'bg-white text-[#0F172A] border-transparent hover:border-[#0F172A] hover:bg-[#EAF3F7] hover:shadow-[0_2px_0_#0F172A] font-semibold'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-[8px] border-[1.2px] border-[#0F172A] flex items-center justify-center shrink-0 shadow-[0_1px_0_#0F172A] ${
                  contextMenu.activeSidePanel === 'pin'
                    ? 'bg-[#13332E] text-white'
                    : 'bg-[#E7F2F0] text-[#21524B]'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="leading-tight font-bold">Pin</div>
                <div
                  className={`text-[10px] font-medium truncate ${
                    contextMenu.activeSidePanel === 'pin'
                      ? 'text-[#E7F2F0]'
                      : 'text-[#586E7D]'
                  }`}
                >
                  Placeholder form to pin
                </div>
              </div>
            </button>

            {/* Option 2: Details */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setContextMenu((prev) =>
                  prev ? { ...prev, activeSidePanel: 'details' } : null
                );
                announce('Opened Details placeholder form side panel.');
              }}
              className={`w-full px-2.5 py-2 rounded-[12px] border-[1.8px] text-left text-xs flex items-center gap-2.5 transition-all cursor-pointer mt-1.5 ${
                contextMenu.activeSidePanel === 'details'
                  ? 'bg-[#21524B] text-white border-[#0F172A] shadow-[0_2px_0_#0F172A] font-bold'
                  : 'bg-white text-[#0F172A] border-transparent hover:border-[#0F172A] hover:bg-[#EAF3F7] hover:shadow-[0_2px_0_#0F172A] font-semibold'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-[8px] border-[1.2px] border-[#0F172A] flex items-center justify-center shrink-0 shadow-[0_1px_0_#0F172A] ${
                  contextMenu.activeSidePanel === 'details'
                    ? 'bg-[#13332E] text-white'
                    : 'bg-[#E7F2F0] text-[#21524B]'
                }`}
              >
                <Info className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="leading-tight font-bold">Details</div>
                <div
                  className={`text-[10px] font-medium truncate ${
                    contextMenu.activeSidePanel === 'details'
                      ? 'text-[#E7F2F0]'
                      : 'text-[#586E7D]'
                  }`}
                >
                  Placeholder form details
                </div>
              </div>
            </button>
          </div>

          {/* Adjacent Side Panel for Placeholder Forms */}
          {contextMenu.activeSidePanel && (
            <aside
              className="absolute z-[600] bg-white border-[1.8px] border-[#0F172A] rounded-[20px] shadow-[5px_5px_0px_#0F172A,0_24px_45px_-6px_rgba(15,23,42,0.3)] p-4 sm:p-5 w-[340px] max-w-[92vw] animate-scale-up font-space overflow-hidden flex flex-col max-h-[85vh]"
              style={{
                left: (() => {
                  const cWidth = mapContainerRef.current?.clientWidth || 800;
                  const menuW = 225;
                  const panelW = 340;
                  const spaceOnRight = cWidth - (contextMenu.x + menuW + 16);
                  return spaceOnRight >= panelW
                    ? contextMenu.x + menuW + 12
                    : Math.max(12, contextMenu.x - panelW - 12);
                })(),
                top: Math.max(
                  12,
                  Math.min(
                    contextMenu.y,
                    (mapContainerRef.current?.clientHeight || 600) - 520
                  )
                ),
              }}
              role="dialog"
              aria-modal="true"
              aria-label={
                contextMenu.activeSidePanel === 'pin'
                  ? 'Pin Location Placeholder Form'
                  : 'Location Details Placeholder Form'
              }
            >
              {/* Side Panel Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b-[1.5px] border-dashed border-[#9DBBC7] shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#0F172A] tracking-tight">
                      {contextMenu.activeSidePanel === 'pin'
                        ? '📍 Pin Location'
                        : 'ℹ️ Place Details'}
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider bg-[#E7F2F0] text-[#21524B] px-2.5 py-0.5 rounded-full border border-[rgba(33,82,75,0.4)]">
                      Placeholder Form
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-[#586E7D] mt-0.5 font-bold">
                    GPS: {contextMenu.lat.toFixed(4)}, {contextMenu.lng.toFixed(4)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setContextMenu((prev) =>
                      prev ? { ...prev, activeSidePanel: null } : null
                    )
                  }
                  className="w-7 h-7 rounded-full border-[1.5px] border-[#0F172A] bg-white hover:bg-[#EAF3F7] text-[#0F172A] flex items-center justify-center text-sm font-bold shadow-[0_2px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shrink-0"
                  aria-label="Close side panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Side Panel Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-0.5">
                {contextMenu.activeSidePanel === 'pin' ? (
                  /* ======================================================== */
                  /* PLACEHOLDER FORM FOR PINNING                             */
                  /* ======================================================== */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (contextMenu.location) {
                        onTogglePinLocation?.(contextMenu.location.id);
                        announce(`Toggled pin for ${contextMenu.location.name}.`);
                      } else {
                        onQuickAddPin?.({
                          lat: contextMenu.lat,
                          lng: contextMenu.lng,
                          name: pinFormName.trim() || 'Pinned Coordinate',
                          category: pinFormCategory,
                          tags: pinFormTags,
                          description: pinFormNotes,
                        });
                      }
                      setContextMenu(null);
                    }}
                    className="space-y-3"
                  >
                    {/* Place Name Field */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1">
                        Place Name
                      </label>
                      <input
                        type="text"
                        value={pinFormName}
                        onChange={(e) => setPinFormName(e.target.value)}
                        placeholder="e.g., Xavier Gate 2, Corrales Ave..."
                        className="w-full px-3 py-2 text-xs rounded-[12px] border-[1.8px] border-[#0F172A] bg-white text-[#0F172A] font-medium placeholder:text-[#586E7D] shadow-[0_2px_0_#0F172A] focus:outline-none focus:ring-2 focus:ring-[#21524B]"
                      />
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1">
                        Category
                      </label>
                      <select
                        value={pinFormCategory}
                        onChange={(e) => setPinFormCategory(e.target.value as CategoryType)}
                        className="w-full px-3 py-2 text-xs rounded-[12px] border-[1.8px] border-[#0F172A] bg-white font-bold text-[#0F172A] shadow-[0_2px_0_#0F172A] focus:outline-none focus:ring-2 focus:ring-[#21524B]"
                      >
                        <option value="Shopping">Shopping</option>
                        <option value="Dining & Cafe">Dining & Cafe</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Public Space">Public Space</option>
                        <option value="Hotel & Lodging">Hotel & Lodging</option>
                        <option value="Service">Service</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {/* Pin Count Indicator */}
                    <div className="bg-[#E7F2F0] border-[1.8px] border-[#0F172A] rounded-[14px] p-2.5 shadow-[0_2px_0_#0F172A] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-white border border-[#0F172A] flex items-center justify-center text-xs shrink-0 shadow-[0_1px_0_#0F172A]">
                          📌
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#0F172A]">
                            {contextMenu.location
                              ? `${contextMenu.location.pinCount ?? 1} users pinning this place`
                              : '1 user pinning (You)'}
                          </div>
                          <div className="text-[10px] text-[#21524B] font-medium">
                            Current active community pin count
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-[#21524B] text-white px-2.5 py-0.5 rounded-full border-[1.2px] border-[#0F172A] shadow-[0_1px_0_#0F172A]">
                        {contextMenu.location ? contextMenu.location.pinCount ?? 1 : 1}
                      </span>
                    </div>

                    {/* Accessibility Features Checklist */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                        Accessibility Features (Quick Tag)
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[
                          'Wheelchair-accessible entrance',
                          'Ramp available',
                          'Accessible restroom',
                          'Elevator access',
                        ].map((tag) => {
                          const checked = pinFormTags.includes(tag);
                          return (
                            <label
                              key={tag}
                              className={`flex items-center gap-2.5 px-3 py-2 rounded-[10px] border-[1.8px] text-xs font-medium cursor-pointer transition-all shadow-[0_1.5px_0_#0F172A] ${
                                checked
                                  ? 'bg-[#E7F2F0] border-[#0F172A] text-[#21524B] font-bold'
                                  : 'bg-white border-[#D5E5EC] text-[#475569] hover:border-[#0F172A] hover:bg-[#EAF3F7]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setPinFormTags((prev) => [...prev, tag]);
                                  } else {
                                    setPinFormTags((prev) => prev.filter((t) => t !== tag));
                                  }
                                }}
                                className="w-4 h-4 rounded border-[1.5px] border-[#0F172A] accent-[#21524B] cursor-pointer"
                              />
                              <span>{tag}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes Textarea */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1">
                        Notes / Accessibility Observations
                      </label>
                      <textarea
                        rows={2}
                        value={pinFormNotes}
                        onChange={(e) => setPinFormNotes(e.target.value)}
                        placeholder="Add notes about slope, entrance obstacles, or pavement condition..."
                        className="w-full px-3 py-2 text-xs rounded-[12px] border-[1.8px] border-[#0F172A] bg-white text-[#0F172A] font-medium placeholder:text-[#586E7D] shadow-[0_2px_0_#0F172A] focus:outline-none focus:ring-2 focus:ring-[#21524B] resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setContextMenu(null)}
                        className="px-4 py-1.5 rounded-full border-[1.8px] border-[#0F172A] bg-white text-[#0F172A] hover:bg-[#EAF3F7] text-xs font-bold shadow-[0_2px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 rounded-full border-[1.8px] border-[#0F172A] bg-[#21524B] hover:bg-[#2B6860] text-white text-xs font-bold shadow-[0_3px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Save Pin</span>
                      </button>
                    </div>
                  </form>
                ) : (
                  /* ======================================================== */
                  /* PLACEHOLDER FORM FOR DETAILS                             */
                  /* ======================================================== */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      announce(`Recorded place details for ${detailsFormTitle || 'location'}.`);
                      setContextMenu(null);
                    }}
                    className="space-y-3"
                  >
                    {/* Place Reference Field */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1">
                        Place / Venue Reference
                      </label>
                      <input
                        type="text"
                        value={detailsFormTitle}
                        onChange={(e) => setDetailsFormTitle(e.target.value)}
                        placeholder="e.g. Centrio Mall North Entrance..."
                        className="w-full px-3 py-2 text-xs rounded-[12px] border-[1.8px] border-[#0F172A] bg-white text-[#0F172A] font-medium placeholder:text-[#586E7D] shadow-[0_2px_0_#0F172A] focus:outline-none focus:ring-2 focus:ring-[#21524B]"
                      />
                    </div>

                    {/* District / Address */}
                    <div>
                      <label className="block text-xs font-bold text-[#0F172A] mb-1">
                        District / Area
                      </label>
                      <input
                        type="text"
                        value={detailsFormArea}
                        onChange={(e) => setDetailsFormArea(e.target.value)}
                        placeholder="e.g. Downtown CDO, Northern Mindanao..."
                        className="w-full px-3 py-2 text-xs rounded-[12px] border-[1.8px] border-[#0F172A] bg-white text-[#0F172A] font-medium placeholder:text-[#586E7D] shadow-[0_2px_0_#0F172A] focus:outline-none focus:ring-2 focus:ring-[#21524B]"
                      />
                    </div>

                    {/* Pin Count Indicator */}
                    <div className="bg-[#E7F2F0] border-[1.8px] border-[#0F172A] rounded-[14px] p-2.5 shadow-[0_2px_0_#0F172A] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-white border border-[#0F172A] flex items-center justify-center text-xs shrink-0 shadow-[0_1px_0_#0F172A]">
                          📌
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#0F172A]">
                            {contextMenu.location
                              ? `${contextMenu.location.pinCount ?? 1} users pinning this place`
                              : '0 users currently pinning this point'}
                          </div>
                          <div className="text-[10px] text-[#21524B] font-medium">
                            Live mapper activity tracking
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-bold bg-[#21524B] text-white px-2.5 py-0.5 rounded-full border-[1.2px] border-[#0F172A] shadow-[0_1px_0_#0F172A]">
                        {contextMenu.location ? contextMenu.location.pinCount ?? 1 : 0}
                      </span>
                    </div>

                    {/* Inspection Fields */}
                    <div className="space-y-2 pt-1 border-t-[1.5px] border-dashed border-[#9DBBC7]">
                      <label className="block text-xs font-bold text-[#0F172A]">
                        Physical Accessibility Inspection Form
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="block text-[10px] font-bold text-[#586E7D] mb-1">
                            Door Width
                          </span>
                          <input
                            type="text"
                            value={detailsFormDoorWidth}
                            onChange={(e) => setDetailsFormDoorWidth(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-[10px] border-[1.8px] border-[#0F172A] bg-white font-medium text-[#0F172A] shadow-[0_1.5px_0_#0F172A]"
                            placeholder="e.g. 90 cm"
                          />
                        </div>
                        <div>
                          <span className="block text-[10px] font-bold text-[#586E7D] mb-1">
                            Auditor ID
                          </span>
                          <input
                            type="text"
                            value={detailsFormAuditor}
                            onChange={(e) => setDetailsFormAuditor(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs rounded-[10px] border-[1.8px] border-[#0F172A] bg-white font-medium text-[#0F172A] shadow-[0_1.5px_0_#0F172A]"
                            placeholder="Volunteer Mapper"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <label className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] border-[1.8px] border-[#0F172A] bg-[#E7F2F0] text-xs font-bold text-[#21524B] shadow-[0_1.5px_0_#0F172A] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={detailsFormStepFree}
                            onChange={(e) => setDetailsFormStepFree(e.target.checked)}
                            className="w-4 h-4 rounded border-[1.5px] border-[#0F172A] accent-[#21524B] cursor-pointer"
                          />
                          <span>Step-free ground clearance verified</span>
                        </label>
                      </div>

                      <div>
                        <span className="block text-[10px] font-bold text-[#586E7D] mb-1">
                          Sensory Rating Category
                        </span>
                        <select
                          value={detailsFormSensory}
                          onChange={(e) => setDetailsFormSensory(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs rounded-[10px] border-[1.8px] border-[#0F172A] bg-white font-bold text-[#0F172A] shadow-[0_1.5px_0_#0F172A]"
                        >
                          <option value="Quiet / low-sensory zone">Quiet / low-sensory zone</option>
                          <option value="Moderate noise / accessible lighting">Moderate noise / accessible lighting</option>
                          <option value="High sensory / loud commercial">High sensory / loud commercial</option>
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setContextMenu(null)}
                        className="px-4 py-1.5 rounded-full border-[1.8px] border-[#0F172A] bg-white text-[#0F172A] hover:bg-[#EAF3F7] text-xs font-bold shadow-[0_2px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-1.5 rounded-full border-[1.8px] border-[#0F172A] bg-[#21524B] hover:bg-[#2B6860] text-white text-xs font-bold shadow-[0_3px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Submit Details</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </aside>
          )}
        </>
      )}
    </div>
  );
};
