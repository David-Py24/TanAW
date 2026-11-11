/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db, isFirebaseConfigured } from '../firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { LocationPin, LocationTag, Review } from '../types/accessibility';
import { INITIAL_LOCATIONS } from '../data/initialLocations';
import {
  loadLocations as loadLocalLocations,
  saveLocations as saveLocalLocations,
  getStoredUserVotes,
  saveStoredUserVote,
  resetToSeedData as resetLocalSeedData,
} from '../utils/storage';

const LOCATIONS_COLLECTION = 'locations';

/**
 * Strips client-only properties and undefined values before saving to Firestore.
 */
function sanitizePinForFirestore(loc: LocationPin) {
  return {
    id: loc.id,
    name: loc.name,
    category: loc.category,
    address: loc.address,
    lat: loc.lat,
    lng: loc.lng,
    averageRating: loc.averageRating || 0,
    totalReviews: loc.totalReviews || 0,
    description: loc.description || '',
    aiSummary: loc.aiSummary || '',
    aiBarriers: loc.aiBarriers || [],
    photos: loc.photos || [],
    reviews: (loc.reviews || []).map((r) => ({
      id: r.id,
      authorName: r.authorName,
      rating: r.rating,
      comment: r.comment || '',
      date: r.date,
      tagRatings: r.tagRatings || {},
      photos: r.photos || [],
    })),
    tags: (loc.tags || []).map((t) => ({
      name: t.name,
      rating: t.rating ?? 5.0,
      ratingCount: t.ratingCount ?? 1,
      confirmations: t.confirmations ?? 0,
      disputes: t.disputes ?? 0,
      isAiSuggested: Boolean(t.isAiSuggested),
    })),
    createdAt: loc.createdAt || new Date().toISOString(),
    updatedAt: loc.updatedAt || new Date().toISOString(),
  };
}

/**
 * Attaches client-specific stored vote states (confirm / dispute) to each tag.
 */
function attachClientVotes(locations: LocationPin[]): LocationPin[] {
  const storedVotes = getStoredUserVotes();
  return locations.map((loc) => ({
    ...loc,
    tags: (loc.tags || []).map((tag) => {
      const voteKey = `${loc.id}__${tag.name}`;
      return {
        ...tag,
        userVoted: storedVotes[voteKey] || undefined,
      };
    }),
  }));
}

/**
 * Loads locations from Firestore if configured; otherwise loads from local storage.
 * Seeds Firestore with Cagayan de Oro initial locations if the collection is empty.
 */
export async function fetchLocations(): Promise<{
  locations: LocationPin[];
  source: 'firestore' | 'local';
}> {
  if (!isFirebaseConfigured || !db) {
    console.info('[TanAW Backend] Running in Local Storage mode (Firebase not configured in .env).');
    return {
      locations: attachClientVotes(loadLocalLocations()),
      source: 'local',
    };
  }

  try {
    const colRef = collection(db, LOCATIONS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      console.info('[TanAW Backend] Firestore is empty. Seeding initial locations...');
      const batch = writeBatch(db);
      for (const loc of INITIAL_LOCATIONS) {
        const docRef = doc(db, LOCATIONS_COLLECTION, loc.id);
        batch.set(docRef, sanitizePinForFirestore(loc));
      }
      await batch.commit();

      saveLocalLocations(INITIAL_LOCATIONS);
      return {
        locations: attachClientVotes(INITIAL_LOCATIONS),
        source: 'firestore',
      };
    }

    const firestoreLocations = snapshot.docs.map((d) => d.data() as LocationPin);
    saveLocalLocations(firestoreLocations); // Keep local storage warm as offline cache
    return {
      locations: attachClientVotes(firestoreLocations),
      source: 'firestore',
    };
  } catch (err) {
    console.warn('[TanAW Backend] Firestore fetch failed, falling back to local storage:', err);
    return {
      locations: attachClientVotes(loadLocalLocations()),
      source: 'local',
    };
  }
}

/**
 * Saves or updates a location pin in Firestore and local cache.
 */
export async function persistLocation(pin: LocationPin): Promise<void> {
  // Update local storage cache
  const local = loadLocalLocations();
  const existingIdx = local.findIndex((l) => l.id === pin.id);
  const updated = existingIdx >= 0
    ? local.map((l) => (l.id === pin.id ? pin : l))
    : [pin, ...local];
  saveLocalLocations(updated);

  if (!isFirebaseConfigured || !db) return;

  try {
    const docRef = doc(db, LOCATIONS_COLLECTION, pin.id);
    await setDoc(docRef, sanitizePinForFirestore(pin));
  } catch (err) {
    console.error('[TanAW Backend] Failed to write location to Firestore:', err);
  }
}

/**
 * Records a user vote on a tag (confirm or dispute).
 */
export async function persistTagVote(
  pinId: string,
  tagName: string,
  newVote: 'confirm' | 'dispute' | null,
  updatedLocation: LocationPin
): Promise<void> {
  // Save vote to local storage for this browser
  saveStoredUserVote(pinId, tagName, newVote);

  // Update pin in Firestore and local storage
  await persistLocation(updatedLocation);
}

/**
 * Resets Firestore and local cache back to seed data.
 */
export async function resetLocationsToSeed(): Promise<LocationPin[]> {
  resetLocalSeedData();

  if (isFirebaseConfigured && db) {
    try {
      const colRef = collection(db, LOCATIONS_COLLECTION);
      const snapshot = await getDocs(colRef);
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      for (const loc of INITIAL_LOCATIONS) {
        batch.set(doc(db, LOCATIONS_COLLECTION, loc.id), sanitizePinForFirestore(loc));
      }
      await batch.commit();
    } catch (err) {
      console.error('[TanAW Backend] Failed to reset Firestore to seed:', err);
    }
  }

  return attachClientVotes(INITIAL_LOCATIONS);
}
