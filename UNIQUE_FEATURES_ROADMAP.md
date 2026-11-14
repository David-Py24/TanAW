# TanAW — Unique Features & Innovation Roadmap

> **Why TanAW Exists Beyond Google Maps & Waze:**
> Standard mapping platforms treat accessibility as a hidden binary ("Yes/No") checkbox, show the exact same map to a wheelchair user as to someone walking, and offer Local Guide points with zero real-world value. **TanAW** combines **Google Gemini Vision AI**, **Philippine BP 344 Accessibility Standards**, **Map-to-Earn Community Rewards**, and **Lived-Experience Verification** tailored for **Iligan City and across Mindanao**.

---

## Part 1: Gamification, Contributors & Voucher Ecosystem — ✅ COMPLETED & AUDITED

### 1. ✅ Impact Score → Redeemable Partner & AI Vouchers ("Map-to-Earn" Perks)
- **Status:** Completed (`src/utils/storage.ts`, `src/components/CommunityView.tsx`, `src/components/ProfileHubView.tsx`)
- **Concept:** Contributors earn **TanAW Impact Points** (`+30 pts` per AI Storefront Scan, `+20 pts` per review, `+10 pts` per tag confirmation) that convert into a **Redeemable Rewards Wallet**.
- **Real-World Value:** Points can be redeemed for QR/code vouchers at inclusive partner cafés, pharmacies, and clinics in Iligan City & Mindanao (e.g., *₱50 Partner Café Voucher*, *Free Pharmacy Medicine Delivery Pass*, or *AI Storefront Audit Credits* for local shop owners).
- **Why It Beats Google Maps:** Google Local Guide points are vanity numbers; TanAW points reward contributors while driving foot traffic to accessibility-verified local businesses.
- **Target Components:** `src/components/CommunityView.tsx`, `src/components/ProfileHubView.tsx`, `src/utils/storage.ts`

### 2. ✅ Specialty Contributor Badges & Weighted Trust Tiers
- **Status:** Completed (`src/utils/storage.ts`, `src/components/CommunityView.tsx`, `src/components/ProfileHubView.tsx`, `src/App.tsx`)
- **Concept:** Contributors unlock specialized role-and-action badges displayed next to their names on reviews and the leaderboard:
  - **AI Vision Pioneer** — Scanned 3+ storefront entrances with Gemini AI.
  - **Ramp & Curb Scout** — Verified 5+ step-free entrances and ramps.
  - **Verified Lived-Experience (PWD / Caregiver)** — Reviews and tag votes from verified PWD members or caregivers carry **2x verification weight**.
  - **Mindanao Trailblazer** — Mapped an unverified barangay clinic, pharmacy, or public transit stop.
- **Why It Beats Google Maps:** Replaces generic star ratings with domain-specific trust from people who actually rely on accessibility infrastructure.
- **Target Components:** `src/components/CommunityView.tsx`, `src/components/ProfileHubView.tsx`, `src/components/LocationDetailDrawer.tsx`

### 3. ✅ "TanAW Verified Accessible" Business Seal + Patron Discount Vouchers
- **Status:** Completed (`src/utils/storage.ts`, `src/components/LocationCard.tsx`, `src/components/LocationDetailDrawer.tsx`)
- **Concept:** When a local business passes a **Gemini AI Storefront Scan** plus community confirmations, it earns a **"TanAW Verified Accessible"** seal on its map pin and card.
- **Real-World Value:** Verified businesses can attach an **Inclusive Patron Voucher** directly on their pin (e.g., *"Present your TanAW app for a free drink upsize or extra 5% perk on top of your statutory 20% PWD/Senior Citizen discount"*).
- **Why It Beats Google Maps:** Gives local merchants a direct financial incentive to install threshold ramps and clear doorway barriers.
- **Target Components:** `src/components/LocationCard.tsx`, `src/components/LocationDetailDrawer.tsx`, `src/types/accessibility.ts`

### 4. ✅ "Bayanihan Bounties" (Sponsored Community Mapping Quests)
- **Status:** Completed (`src/components/CommunityView.tsx`)
- **Concept:** Local LGUs (e.g., Iligan City Hall / PDAO), universities (MSU-IIT), CSR sponsors, or NGOs post time-bound **Mapping Quests** on the Community board.
- **Example Quest:** *"Scan & verify 15 pharmacies and barangay health stations in Iligan City this week — 2x Impact Points + ₱100 Partner Voucher for top mappers."*
- **Why It Beats Google Maps:** Directs community mapping toward underserved neighborhoods, clinics, and public facilities instead of only commercial malls.
- **Target Components:** `src/components/CommunityView.tsx`

---

## Part 2: AI Storefront Intelligence & Business Empowerment

