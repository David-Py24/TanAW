/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { A11yProvider, useA11y } from './context/A11yContext';
import { LoginPage } from './components/LoginPage';
import { SidebarRail } from './components/SidebarRail';
import { PlacesPanel } from './components/PlacesPanel';
import { MapView } from './components/MapView';
import { LocationDetailDrawer } from './components/LocationDetailDrawer';
import { AddLocationModal } from './components/AddLocationModal';
import { AIStorefrontModal } from './components/AIStorefrontModal';
import {
  LocationPin,
  CategoryType,
  Review,
  StorefrontAnalysisResult,
  LocationTag,
} from './types/accessibility';
import {
  loadLocations,
  saveLocations,
  clearAllLocations,
  getStoredUserVotes,
  saveStoredUserVote,
  calculateDistanceKm,
} from './utils/storage';
import {
  CityPreset,
  MINDANAO_CITY_PRESETS,
  ACCESSIBILITY_QUICK_FILTERS,
  RoutePreviewResult,
  fetchAccessibleRoute,
} from './utils/routingAndSpatial';
import { calculateGoogleWalkingRoute } from './utils/googleMapsLoader';
import { AuthSession, clearSession, loadSession } from './utils/auth';
import { ArrowLeft, ExternalLink } from 'lucide-react';

// Prototype pages run as standalone HTML, so pass the Google Maps key to them
// through the URL instead of relying on Vite's import.meta.env injection.
const withGoogleMapsKey = (url: string) => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!key) return url;
  return `${url}${url.includes('?') ? '&' : '?'}googleMapsKey=${encodeURIComponent(key)}`;
};

const PROTOTYPE_ROUTES: Record<string, { title: string; subtitle: string; url: string }> = {
  profile: {
    title: 'Profile & Account Settings',
    subtitle: 'Manage your profile, verified accessibility contributions, and badges',
    url: '/prototypes/profile-account/index.html',
  },
  community: {
    title: 'Community Leaderboard',
    subtitle: 'Top urban accessibility contributors and community consensus verifiers',
    url: '/prototypes/leaderboard/index.html',
  },
  messages: {
    title: 'Messages & Outreach',
    subtitle: 'Direct conversations with local accessibility mappers and community verifiers',
    url: '/prototypes/messages/index.html',
  },
  saved: {
    title: 'Saved Places',
    subtitle: 'Bookmarked accessible venues, ramps, and personal collections',
    url: '/prototypes/saved-places/index.html',
  },
  contributions: {
    title: 'Contribution History',
    subtitle: 'Your crowdsourced photo uploads, reviews, and community votes',
    url: '/prototypes/contributions/index.html',
  },
  settings: {
    title: 'Profile Settings',
    subtitle: 'Accessibility preferences and display configurations',
    url: '/prototypes/profile-settings/index.html',
  },
  landing: {
    title: 'AccessMap Public Portal',
    subtitle: 'Urban accessibility showcase and mission overview',
    url: '/prototypes/landing/index.html',
  },
  signin: {
    title: 'Contributor Sign In',
    subtitle: 'Authentication and account access portal',
    url: '/prototypes/sign-in/index.html',
  },
};

interface AccessMapWorkspaceProps {
  session: AuthSession;
  onSignOut: () => void;
}

