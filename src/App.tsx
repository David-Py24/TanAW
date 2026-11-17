/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { A11yProvider, useA11y } from './context/A11yContext';
import { SidebarRail } from './components/SidebarRail';
import { PlacesPanel } from './components/PlacesPanel';
import { MapView } from './components/MapView';
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
  resetToSeedData,
  getStoredUserVotes,
  saveStoredUserVote,
} from './utils/storage';
import {
  MapPin,
  Sparkles,
  Plus,
  Layers,
  ArrowLeft,
  ExternalLink,
  Flag,
  MessageSquare,
  Bell,
  X,
} from 'lucide-react';

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
  const [selectedLocation, setSelectedLocation] = useState<LocationPin | null>(null);

  // Active navigation tab
  const [activeNavTab, setActiveNavTab] = useState<string>('map');

  // Mobile / Filter panel toggle
  const [isPlacesPanelOpen, setIsPlacesPanelOpen] = useState(false);

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

  // Prototype iframe ref & notification toast
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Top header actions for embedded prototypes
  const handleReportBarrierFromHeader = () => {
    try {
      if (iframeRef.current?.contentDocument) {
        const reportBtn = iframeRef.current.contentDocument.querySelector('#reportTop') as HTMLElement;
        if (reportBtn) {
          reportBtn.click();
          return;
        }
      }
    } catch {
      // Cross-origin fallback
    }
    announce('Barrier reporting opens in the mobile app.');
    setNotificationToast('Barrier reporting opens in the mobile app.');
    setTimeout(() => setNotificationToast(null), 3000);
  };

  const handleAddPlaceFromHeader = () => {
    try {
      if (iframeRef.current?.contentDocument) {
        const addBtn = iframeRef.current.contentDocument.querySelector('[data-open="dlg"]') as HTMLElement;
        if (addBtn) {
          addBtn.click();
          return;
        }
      }
    } catch {
      // Fallback
    }
    setIsAddingLocation(true);
    setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
    setIsAddModalOpen(true);
  };

  const handleIframeLoad = () => {
    try {
      if (iframeRef.current?.contentDocument) {
        const doc = iframeRef.current.contentDocument;
        if (!doc.getElementById('accessmap-unified-header-style')) {
          const style = doc.createElement('style');
          style.id = 'accessmap-unified-header-style';
          style.textContent = '.top { display: none !important; }';
          doc.head.appendChild(style);
        }
      }
    } catch (e) {
      console.debug('Frame header style injection skipped:', e);
    }
  };

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
    setNewPinCoords({ lat: 8.4822, lng: 124.6473 });
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

  // Toggle pinning of a location
  const handleTogglePinLocation = (pinId: string) => {
    updateAndSaveLocations((prev) =>
      prev.map((loc) => {
        if (loc.id === pinId) {
          const isPinned = !loc.isPinnedByMe;
          const currentCount = loc.pinCount ?? 1;
          const newCount = isPinned ? currentCount + 1 : Math.max(0, currentCount - 1);
          announce(
            isPinned
              ? `Pinned ${loc.name}. Total pins: ${newCount}`
              : `Unpinned ${loc.name}. Total pins: ${newCount}`
          );
          return {
            ...loc,
            isPinnedByMe: isPinned,
            pinCount: newCount,
          };
        }
        return loc;
      })
    );
  };

  // Quick pin from right-click context menu
  const handleQuickAddPin = (pinData: {
    lat: number;
    lng: number;
    name: string;
    category?: CategoryType;
    tags?: string[];
    description?: string;
  }) => {
    const newLocation: LocationPin = {
      id: `cdo-quick-${Date.now()}`,
      name: pinData.name.trim() || 'Pinned Community Location',
      category: pinData.category || 'Other',
      address: `Coordinates: ${pinData.lat.toFixed(4)}, ${pinData.lng.toFixed(4)}`,
      lat: pinData.lat,
      lng: pinData.lng,
      averageRating: 5.0,
      totalReviews: 1,
      pinCount: 1,
      isPinnedByMe: true,
      tags: (pinData.tags || ['Wheelchair-accessible entrance']).map((tagName) => ({
        name: tagName,
        rating: 5.0,
        ratingCount: 1,
        confirmations: 1,
        disputes: 0,
      })),
      photos: [],
      reviews: [
        {
          id: `rev-quick-${Date.now()}`,
          authorName: 'You (Pin Contributor)',
          rating: 5,
          comment: pinData.description || 'Pinned on map via quick context menu.',
          date: new Date().toISOString().split('T')[0],
        },
      ],
      description: pinData.description || 'Pinned via right-click map context menu.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    updateAndSaveLocations((prev) => [newLocation, ...prev]);
    setSelectedLocation(newLocation);
    setIsPlacesPanelOpen(true);
    announce(`Pinned location "${newLocation.name}" saved successfully.`);
  };

  // Reset to seed data
  const handleResetData = () => {
    if (window.confirm('Reset all TanAW pins to initial Cagayan de Oro seed places?')) {
      const reset = resetToSeedData();
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

      {/* Floating / Docked Places Panel (Fused with Place Details inside the Left Sidebar) */}
      {activeNavTab === 'map' && isPlacesPanelOpen && (
        <PlacesPanel
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
          }}
          onOpenDetails={(loc) => {
            setSelectedLocation(loc);
            setIsPlacesPanelOpen(true);
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
          onClose={() => setIsPlacesPanelOpen(false)}
          onTogglePin={handleTogglePinLocation}
          onVoteTag={handleVoteTag}
          onAddReview={handleAddReview}
        />
      )}

      {/* Pages rendered as a docked left sidebar instead of full page overlay */}
      {activeNavTab !== 'map' && PROTOTYPE_ROUTES[activeNavTab] && (
        <aside className="w-full sm:w-[400px] md:w-[460px] lg:w-[480px] bg-white border-r-[1.5px] border-[#0F172A] flex flex-col h-full shrink-0 z-30 shadow-2xl animate-slide-in-left">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b-[1.5px] border-[#0F172A] bg-[#EAF3F7] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setActiveNavTab('map')}
                className="px-2.5 py-1.5 rounded-xl border border-slate-300 hover:border-[#0F172A] bg-white text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs shrink-0"
                title="Back to Map"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Map</span>
              </button>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-extrabold text-[#0F172A] truncate">
                  {PROTOTYPE_ROUTES[activeNavTab].title}
                </h2>
                <p className="text-[10px] text-slate-500 truncate hidden sm:block">
                  {PROTOTYPE_ROUTES[activeNavTab].subtitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <a
                href={PROTOTYPE_ROUTES[activeNavTab].url}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-xl border border-slate-300 hover:border-[#0F172A] bg-white text-slate-700 hover:bg-slate-100 transition-colors"
                title="Open fullscreen in new tab"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setActiveNavTab('map')}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Embedded page iframe */}
          <iframe
            ref={iframeRef}
            onLoad={handleIframeLoad}
            src={PROTOTYPE_ROUTES[activeNavTab].url}
            title={PROTOTYPE_ROUTES[activeNavTab].title}
            className="w-full flex-1 border-none bg-white"
          />
        </aside>
      )}

      {/* Main Map Canvas Area: Always visible in background */}
      <main className="flex-1 h-full relative overflow-hidden bg-slate-200">
        <MapView
          locations={filteredLocations}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            setIsPlacesPanelOpen(true);
            if (activeNavTab !== 'map') setActiveNavTab('map');
          }}
          onOpenDetails={(loc) => {
            setSelectedLocation(loc);
            setIsPlacesPanelOpen(true);
            if (activeNavTab !== 'map') setActiveNavTab('map');
          }}
          isAddingLocation={isAddingLocation}
          newPinCoords={newPinCoords}
          onNewPinCoordsChange={(coords) => {
            setNewPinCoords(coords);
            if (isAddingLocation) {
              setIsAddModalOpen(true);
            }
          }}
          onQuickAddPin={handleQuickAddPin}
          onTogglePinLocation={handleTogglePinLocation}
        />

        {/* Floating toggle button for location details panel */}
        <button
          type="button"
          onClick={() => {
            if (activeNavTab !== 'map') setActiveNavTab('map');
            setIsPlacesPanelOpen(!isPlacesPanelOpen);
          }}
          className="absolute bottom-20 right-6 z-[550] px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-xl flex items-center gap-1.5 cursor-pointer transition-all border border-slate-700"
          title={isPlacesPanelOpen ? 'Collapse location details' : 'Show location details'}
          aria-label={isPlacesPanelOpen ? 'Collapse location details' : 'Show location details'}
        >
          <Layers className="w-4 h-4" />
          <span>{isPlacesPanelOpen ? 'Hide Locations' : 'Show Locations'}</span>
        </button>

        {/* Notification Toast */}
        {notificationToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0F172A] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-slate-700 pointer-events-none">
            {notificationToast}
          </div>
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