### 5. AI "BP 344 Compliance & Quick-Fix Coach" for Business Owners
- **Concept:** Instead of merely labeling a venue *"Not Accessible"*, Gemini Vision AI generates a practical **Low-Cost Action Plan** aligned with **Batas Pambansa Blg. 344** (Philippine Accessibility Law).
- **Example Output:** *"2 concrete steps detected (~28 cm rise). Installing a portable non-slip aluminum threshold ramp (approx. ₱2,500–₱3,500) or a doorbell-for-assistance button at 90 cm height will make this entrance wheelchair-accessible."*
- **Why It Beats Google Maps:** Transforms TanAW from a passive rating app into an actionable upgrade advisor for small Mindanao businesses.
- **Target Components:** `src/components/AIStorefrontModal.tsx`, `src/components/storefront/AnalysisResultsSection.tsx`, `src/prompts/storefrontPrompt.ts`

### 6. Voice-Guided "Audio Storefront Briefing" for Blind & Low-Vision Users
- **Concept:** A 1-tap **"🔊 Listen to Entrance Guide"** button inside every venue drawer that uses the browser's native Web Speech synthesis (`window.speechSynthesis`) to read out Gemini's spatial storefront summary and community warnings.
- **Example Audio:** *"Centrio Mall Corrales Entrance. Accessible. Automatic sliding glass doors with zero-step threshold and gentle concrete ramp on the right side."*
- **Why It Beats Google Maps:** Gives blind and low-vision users an immediate spatial mental model of the doorway before they even step out of a vehicle.
- **Target Components:** `src/components/LocationDetailDrawer.tsx`

---

## Part 3: Hyper-Personalized & Real-Time Navigation

### 7. Personal Mobility & Sensory Match Score ("96% Match for You")
- **Concept:** Users select their personal mobility or sensory profile (*Manual Wheelchair*, *Power Wheelchair*, *Crutches / Cane / Senior*, *Visual Impairment*, or *Low-Sensory / Neurodivergent*).
- **How It Works:** Every venue card dynamically computes a **Personal Match % Badge** based on the tags that matter to that specific user profile.
- **Why It Beats Google Maps:** Accessibility is not one-size-fits-all; a quiet café with 1 small step may be 100% suitable for a neurodivergent user but 0% accessible for a power wheelchair user.
- **Target Components:** `src/components/PlacesPanel.tsx`, `src/components/LocationCard.tsx`, `src/context/A11yContext.tsx`

### 8. Live 24-Hour Temporary Barrier Alerts ("Blocked Right Now")
- **Concept:** Waze-style temporary accessibility hazard alerts reported by the community.
- **Real-World Scenarios:** A permanent ramp blocked today by parked motorcycles, street flooding after heavy rain, sidewalk excavation, or a mall elevator temporarily out of order.
- **Why It Beats Google Maps:** Google Maps only knows static architecture; TanAW warns users about real-time obstacles before they travel.
- **Target Components:** `src/components/LocationDetailDrawer.tsx`, `src/components/MapView.tsx`

### 9. "Last 20 Meters" Exact Door & Tricycle/Taxi Drop-Off Guide
- **Concept:** Standard maps drop a pin on the center of a building's roof. For PWDs and seniors, the hardest part of any trip is the **last 20 meters** — knowing *which exact side door* has the ramp and where a tricycle, jeepney, or taxi can unload safely with a curb cut.
- **Target Components:** `src/components/LocationDetailDrawer.tsx`, `src/components/AddLocationModal.tsx`

### 10. "Call Ahead / Request Staff Entrance Assist" 1-Tap Action
- **Concept:** Many older buildings in Mindanao have structural steps that cannot be demolished overnight, *but* have staff or security guards ready to deploy a portable ramp or assist at the door if notified.
- **How It Works:** A 1-tap **"Request Entrance Assist"** button on Partially Accessible venues that prepares a quick SMS/call notification (*"Hi! A TanAW user arriving in 5 minutes requests ramp/entrance assistance at your main door"*).
- **Target Components:** `src/components/LocationDetailDrawer.tsx`

### 11. Weather-Safe & Wheelchair-Battery-Safe Tags
- **Concept:** In tropical Mindanao weather (sudden downpours and intense midday heat), uncovered transfers and steep uphill slopes drain wheelchair batteries and endanger seniors.
- **How It Works:** Dedicated tags for **Covered Drop-Off / Rain-Safe Walkway** and **Flat Level Approach**.
- **Target Components:** `src/types/accessibility.ts`, `src/components/LocationDetailDrawer.tsx`

---

## Part 4: Civic & LGU Smart-City Impact

### 12. Accessible Disaster & Evacuation Shelter Layer (DRRMO Emergency Mode)
- **Concept:** During floods, typhoons, or earthquakes in Mindanao, standard barangay evacuation centers often lack ramps or ground-floor accessible restrooms.
- **How It Works:** A 1-click **Emergency Accessible Shelter & Medical Filter** highlighting step-free evacuation centers, hospitals, and dialysis clinics with backup power.
- **Target Components:** `src/components/PlacesPanel.tsx`, `src/components/MapSearchFilterBar.tsx`

### 13. LGU "Barrier Heatmap & Action Report" Export for City Engineers
- **Concept:** Aggregates disputed tags and AI-detected barriers into a live **City Accessibility Gap Summary** in the Community hub, with a 1-click **Export LGU Action Report (CSV/Print)** for PDAO (Persons with Disability Affairs Office) and city engineering teams.
- **Target Components:** `src/components/CommunityView.tsx`