function AccessMapWorkspace({ session, onSignOut }: AccessMapWorkspaceProps) {
  const { announce } = useA11y();

  // Core locations state
  const [locations, setLocations] = useState<LocationPin[]>(() => {
    const loaded = loadLocations();
    const storedVotes = getStoredUserVotes();
    return loaded.map((loc) => ({
      ...loc,
      tags: loc.tags.map((tag) => {
        const key = `${loc.id}__${tag.name}`;
        return {
          ...tag,
          userVoted: storedVotes[key] || undefined,
        };
      }),
    }));
  });

  // Active City Preset (defaults to Cagayan de Oro)
  const [activeCity, setActiveCity] = useState<CityPreset>(MINDANAO_CITY_PRESETS[1]);

  // Selected Location
  const [selectedLocation, setSelectedLocation] = useState<LocationPin | null>(() => {
    return locations.length > 0 ? locations[0] : null;
  });

  // Detail Drawer Visibility
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Active navigation tab
  const [activeNavTab, setActiveNavTab] = useState<string>('map');

  // Mobile / Filter panel toggle. Phones start on the map, larger screens on the list.
  const [isPlacesPanelOpen, setIsPlacesPanelOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.matchMedia('(min-width: 768px)').matches;
  });

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [activeA11yFilters, setActiveA11yFilters] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyRadiusKm, setNearbyRadiusKm] = useState<number | null>(null);
  const [aiMatchedIds, setAiMatchedIds] = useState<string[]>([]);

  // Route Preview state
  const [activeRoute, setActiveRoute] = useState<RoutePreviewResult | null>(null);
  const [isRoutingLoading, setIsRoutingLoading] = useState(false);

  // Add Location Flow State
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // AI Storefront Analyzer State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiTargetLocation, setAiTargetLocation] = useState<LocationPin | null>(null);

  // Pre-filled data for new pin from AI Analyzer
  const [aiNewPinData, setAiNewPinData] = useState<{
    tags: string[];
    photoUrl?: string;
    summary?: string;
    barriers?: string[];
  } | null>(null);

  // Helper to persist updates
  const updateAndSaveLocations = (updater: (prev: LocationPin[]) => LocationPin[]) => {
    setLocations((prev) => {
      const next = updater(prev);
      saveLocations(next);
      return next;
    });
  };

  // Sync selectedLocation if it was updated in locations array
  useEffect(() => {
    if (selectedLocation) {
      const fresh = locations.find((l) => l.id === selectedLocation.id);
      if (fresh) setSelectedLocation(fresh);
    }
  }, [locations]);

  // Toggle Route Preview
  const handleToggleRoute = async (loc: LocationPin) => {
    if (activeRoute && selectedLocation?.id === loc.id) {
      setActiveRoute(null);
      announce('Route preview cleared.');
      return;
    }

    const origin = userCoords || { lat: activeCity.lat, lng: activeCity.lng };
    setIsRoutingLoading(true);
    announce(`Calculating accessible Google route to ${loc.name}...`);
    try {
      const result = await calculateGoogleWalkingRoute(origin, { lat: loc.lat, lng: loc.lng });
      setActiveRoute(result);
      setSelectedLocation(loc);
      announce(
        `Google walking route ready: ${result.distanceKm} km, ~${result.durationMinutes} min mobility transit.`
      );
    } catch {
      const fallback = await fetchAccessibleRoute(origin.lat, origin.lng, loc.lat, loc.lng);
      setActiveRoute(fallback);
      setSelectedLocation(loc);
      announce(`Accessible route ready: ${fallback.distanceKm} km, ~${fallback.durationMinutes} min est.`);
    } finally {
      setIsRoutingLoading(false);
    }
  };

  // Community Voting (Confirm / Dispute)
  const handleVoteTag = (pinId: string, tagName: string, vote: 'confirm' | 'dispute') => {
    updateAndSaveLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== pinId) return loc;
        return {
          ...loc,
          tags: loc.tags.map((tag) => {
            if (tag.name !== tagName) return tag;

            let conf = tag.confirmations;
            let disp = tag.disputes;
            const prevVote = tag.userVoted;

            if (prevVote === vote) {
              if (vote === 'confirm') conf = Math.max(0, conf - 1);
              if (vote === 'dispute') disp = Math.max(0, disp - 1);
              saveStoredUserVote(pinId, tagName, null);
              return { ...tag, confirmations: conf, disputes: disp, userVoted: undefined };
            }

            if (prevVote === 'confirm') conf = Math.max(0, conf - 1);
            if (prevVote === 'dispute') disp = Math.max(0, disp - 1);

            if (vote === 'confirm') conf += 1;
            if (vote === 'dispute') disp += 1;

            saveStoredUserVote(pinId, tagName, vote);
            return { ...tag, confirmations: conf, disputes: disp, userVoted: vote };
          }),
        };
      })
    );
  };

  // Add Review
  const handleAddReview = (pinId: string, reviewInput: Omit<Review, 'id' | 'date'>) => {
    const newReview: Review = {
      ...reviewInput,
      id: `rev-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };

    updateAndSaveLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== pinId) return loc;

        const updatedReviews = [newReview, ...loc.reviews];
        const newTotalReviews = loc.totalReviews + 1;
        const totalRatingSum =
          loc.averageRating * loc.totalReviews + reviewInput.rating;
        const newAvg = Math.round((totalRatingSum / newTotalReviews) * 10) / 10;

        const updatedTags = loc.tags.map((tag) => {
          if (reviewInput.tagRatings && reviewInput.tagRatings[tag.name]) {
            const given = reviewInput.tagRatings[tag.name];
            const prevCount = tag.ratingCount || 1;
            const updatedTagAvg =
              Math.round(((tag.rating * prevCount + given) / (prevCount + 1)) * 10) / 10;
            return {
              ...tag,
              rating: updatedTagAvg,
              ratingCount: prevCount + 1,
            };
          }
          return tag;
        });

        return {
          ...loc,
          totalReviews: newTotalReviews,
          averageRating: newAvg,
          reviews: updatedReviews,
          tags: updatedTags,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Apply AI Storefront tags to an existing location
  const handleApplyTagsToLocation = (
    locationId: string,
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult
  ) => {
    updateAndSaveLocations((prev) =>
      prev.map((loc) => {
        if (loc.id !== locationId) return loc;

        const existingTagNames = new Set(loc.tags.map((t) => t.name));
        const newTags: LocationTag[] = acceptedTags
          .filter((tName) => !existingTagNames.has(tName))
          .map((tName) => ({
            name: tName,
            rating: 4.5,
            ratingCount: 1,
            confirmations: 1,
            disputes: 0,
            isAiSuggested: true,
          }));

        const updatedPhotos =
          analysis.imagePreviewUrl && !loc.photos.includes(analysis.imagePreviewUrl)
            ? [analysis.imagePreviewUrl, ...loc.photos]
            : loc.photos;

        return {
          ...loc,
          tags: [...loc.tags, ...newTags],
          photos: updatedPhotos,
          aiSummary: analysis.summary,
          aiBarriers: analysis.possible_barriers,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Start new location pin flow pre-populated with AI scan findings
  const handleStartNewPinFromAnalysis = (
    acceptedTags: string[],
    analysis: StorefrontAnalysisResult,
    photoDataUrl: string
  ) => {
    setAiNewPinData({
      tags: acceptedTags,
      photoUrl: photoDataUrl,
      summary: analysis.summary,
      barriers: analysis.possible_barriers,
    });
    setNewPinCoords({ lat: activeCity.lat, lng: activeCity.lng });
    setIsAddModalOpen(true);
  };

  // Save brand new location pin
  const handleSaveLocation = (newPin: LocationPin) => {
    updateAndSaveLocations((prev) => [newPin, ...prev]);
    setSelectedLocation(newPin);
    setIsAddingLocation(false);
    setNewPinCoords(null);
    setAiNewPinData(null);
  };

  // Clear every saved place and start fresh
  const handleResetData = () => {
    if (
      window.confirm(
        'Clear all saved places? This removes every location stored in this browser and cannot be undone.'
      )
    ) {
      clearAllLocations();
      setLocations([]);
      setSelectedLocation(null);
      setIsDetailDrawerOpen(false);
      setActiveRoute(null);
      setAiMatchedIds([]);
      setIsAddingLocation(false);
      setNewPinCoords(null);
      announce('All saved places cleared. Add a new place to start fresh.');
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setActiveA11yFilters([]);
    setNearbyRadiusKm(null);
    setAiMatchedIds([]);
    announce('All filters cleared.');
  };

  // Filter locations
  const filteredLocations = useMemo(() => {
    let result = [...locations];

    // AI matched IDs filter (if an AI query is active)
    if (aiMatchedIds.length > 0) {
      result = result.filter((loc) => aiMatchedIds.includes(loc.id));
    }

    // City Filter (if not 'mindanao' all-island view)
    if (activeCity.id !== 'mindanao') {
      const cityLat = activeCity.lat;
      const cityLng = activeCity.lng;
      result = result.filter((loc) => {
        const dist = calculateDistanceKm(cityLat, cityLng, loc.lat, loc.lng);
        if (dist <= 40) return true;
        const cityName = activeCity.name.toLowerCase();
        const shortName = activeCity.shortName.toLowerCase();
        const addr = loc.address.toLowerCase();
        return addr.includes(cityName) || addr.includes(shortName);
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          loc.address.toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q) ||
          loc.tags.some((t) => t.name.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((loc) => loc.category === selectedCategory);
    }

    if (activeA11yFilters.length > 0) {
      for (const filterId of activeA11yFilters) {
        const def = ACCESSIBILITY_QUICK_FILTERS.find((f) => f.id === filterId);
        if (!def) continue;
        if (def.minRating) {
          result = result.filter((l) => l.averageRating >= def.minRating!);
        }
        if (def.tagKeyword) {
          result = result.filter((l) =>
            l.tags.some(
              (t) =>
                t.name.toLowerCase().includes(def.tagKeyword!) &&
                t.confirmations >= t.disputes
            )
          );
        }
      }
    }

    if (nearbyRadiusKm !== null) {
      const origin = userCoords || { lat: activeCity.lat, lng: activeCity.lng };
      result = result.filter((loc) => {
        const dist = calculateDistanceKm(origin.lat, origin.lng, loc.lat, loc.lng);
        return dist <= nearbyRadiusKm;
      });
    }

    return result;
  }, [locations, activeCity, searchQuery, selectedCategory, activeA11yFilters, nearbyRadiusKm, userCoords, aiMatchedIds]);

  return (
    <div className="relative flex h-[100dvh] w-full bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* Far Left Navigation Rail */}
      <SidebarRail
        session={session}
        onSignOut={onSignOut}
        activeTab={activeNavTab}
        onTabChange={(tab) => {
          setActiveNavTab(tab);
          // On phones the list covers the map, so tapping Map View should reveal it.
          if (tab === 'map' && window.matchMedia('(max-width: 767px)').matches) {
            setIsPlacesPanelOpen(false);
          }
        }}
        onOpenAIAnalyzer={() => {
          setAiTargetLocation(null);
          setIsAIModalOpen(true);
        }}
        onOpenAddModal={() => {
          setIsAddingLocation(true);
          setNewPinCoords({ lat: activeCity.lat, lng: activeCity.lng });
          setIsAddModalOpen(true);
        }}
        onResetData={handleResetData}
        onToggleFilterPanel={() => setIsPlacesPanelOpen(!isPlacesPanelOpen)}
        isFilterPanelOpen={isPlacesPanelOpen}
      />

      {/* Places & Search Panel */}
      {!PROTOTYPE_ROUTES[activeNavTab] && (
        <PlacesPanel
          locations={filteredLocations}
          totalLocationsCount={locations.length}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => setSelectedLocation(loc)}
          onOpenDetails={(loc) => {
            setSelectedLocation(loc);
            setIsDetailDrawerOpen(true);
          }}
          onRunAIScan={(loc) => {
            setAiTargetLocation(loc);
            setIsAIModalOpen(true);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          activeA11yFilters={activeA11yFilters}
          onToggleA11yFilter={(fId) =>
            setActiveA11yFilters((prev) =>
              prev.includes(fId) ? prev.filter((id) => id !== fId) : [...prev, fId]
            )
          }
          onClearFilters={handleClearFilters}
          userCoords={userCoords}
          onResetData={handleResetData}
          isOpen={isPlacesPanelOpen}
          onCloseMobile={() => setIsPlacesPanelOpen(false)}
          activeCity={activeCity}
          onSelectCityPreset={(city) => {
            setActiveCity(city);
            if (activeRoute) setActiveRoute(null);
          }}
          onOpenAddModal={() => {
            setIsAddingLocation(true);
            setNewPinCoords({ lat: activeCity.lat, lng: activeCity.lng });
            setIsAddModalOpen(true);
          }}
          onToggleRoute={handleToggleRoute}
          activeRouteLocationId={activeRoute ? selectedLocation?.id : undefined}
          onOpenAIAnalyzer={() => {
            setAiTargetLocation(null);
            setIsAIModalOpen(true);
          }}
          aiMatchedIds={aiMatchedIds}
          onSetAiMatchedIds={setAiMatchedIds}
        />
      )}

      {/* Main Map / Prototype Canvas Area */}
      <main className="isolate flex-1 min-h-0 relative overflow-hidden bg-slate-200">
        {PROTOTYPE_ROUTES[activeNavTab] ? (
          <div className="w-full h-full flex flex-col bg-white">
            {/* Top Navigation Banner */}
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-b border-slate-200 z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNavTab('map')}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Return to map"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Map</span>
                </button>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    {PROTOTYPE_ROUTES[activeNavTab].title}
                  </h2>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    {PROTOTYPE_ROUTES[activeNavTab].subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={withGoogleMapsKey(PROTOTYPE_ROUTES[activeNavTab].url)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Open fullscreen"
                >
                  <span>Open Fullscreen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Embedded Live Interface */}
            <iframe
              src={withGoogleMapsKey(PROTOTYPE_ROUTES[activeNavTab].url)}
              title={PROTOTYPE_ROUTES[activeNavTab].title}
              className="w-full flex-1 border-none bg-white"
            />
          </div>
        ) : (
          <>
            <MapView
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => setSelectedLocation(loc)}
              onOpenDetails={(loc) => {
                setSelectedLocation(loc);
                setIsDetailDrawerOpen(true);
              }}
              isAddingLocation={isAddingLocation}
              newPinCoords={newPinCoords}
              onNewPinCoordsChange={(coords) => {
                setNewPinCoords(coords);
                if (isAddingLocation) {
                  setIsAddModalOpen(true);
                }
              }}
              activeCity={activeCity}
              activeRoute={activeRoute}
              onToggleRoutePreview={handleToggleRoute}
              onClearRoute={() => setActiveRoute(null)}
              userCoords={userCoords}
              onUserCoordsChange={setUserCoords}
              nearbyRadiusKm={nearbyRadiusKm}
              onNearbyRadiusChange={setNearbyRadiusKm}
              onOpenAIAnalyzer={() => {
                setAiTargetLocation(null);
                setIsAIModalOpen(true);
              }}
            />
          </>
        )}
      </main>

      {/* Full Details Slide-out Drawer */}
      {isDetailDrawerOpen && (
        <LocationDetailDrawer
          location={selectedLocation}
          onClose={() => setIsDetailDrawerOpen(false)}
          onVoteTag={handleVoteTag}
          onAddReview={handleAddReview}
          onRunAIScanOnPin={(loc) => {
            setAiTargetLocation(loc);
            setIsAIModalOpen(true);
          }}
        />
      )}

      {/* Add Location Modal */}
      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsAddingLocation(false);
        }}
        initialCoords={newPinCoords}
        initialTags={aiNewPinData?.tags}
        initialPhotoUrl={aiNewPinData?.photoUrl}
        initialAiSummary={aiNewPinData?.summary}
        initialAiBarriers={aiNewPinData?.barriers}
        onSaveLocation={handleSaveLocation}
        onOpenStorefrontScanner={() => {
          setIsAddModalOpen(false);
          setAiTargetLocation(null);
          setIsAIModalOpen(true);
        }}
      />

      {/* AI Storefront Analyzer Modal */}
      <AIStorefrontModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        targetLocation={aiTargetLocation}
        locations={locations}
        onApplyTagsToLocation={handleApplyTagsToLocation}
        onStartNewPinFromAnalysis={handleStartNewPinFromAnalysis}
      />
    </div>
  );
}

function AccessMapApp() {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  const handleSignOut = () => {
    clearSession();
    setSession(null);
  };

  if (!session) {
    return <LoginPage onSignIn={setSession} />;
  }

  return <AccessMapWorkspace session={session} onSignOut={handleSignOut} />;
}

export default function App() {
  return (
    <A11yProvider>
      <AccessMapApp />
    </A11yProvider>
  );
}
