/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { A11yProvider, useA11y } from './context/A11yContext';
import { SidebarRail, AppViewMode } from './components/SidebarRail';
import { PlacesPanel, PlacesTab } from './components/PlacesPanel';
import { MapView } from './components/MapView';
import { LocationDetailDrawer } from './components/LocationDetailDrawer';
import { AddLocationModal } from './components/AddLocationModal';
import { AIStorefrontModal } from './components/AIStorefrontModal';
import { AuthGatePage } from './components/AuthGatePage';
import { ProfileHubView } from './components/ProfileHubView';
import { CommunityView } from './components/CommunityView';
import { Modal } from './components/ui/Modal';
import {
  LocationPin,
  CategoryType,
  Review,
  StorefrontAnalysisResult,
  LocationTag,
} from './types/accessibility';
import {
  AuthUser,
  getCurrentUser,
  setCurrentUserSession,
  getSavedPlaceIds,
  toggleSavedPlaceId,
  loadLocations,
  saveLocations,
  getStoredUserVotes,
  saveStoredUserVote,
} from './utils/storage';
import {
  fetchLocations,
  persistLocation,
  resetLocationsToSeed,
} from './services/locationService';
import {
  MapPin,
  Sparkles,
  Plus,
  List,
  Menu,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

function AccessMapApp() {
  const { announce } = useA11y();

  // Signed-in User State (gates the app to prevent anonymous trolling)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => getCurrentUser());

  // Active primary view ('map' | 'community' | 'profile')
  const [activeView, setActiveView] = useState<AppViewMode>('map');

  // Saved / Bookmarked Place IDs for current user
  const [savedPlaceIds, setSavedPlaceIds] = useState<string[]>(() => {
    const user = getCurrentUser();
    return user ? getSavedPlaceIds(user.id) : [];
  });

  useEffect(() => {
    if (currentUser) {
      setSavedPlaceIds(getSavedPlaceIds(currentUser.id));
    } else {
      setSavedPlaceIds([]);
    }
  }, [currentUser?.id]);

  const handleToggleSavePlace = (locationId: string) => {
    if (!currentUser) return;
    const next = toggleSavedPlaceId(currentUser.id, locationId);
    setSavedPlaceIds(next);
    announce(
      next.includes(locationId)
        ? 'Place saved to your Profile.'
        : 'Place removed from Saved Places.'
    );
  };

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

  // Selected Location (starts null so map is uncluttered until user selects a venue)
  const [selectedLocation, setSelectedLocation] = useState<LocationPin | null>(null);

  // Detail Drawer Visibility
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Places panel toggle (default open on desktop, closed on mobile so map is visible first)
  const [isPlacesPanelOpen, setIsPlacesPanelOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true;
  });

  // Mobile Navigation Drawer & Quick Guide Modal
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);

  // Single Unified Filter State (shared across PlacesPanel and MapView)
  const [activeStatusTab, setActiveStatusTab] = useState<PlacesTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'All'>('All');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [userCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Add Location Flow State
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [newPinCoords, setNewPinCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // AI Storefront Analyzer State (used when scanning an existing pin from its detail drawer)
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

  const handleSaveLocation = (newPin: LocationPin) => {
    updateAndSaveLocations((prev) => [newPin, ...prev], newPin.id);
    setSelectedLocation(newPin);
    setIsAddingLocation(false);
    setNewPinCoords(null);
    setAiNewPinData(null);
  };

  // Reset to seed data
  const handleResetData = async () => {
    if (window.confirm('Reset all TanAW pins to initial Cagayan de Oro seed places?')) {
      const reset = await resetLocationsToSeed();
      setLocations(reset);
      setSelectedLocation(null);
      announce('Database reset to Cagayan de Oro seed data.');
    }
  };

  const handleResetAllFilters = () => {
    setActiveStatusTab('all');
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTags([]);
    announce('All filters cleared.');
  };

  // Single Unified Filter Pipeline (List + Map always show the exact same places)
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (activeStatusTab === 'verified') {
        const isVerified =
          loc.tags.some((t) => t.confirmations >= 2 && t.confirmations > t.disputes) &&
          loc.averageRating >= 4.0;
        if (!isVerified) return false;
      } else if (activeStatusTab === 'barriers') {
        const hasBarriers =
          (loc.aiBarriers && loc.aiBarriers.length > 0) ||
          (loc.averageRating > 0 && loc.averageRating < 3.0);
        if (!hasBarriers) return false;
      }

      if (selectedCategory !== 'All' && loc.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          loc.name.toLowerCase().includes(q) ||
          loc.address.toLowerCase().includes(q) ||
          loc.category.toLowerCase().includes(q) ||
          loc.tags.some((t) => t.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (selectedTags.length > 0) {
        const locTagNames = loc.tags.map((t) => t.name);
        if (!selectedTags.every((t) => locTagNames.includes(t))) {
          return false;
        }
      }

      return true;
    });
  }, [locations, activeStatusTab, selectedCategory, searchQuery, selectedTags]);

  if (!currentUser) {
    return (
      <AuthGatePage
        onAuthenticated={(user) => {
          setCurrentUser(user);
          announce(`Signed in as ${user.name}. Welcome to TanAW.`);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-dvh w-screen bg-[#f1f5f9] text-slate-900 overflow-hidden font-sans">
      {/* Left Navigation Sidebar */}
      <SidebarRail
        activeView={activeView}
        onViewChange={setActiveView}
        currentUser={currentUser}
        onSignOut={() => {
          setCurrentUserSession(null);
          setCurrentUser(null);
          announce('Signed out of TanAW.');
        }}
        onOpenAIAnalyzer={() => {
          setAiTargetLocation(null);
          setIsAIModalOpen(true);
        }}
        onOpenAddModal={() => {
          setActiveView('map');
          setIsAddingLocation(true);
          setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
          setIsAddModalOpen(true);
        }}
        onToggleFilterPanel={() => setIsPlacesPanelOpen(!isPlacesPanelOpen)}
        isFilterPanelOpen={isPlacesPanelOpen}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
      />

      {/* Docked (Desktop) / Full-Sheet (Mobile) Places Panel — visible when on Map view */}
      {activeView === 'map' && (
        <PlacesPanel
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          savedPlaceIds={savedPlaceIds}
          onToggleSavePlace={handleToggleSavePlace}
          onSelectLocation={(loc) => setSelectedLocation(loc)}
          onOpenDetails={(loc) => {
            setSelectedLocation(loc);
            setIsDetailDrawerOpen(true);
          }}
          activeTab={activeStatusTab}
          onTabChange={setActiveStatusTab}
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
          onCloseMobile={() => setIsPlacesPanelOpen(false)}
        />
      )}

      {/* Main Content Area: Map, Community Hub, or Profile Hub */}
      <main className="flex-1 min-h-0 h-full relative overflow-hidden bg-slate-200">
        {activeView === 'profile' ? (
          <ProfileHubView
            currentUser={currentUser}
            onUpdateUser={setCurrentUser}
            locations={locations}
            savedPlaceIds={savedPlaceIds}
            onToggleSavePlace={handleToggleSavePlace}
            userVotes={getStoredUserVotes()}
            onSelectLocationOnMap={(loc) => {
              setSelectedLocation(loc);
              setActiveView('map');
            }}
          />
        ) : activeView === 'community' ? (
          <CommunityView
            locations={locations}
            currentUser={currentUser}
            userVotesCount={Object.keys(getStoredUserVotes()).length}
            onSelectLocationOnMap={(loc) => {
              setSelectedLocation(loc);
              setActiveView('map');
            }}
          />
        ) : (
          <MapView
            locations={filteredLocations}
            totalLocationsCount={locations.length}
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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onResetFilters={handleResetAllFilters}
            onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
            isPlacesPanelOpen={isPlacesPanelOpen}
          />
        )}

        {/* Full Details Slide-out Drawer */}
        {isDetailDrawerOpen && (
          <LocationDetailDrawer
            location={selectedLocation}
            currentUserName={currentUser.name}
            isSaved={selectedLocation ? savedPlaceIds.includes(selectedLocation.id) : false}
            onToggleSave={handleToggleSavePlace}
            onClose={() => setIsDetailDrawerOpen(false)}
            onVoteTag={handleVoteTag}
            onAddReview={handleAddReview}
            onRunAIScanOnPin={(loc) => {
              setAiTargetLocation(loc);
              setIsAIModalOpen(true);
            }}
          />
        )}

        {/* Simplified Add Location Modal */}
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
          currentUserName={currentUser.name}
          onSaveLocation={handleSaveLocation}
        />

        {/* AI Storefront Analyzer Modal (triggered from Place Details) */}
        <AIStorefrontModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          targetLocation={aiTargetLocation}
          locations={locations}
          onApplyTagsToLocation={handleApplyTagsToLocation}
          onStartNewPinFromAnalysis={handleStartNewPinFromAnalysis}
        />

        {/* How TanAW Works Quick Guide Modal */}
        <Modal
          isOpen={isHowItWorksOpen}
          onClose={() => setIsHowItWorksOpen(false)}
          title="Welcome to TanAW"
          subtitle="Crowdsourced Accessibility Mapping & Gemini AI Storefront Scanner"
          maxWidthClassName="max-w-lg"
          footer={
            <button
              type="button"
              onClick={() => setIsHowItWorksOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              Got it, start exploring
            </button>
          }
        >
          <div className="space-y-4 text-xs sm:text-sm text-slate-700">
            <p className="leading-relaxed">
              <strong>TanAW</strong> helps people with disabilities, seniors, and families navigate Cagayan de Oro and Mindanao with confidence. Here is how to use it in 3 steps:
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900">1. Check Pin Colors &amp; Verified Tags</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <strong className="text-emerald-700">Green pins (4.0★+)</strong> have community-verified ramps, elevators, or accessible entrances.{' '}
                    <strong className="text-amber-700">Amber pins</strong> have partial access, and{' '}
                    <strong className="text-rose-700">Red pins</strong> have reported physical barriers.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-200 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900">2. Auto-Tag Storefront Photos with AI</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    When pinning or reviewing a place, upload a storefront photo to let Gemini Vision automatically detect ramps, door width, and step barriers.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-slate-900">3. Vote Confirm or Dispute</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Open any venue’s details drawer to confirm accurate accessibility tags, report barriers, or write a review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Primary Navigation"
        className="md:hidden h-16 bg-white border-t border-slate-200 z-[650] grid grid-cols-5 items-center px-1 shrink-0 select-none"
      >
        <button
          type="button"
          onClick={() => {
            setActiveView('map');
            setIsPlacesPanelOpen(false);
            setIsMobileMenuOpen(false);
          }}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold cursor-pointer transition-colors ${
            activeView === 'map' && !isPlacesPanelOpen
              ? 'text-emerald-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Map</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('map');
            setIsPlacesPanelOpen(!isPlacesPanelOpen);
            setIsMobileMenuOpen(false);
          }}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold cursor-pointer transition-colors ${
            activeView === 'map' && isPlacesPanelOpen
              ? 'text-emerald-700'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <List className="w-5 h-5" />
          <span>Places ({filteredLocations.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveView('map');
            setIsAddingLocation(true);
            setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
            setIsAddModalOpen(true);
            setIsPlacesPanelOpen(false);
            setIsMobileMenuOpen(false);
          }}
          className="h-11 mx-1 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center gap-0.5 text-[10px] font-extrabold shadow-md active:scale-95 transition-transform cursor-pointer"
          aria-label="Pin a new accessible place"
        >
          <Plus className="w-4 h-4" />
          <span>Pin Place</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAiTargetLocation(null);
            setIsAIModalOpen(true);
            setIsMobileMenuOpen(false);
          }}
          className="h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 cursor-pointer transition-colors"
        >
          <Sparkles className="w-5 h-5" />
          <span>AI Scan</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold cursor-pointer transition-colors ${
            isMobileMenuOpen ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
          aria-expanded={isMobileMenuOpen}
          aria-label="Open accessibility settings and help"
        >
          <Menu className="w-5 h-5" />
          <span>Settings</span>
        </button>
      </nav>
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
