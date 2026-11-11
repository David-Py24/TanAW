/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { A11yProvider, useA11y } from './context/A11yContext';
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
  getStoredUserVotes,
  saveStoredUserVote,
} from './utils/storage';
import {
  fetchLocations,
  persistLocation,
  persistTagVote,
  resetLocationsToSeed,
} from './services/locationService';
import { MapPin, Sparkles, Plus, Layers, ArrowLeft, ExternalLink } from 'lucide-react';

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

function AccessMapApp() {
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

  // Selected Location
  const [selectedLocation, setSelectedLocation] = useState<LocationPin | null>(() => {
    return locations.length > 0 ? locations[0] : null;
  });

  // Detail Drawer Visibility (full drawer with voting & review form)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Active navigation tab
  const [activeNavTab, setActiveNavTab] = useState<string>('map');

  // Mobile / Filter panel toggle
  const [isPlacesPanelOpen, setIsPlacesPanelOpen] = useState(true);

  // Search & Tag Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

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

  // Helper to persist updates locally and to Firestore
  const updateAndSaveLocations = (
    updater: (prev: LocationPin[]) => LocationPin[],
    affectedPinId?: string
  ) => {
    setLocations((prev) => {
      const next = updater(prev);
      saveLocations(next);
      if (affectedPinId) {
        const pin = next.find((p) => p.id === affectedPinId);
        if (pin) persistLocation(pin);
      }
      return next;
    });
  };

  // Sync locations from Firestore on initial mount
  useEffect(() => {
    let isMounted = true;
    fetchLocations().then(({ locations: loaded, source }) => {
      if (!isMounted) return;
      setLocations(loaded);
      if (loaded.length > 0) {
        setSelectedLocation((curr) => curr || loaded[0]);
      }
      if (source === 'firestore') {
        announce('Connected to Firebase Firestore cloud database.');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync selectedLocation if it was updated in locations array
  useEffect(() => {
    if (selectedLocation) {
      const fresh = locations.find((l) => l.id === selectedLocation.id);
      if (fresh) setSelectedLocation(fresh);
    }
  }, [locations]);

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
      }),
      pinId
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
      }),
      pinId
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
      }),
      locationId
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
    setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
    setIsAddModalOpen(true);
  };

  // Save brand new location pin
  const handleSaveLocation = (newPin: LocationPin) => {
    updateAndSaveLocations((prev) => [newPin, ...prev], newPin.id);
    setSelectedLocation(newPin);
    setIsAddingLocation(false);
    setNewPinCoords(null);
    setAiNewPinData(null);
  };

  // Reset to seed data
  const handleResetData = async () => {
    if (window.confirm('Reset all AccessMap pins to initial Cagayan de Oro seed places?')) {
      const reset = await resetLocationsToSeed();
      setLocations(reset);
      setSelectedLocation(reset[0] || null);
      announce('Database reset to Cagayan de Oro seed data.');
    }
  };

  // Filter locations
  const filteredLocations = useMemo(() => {
    let result = [...locations];

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

    if (selectedTags.length > 0) {
      result = result.filter((loc) => {
        const locTagNames = loc.tags.map((t) => t.name);
        return selectedTags.every((t) => locTagNames.includes(t));
      });
    }

    return result;
  }, [locations, searchQuery, selectedCategory, selectedTags]);

  return (
    <div className="flex h-screen w-screen bg-[#f1f5f9] text-slate-900 overflow-hidden font-sans">
      {/* Far Left Navigation Rail (Matching Reference UI rail) */}
      <SidebarRail
        activeTab={activeNavTab}
        onTabChange={setActiveNavTab}
        onOpenAIAnalyzer={() => {
          setAiTargetLocation(null);
          setIsAIModalOpen(true);
        }}
        onOpenAddModal={() => {
          setIsAddingLocation(true);
          setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
          setIsAddModalOpen(true);
        }}
        onResetData={handleResetData}
        onToggleFilterPanel={() => setIsPlacesPanelOpen(!isPlacesPanelOpen)}
        isFilterPanelOpen={isPlacesPanelOpen}
      />

      {/* Floating / Docked Places Panel (Matching Reference UI "Packages" panel) */}
      {!PROTOTYPE_ROUTES[activeNavTab] && (
        <PlacesPanel
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
          }}
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
          selectedTags={selectedTags}
          onToggleTag={(tag) => {
            setSelectedTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
            );
          }}
          onClearTags={() => setSelectedTags([])}
          userCoords={userCoords}
          onResetData={handleResetData}
          isOpen={isPlacesPanelOpen}
        />
      )}

      {/* Main Map / Prototype Canvas Area */}
      <main className="flex-1 h-full relative overflow-hidden bg-slate-200">
        {PROTOTYPE_ROUTES[activeNavTab] ? (
          <div className="w-full h-full flex flex-col bg-white">
            {/* Top Navigation Banner */}
            <div className="flex items-center justify-between px-5 py-3 bg-[#EAF3F7] border-b-2 border-[#0F172A] z-10 shrink-0">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveNavTab('map')}
                  className="px-3 py-1.5 rounded-xl bg-white border-[1.5px] border-[#0F172A] text-xs font-bold text-[#0F172A] shadow-[0_2px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Return to interactive map"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Map</span>
                </button>
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A] leading-tight">
                    {PROTOTYPE_ROUTES[activeNavTab].title}
                  </h2>
                  <p className="text-[11px] text-[#475569] hidden sm:block">
                    {PROTOTYPE_ROUTES[activeNavTab].subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="hidden md:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E7F2F0] text-[#21524B] border border-[#21524B]/30">
                  External Repo Linked
                </span>
                <a
                  href={PROTOTYPE_ROUTES[activeNavTab].url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-white border-[1.5px] border-[#0F172A] text-[11px] font-bold text-[#0F172A] shadow-[0_2px_0_#0F172A] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Open this page in a separate full browser tab"
                >
                  <span>Open Fullscreen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Embedded Live Interface from Sibling Repo */}
            <iframe
              src={PROTOTYPE_ROUTES[activeNavTab].url}
              title={PROTOTYPE_ROUTES[activeNavTab].title}
              className="w-full flex-1 border-none bg-white"
            />
          </div>
        ) : (
          <>
            <MapView
              locations={filteredLocations}
              selectedLocation={selectedLocation}
              onSelectLocation={(loc) => {
                setSelectedLocation(loc);
              }}
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
            />

            {/* Mobile toggle button for places panel */}
            <button
              type="button"
              onClick={() => setIsPlacesPanelOpen(!isPlacesPanelOpen)}
              className="md:hidden absolute bottom-24 right-5 z-[550] px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-full shadow-xl flex items-center gap-1.5 cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>{isPlacesPanelOpen ? 'Hide List' : 'Show List'}</span>
            </button>
          </>
        )}

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
      </main>
    </div>
  );
}

export default function App() {
  return (
    <A11yProvider>
      <AccessMapApp />
    </A11yProvider>
  );
}
