# AccessMap - Project Documentation & Progress Log

**Application**: AccessMap  
**Purpose**: Crowdsourced Accessibility Mapping Platform with Multimodal Gemini AI Storefront Analysis  
**Region of Focus**: Cagayan de Oro, Northern Mindanao, Philippines  
**Repository & Tech Stack**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, OpenStreetMap, Express, Google GenAI SDK (`gemini-3.8-flash`)  

---

## 1. Executive Summary

AccessMap is an open-source, crowdsourced urban accessibility platform designed to catalog, rate, and verify physical and sensory accessibility features for buildings, venues, and public spaces in Cagayan de Oro, Philippines. The platform incorporates:
- **Zero-Cost Open-Source Mapping**: Powered by Leaflet and OpenStreetMap (no paid Google Maps API keys required).
- **Gemini Multimodal AI Storefront Analyzer**: Automatic computer vision inspection of doors, ramps, thresholds, and stairs with strict JSON output.
- **Community Verification Engine**: Dual "Confirm" / "Dispute" consensus voting with automated trust badging.
- **Accessible WCAG AA Design**: Text scaling (`1x`, `1.15x`, `1.3x`), high-contrast dark mode, ARIA live regions, and keyboard-first navigability.

---

## 2. Chronological Progress Log (Hourly Format)

### `2026-11-05 22:55:00` — Project Initialization & Architecture Planning
- **Event**: Core requirements analysis based on prompt specification.
- **Decisions**:
  - Selected Leaflet + OpenStreetMap Carto tiles for zero-cost, open-source cartography without API keys or usage quotas.
  - Selected `gemini-3.8-flash` via `@google/genai` (Node.js Express backend) to avoid client-side API key exposure.
  - Pre-seeded 10 realistic locations across Cagayan de Oro (Centrio Mall, SM CDO Downtown Premier, NMMC Hospital, Xavier University, Cafe Laguna, Cogon Market, etc.) to establish realistic demonstration data.
- **Changes**:
  - Updated `metadata.json` with app title, description, permissions, and `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`.
  - Updated `index.html` with accessibility metadata and Leaflet stylesheet.
  - Configured `package.json` with `"dev": "tsx server.ts"` and `"start": "tsx server.ts"`.

### `2026-11-05 23:15:00` — Server & Gemini AI Multimodal Analyzer
- **Event**: Backend creation and multimodal prompt engineering.
- **Decisions**:
  - Implemented `/server.ts` running Express on port 3000 mounting Vite middleware in dev mode.
  - Created `/src/prompts/storefrontPrompt.ts` with strict system instructions and user prompt constants.
  - Configured `responseSchema` with:
    - `detected_features`: array of `{ tag, confidence, evidence }`
    - `possible_barriers`: array of strings (e.g. stairs, high curbs, narrow turnstiles)
    - `summary`: plain-language assessment
    - `suggested_tags`: standardized tags
  - Built graceful offline / simulation fallback with visual progress indicators.

### `2026-11-05 23:35:00` — Leaflet Map Engine & Community Verification
- **Event**: Interactive mapping, rating color coding, and community consensus logic.
- **Decisions**:
  - Implemented custom SVG pin markers color-coded by accessibility tier:
    - Green (`#059669`): High Accessibility (4.0–5.0★)
    - Yellow (`#d97706`): Moderate Accessibility (2.5–3.9★)
    - Red (`#e11d48`): Low Accessibility / Barriers (< 2.5★)
    - Grey (`#94a3b8`): Unrated / Community Review Pending
  - Implemented community voting logic in `/src/utils/storage.ts`:
    - "Confirm" and "Dispute" counters per tag.
    - Tags with net confirmations >= 2 receive the `Community verified` badge.
    - AI-suggested tags retain the `AI-suggested` badge until verified on-site.
  - Added GPS "Locate Me" tracking and draggable coordinate placement marker.

### `2026-11-05 23:45:00` — UI Reference Adaptation (Main Interface)
- **Event**: Redesigning the main application shell according to `UI_Referrence_8c48ae05.jpg`.
- **Decisions**:
  - Built `/src/components/SidebarRail.tsx`: Far-left vertical icon navigation rail with brand squircle, navigation triggers, and accessibility toggles.
  - Built `/src/components/PlacesPanel.tsx`: Floating / docked sidebar recreating the "Packages" panel with segmented pill control (`[All Places]`, `Verified`, `Barriers`), search input, and tag filter accordion.
  - Redesigned `/src/components/LocationCard.tsx`:
    - **Active Card**: Recreates the expanded `Norra Nynäshamn → Stockholm` card featuring dark border, vivid status badge (`VERIFIED ACCESS`), progress indicator, 4-column metric grid (Category, Score, Distance, Verified Tags), and auditor/contributor profile row.
    - **Inactive Card**: Clean row with subtitle, distance, and status badge.
  - Enhanced `/src/components/MapView.tsx`:
    - Added bold header watermark **"📍 Cagayan de Oro"** matching `📍 Stockholm`.
    - Added `/src/components/MapFloatingCard.tsx`: Floating bottom quick-status card matching the reference UI order card with 5-column metric breakdown.

### `2026-11-06 00:30:00` — OpenStreetMap & Leaflet Layer Switcher Integration
- **Event**: User inquiry regarding OpenStreetMap + Leaflet services.
- **Decisions**:
  - Clarified that AccessMap already runs on 100% free OpenStreetMap & Leaflet with no Google Maps billing.
  - Added interactive **Map Layer Switcher** button in floating map controls with choices:
    1. **OpenStreetMap (Standard)** (official vibrant tiles)
    2. **OpenStreetMap Humanitarian (HOT)** (optimized for infrastructure & accessibility)
    3. **Carto Positron (Clean Light)** (minimalist light gray)
    4. **Carto Dark Matter (High Contrast)** (dark mode style)
  - Added an active service badge on the map: `OpenStreetMap + Leaflet | Free & Active`.

### `2026-11-06 00:45:00` — Form Reference UI Adaptation (`Form_Referrence_e36981fe.jpg`)
- **Event**: Recreating the Add Location Modal according to the user's form reference attachment.
- **Decisions**:
  - Redesigned `/src/components/AddLocationModal.tsx`:
    - **Card Header**: Clean folder icon with bold title `Create New Location` and descriptive subtitle.
    - **Dashed Upload Dropzone**: Recreated file upload rectangle with cloud icon, drag-and-drop trigger, file specifications (`JPG, PNG or PDF, max 10MB`), and thumbnail preview.
    - **2-Column Row**: `Location Name *` and `Category or Date` with calendar/folder icon.
    - **Description Area**: `Description *` multiline text area with subtle border.
    - **Tags Input & Removable Pills**: Input field with `+` action button, displaying removable tag chips with `×` cross buttons (e.g. `[Wheelchair-accessible entrance ×]`, `[Ramp available ×]`).
    - **Members with Access Section**: Dual checkboxes for community link access and public open crowdsourcing.
    - **Footer Buttons**: Clean `Cancel` button alongside solid black `[💾 Save location]` button.

### `2026-11-06 00:50:00` — Domain Tailoring of Add Location Flow to Real Accessibility Workflow
- **Event**: Refined the form reference recreation so that it is tailored directly to AccessMap's physical accessibility purpose rather than generic project management terms.
- **Decisions**:
  - **In-Form AI Vision Trigger**: Uploading a photo to the dashed dropzone immediately provides an interactive **"Scan with AI"** button powered by `gemini-3.8-flash`, parsing entrance doors, stairs, and thresholds, and showing immediate architectural summaries and barrier alerts.
  - **Individual Tag Star Ratings (1–5★)**: Each removable tag pill now includes interactive 1–5 star ratings directly inside the chip, enabling users to rate specific features (e.g., 5★ ramp, 4★ doorway).
  - **Venue Context**: Replaced generic "Project Name" with "Place Name" (e.g., malls, clinics, cafes) and categorized by actual venue types (Shopping, Dining, Healthcare, Education, Public Space).
  - **Live GPS Sync**: Added real-time coordinates bar with one-click **"Locate Me (GPS)"** synchronization.
  - **Community Verification Agreement**: Tailored permissions to community dispute and confirmation consensus on the Cagayan de Oro map.

### `2026-11-06 17:15:00` — Dependency Conflict Resolution & Environment Setup
- **Event**: Resolved npm dependency resolution failure (`ERESOLVE`) on fresh install.
- **Decisions & Fixes**:
  - Diagnosed that `package.json` had pinned `esbuild: "^0.25.0"` whereas `vite: "^8.3.0"` had an optional peer requirement of `esbuild: "^0.27.0 || ^0.28.0"`, causing npm 10+ to abort installation.
  - Updated `package.json` devDependencies to `"esbuild": "^0.28.0"`.
  - Audited transitive deprecation warning (`node-domexception@1.0.0` from `@google/genai -> google-auth-library -> gaxios -> node-fetch -> fetch-blob`) confirming it is non-blocking informational notice with zero vulnerabilities.
  - Executed successful `npm install` establishing full `node_modules` and TypeScript compiler definitions.

### `2026-11-06 17:25:00` — Modular Component Reconstruction & UI Primitives
- **Event**: Re-constructed all monolithic component files (500+ lines each) into single-responsibility sub-components and shared UI primitives.
- **Decisions & Implementation**:
  - **Created Shared UI Primitives (`/src/components/ui/`)**:
    - `Modal.tsx`: Accessible dialog wrapper with backdrop blur, ESC key dismiss, focus trapping, and header/footer slots.
    - `StarRating.tsx`: 1–5 star rating supporting interactive selection, read-only display, customizable sizes (`sm`, `md`, `lg`), and label formatting.
    - `Badge.tsx`: Design-system badges (`verified`, `ai-suggested`, `barrier`, `neutral`, `category`) with unified styling and icons.
    - `PhotoUploader.tsx`: File upload dropzone with thumbnail preview, removal, and base64 data URL conversion.
  - **Reconstructed `AddLocationModal.tsx` (571 lines ➔ 239 lines)**:
    - Sub-components extracted to `/src/components/add-location/`:
      - `CoordinatesField.tsx`: GPS geolocation detection, coordinates badge, and map dragging helper.
      - `PlaceInfoFields.tsx`: Place name, category dropdown, and address/landmark inputs.
      - `TagRatingSection.tsx`: Chip toggles, custom tag addition, and per-feature star ratings.
      - `ReviewDetailsSection.tsx`: Overall star rating, author name, review comment, and photo upload.
  - **Reconstructed `AIStorefrontModal.tsx` (560 lines ➔ 216 lines)**:
    - Sub-components extracted to `/src/components/storefront/`:
      - `PhotoInputSection.tsx`: Drag-and-drop upload, preset sample storefront quick picker (`SAMPLE_STOREFRONTS`), and photo preview with analysis trigger.
      - `AnalysisResultsSection.tsx`: Architectural assessment summary, confidence progress bars with visual evidence, identified physical obstacles alert box, accepted/rejected tag checklists, and target location selector.
  - **Reconstructed `LocationDetailDrawer.tsx` (562 lines ➔ 166 lines)**:
    - Sub-components extracted to `/src/components/location-detail/`:
      - `LocationOverviewCard.tsx`: Photo preview, address/directions link, and overall accessibility score banner.
      - `AiAnalysisSection.tsx`: Gemini Vision assessment and reported physical obstacles.
      - `TagVotingList.tsx`: Community verification list with "Confirm" / "Dispute" voting buttons and badge styling.
      - `ReviewSection.tsx`: User review history and review submission form with feature ratings.
  - **Refactored `LocationCard.tsx` & `MapFloatingCard.tsx`**:
    - Standardized on the shared `Badge` primitive.
    - Removed unused imports (`Layers`, `Search`, `MessageSquare`, `User`, `getTagIcon`, `ShieldCheck`) and tightened TypeScript typing.
  - **Verification**:
    - `npm run lint` (`tsc --noEmit`): **0 errors** across the entire workspace.
    - `npm run build` (`vite build`): Full production client build generated in `dist/` in **733ms**.
    - Local server startup validated with `npm run start` (`tsx server.ts` Express + Vite middleware on port 3000).

### `2026-11-07 14:40:00` — Crowdsourced Accessibility Map Official Logo Integration
- **Event**: Integrated custom origami folded-map and location pin logo brand assets across the application.
- **Decisions & Implementation**:
  - **Asset Extraction & Generation**:
    - Extracted and processed the brand logo from the user's provided artwork.
    - Generated high-resolution transparent assets:
      - `public/logo-dark.png` & `public/logo.png`: Dark charcoal (`#1e293b`) vector-clean mark on transparent background.
      - `public/logo-white.png`: Clean crisp pure-white mark for dark squircle / sidebar backgrounds.
      - `public/logo-original.jpg`: Original artwork preserved in full fidelity.
      - `public/favicon-32x32.png` & `public/favicon.png`: Crisp 32x32 and 64x64 browser tabs favicons.
      - `public/app-icon.png`: 512x512 PWA / Open Graph / Apple Touch application icon.
  - **Component Integration**:
    - Created reusable `src/components/ui/AppLogo.tsx` supporting `dark`, `light`, `original`, and `squircle` branding variants with responsive brand text.
    - Updated `SidebarRail.tsx` top brand button: Replaced generic Accessibility icon with the official white brand mark inside the dark rounded squircle with hover animation.
    - Updated `Navbar.tsx` brand header: Updated logo icon container with the official white brand mark.
    - Updated `MapView.tsx`: Enhanced the city header watermark badge to feature the official logo mark.
    - Updated `index.html`: Added 32x32/16x16 favicon links, Apple touch icon, and Open Graph image tags.

### `2026-11-09 09:45:00` — Server Components Decoupling & Pure Frontend SPA Architecture
- **Event**: Decommissioned backend server layer (`server.ts`) in favor of a 100% static client-side single page application (SPA), preserving GitHub Actions workflows and all frontend components.
- **Decisions & Implementation**:
  - **Server Code & Dependencies Removal**:
    - Removed `server.ts` Express server file and server-only dependencies (`express`, `@types/express`, `dotenv`, `tsx`, `@google/genai`) from `package.json`.
    - Streamlined npm scripts to standard Vite commands: `"dev": "vite"`, `"build": "vite build"`, `"preview": "vite preview"`.
  - **Client-Side AI Storefront Simulation**:
    - Extracted storefront multimodal AI inspection logic into `src/utils/storefrontAnalysis.ts`, eliminating backend endpoint dependency (`/api/analyze-storefront`) and allowing instant previewing in static hosting environments.
  - **Relative Asset Paths (`base: './'`) for Portable Previews**:
    - Configured `base: './'` in `vite.config.ts` so production assets (`dist/index.html`) resolve with relative URLs (`./assets/...`), allowing seamless previewing via VS Code Live Server, GitHub Pages, or subfolder static servers without root path 404s.
  - **Workflow Preservation**:
    - Preserved existing `.github/workflows` sync pipelines (`sync-frontend-arch-to-main.yml` and `sync-main-to-frontend-arch.yml`).

### `2026-11-09 10:35:00` — Neo-Brutalist Collapsible Sidebar Navigation Layout Implementation
- **Event**: Implemented a modern neo-brutalist collapsible sidebar navigation inspired by `sidebar.html`.
- **Decisions & Implementation**:
  - **Typography & Visual Tokens**:
    - Integrated Google Font **Space Grotesk** (`400`, `500`, `600`, `700`) into `index.html` and `src/index.css`.
    - Applied custom color palette: Deep Forest Teal (`#21524B`), Mint highlight (`#E7F2F0`), Dark Ink borders (`#0F172A`, 1.5px with `0 2px 0` shadows), and Soft slate (`#475569`).
  - **Collapsible Navigation Rail**:
    - Dynamic expansion between 248px (full mode) and 68px (compact icon mode) with state toggling.
    - Included official vector SVG symbol sprite definitions matching the exact stroke radius and geometry.
  - **Sections & Features**:
    - **Header**: Official origami pin logo squircle badge with brand title and collapse toggle.
    - **Workspace Card**: "My workspace / Alex David" with user avatar (`AD`) and chevron indicator.
    - **Primary Tabs**: `Community` with green `BETA` badge, `Dashboard`, and `Messages`.
    - **Identity Section**: `Profile`, `Saved places`, and `Contribution history`.
    - **Explore Section**: `Map view`, `AI vision`, and `Add place`.
    - **Settings Section**: `Tags & badges` and `Filter settings`.
    - **Promo Footer**: "Invite a mapper · Bring neighbors in to verify places" with copy-to-clipboard action and visual feedback.

### `2026-11-09 10:48:00` — Sidebar Icon-Buttons Cleanup & Streamlined Settings Footer
- **Event**: Removed the utility icon-buttons row (`T` text size scaling, `Eye` high contrast mode, and `Refresh` seed data reset) from the sidebar footer per design alignment with `sidebar.html`.
- **Decisions & Implementation**:
  - Removed the bottom utility button container and unneeded SVG symbols (`#i-type`, `#i-eye`, `#i-refresh`) from `src/components/SidebarRail.tsx`.
  - Streamlined `SidebarRail.tsx` imports and component props, maintaining high performance and zero lint warnings.
  - Re-verified full project compilation with `npm run lint` (`0` errors) and `npm run build` (**633ms**).

---

## 3. Architecture & File Structure

```
├── .env.example                          # Environment variable template
├── Documentation.md                      # Comprehensive progress log & hourly documentation
├── index.html                            # HTML entry point with Space Grotesk, Leaflet styles & meta tags
├── metadata.json                         # Project metadata and server capabilities
├── package.json                          # Dependencies & Vite build scripts
├── package-lock.json                     # Locked dependency tree
├── sidebar.html                          # Reference neo-brutalist sidebar template
├── tsconfig.json                         # TypeScript configuration
├── vite.config.ts                        # Vite configuration with relative base and ESM path resolution
└── src/
    ├── App.tsx                           # Master application shell & state coordinator
    ├── index.css                         # Global CSS, Space Grotesk tokens & Leaflet styles
    ├── main.tsx                          # React entry point
    ├── components/
    │   ├── AddLocationModal.tsx          # Reconstructed modular Add Location dialog
    │   ├── AIStorefrontModal.tsx         # Reconstructed multimodal Gemini storefront scanner
    │   ├── FilterBar.tsx                 # Search & multi-tag filter component (legacy desktop)
    │   ├── LocationCard.tsx              # Card component with active/inactive visual states
    │   ├── LocationDetailDrawer.tsx      # Slideout panel for reviews & community voting
    │   ├── MapFloatingCard.tsx           # Floating bottom summary card matching reference
    │   ├── MapView.tsx                   # Leaflet map with OpenStreetMap layer switcher
    │   ├── Navbar.tsx                    # Top navigation & view switcher (legacy desktop)
    │   ├── PlacesPanel.tsx               # Left docked places panel with segmented pill control
    │   ├── SidebarRail.tsx               # Neo-brutalist collapsible primary navigation rail
    │   ├── ui/                           # Shared foundational UI primitives
    │   │   ├── AppLogo.tsx               # Official origami map and pin logo variants
    │   │   ├── Badge.tsx                 # Standardized status badges (verified, AI, barrier)
    │   │   ├── Modal.tsx                 # Accessible dialog wrapper with backdrop and ESC handler
    │   │   ├── PhotoUploader.tsx         # Photo dropzone with preview and base64 parsing
    │   │   └── StarRating.tsx            # Interactive & read-only 1–5 star ratings
    │   ├── add-location/                 # Sub-components for AddLocationModal
    │   │   ├── CoordinatesField.tsx      # GPS geolocation detection and coordinate badge
    │   │   ├── PlaceInfoFields.tsx       # Venue name, category, and address inputs
    │   │   ├── ReviewDetailsSection.tsx  # Overall rating, author, notes, and photo attachment
    │   │   └── TagRatingSection.tsx      # Tag chips, custom tag input, and feature ratings
    │   ├── storefront/                   # Sub-components for AIStorefrontModal
    │   │   ├── AnalysisResultsSection.tsx# AI assessment, confidence gauges, and tag acceptance
    │   │   └── PhotoInputSection.tsx     # File upload, test storefront samples, and preview
    │   └── location-detail/              # Sub-components for LocationDetailDrawer
    │       ├── AiAnalysisSection.tsx     # AI assessment card and reported barriers
    │       ├── LocationOverviewCard.tsx  # Photo, address, directions link, and score card
    │       ├── ReviewSection.tsx         # Community review list and submit review form
    │       └── TagVotingList.tsx         # Tag verification list with confirm/dispute voting
    ├── context/
    │   └── A11yContext.tsx               # Text scale, high-contrast, & screen-reader live region
    ├── data/
    │   └── initialLocations.ts           # 10 pre-seeded Cagayan de Oro venues & test storefronts
    ├── prompts/
    │   └── storefrontPrompt.ts           # Standard accessibility tags & Gemini prompt constant
    ├── types/
    │   └── accessibility.ts              # TypeScript interfaces for pins, tags, reviews & AI
    └── utils/
        ├── storage.ts                    # LocalStorage persistence, color coding & distance
        └── tagHelpers.tsx                # Tag Lucide icon mapping
```

---

## 4. Key Functional Specifications

### 4.1 Accessibility Tags
1. `Wheelchair-accessible entrance`
2. `Ramp available`
3. `Accessible restroom`
4. `Quiet / low-sensory zone`
5. `Braille menu / signage`
6. `Elevator access`
7. `Wide aisles / pathways`
8. `Accessible parking`
9. `Staff trained in assistance`
10. Custom community-suggested tags

### 4.2 AI Storefront Analysis Schema
- Endpoint: `POST /api/analyze-storefront`
- Model: `gemini-3.8-flash`
- Payload: Base64 data or remote image URL
- Output JSON Schema:
```json
{
  "detected_features": [
    {
      "tag": "Wheelchair-accessible entrance",
      "confidence": 0.94,
      "evidence": "Visual inspection shows wide double entry doors with zero-threshold ground clearance."
    }
  ],
  "possible_barriers": [
    "Exterior pavement shows mild surface wear; check for slip hazards during rain."
  ],
  "summary": "Storefront exhibits strong physical accessibility with step-free entrance and visible ramp access.",
  "suggested_tags": [
    "Wheelchair-accessible entrance",
    "Ramp available"
  ]
}
```

---

## 5. Summary of Completed Milestones

- [x] Initial full-stack scaffolding with Express and Vite.
- [x] Free OpenStreetMap + Leaflet integration centered on Cagayan de Oro.
- [x] Multimodal Gemini Storefront Analyzer with strict JSON output and sample photos.
- [x] Community verification ("Confirm" / "Dispute") and dynamic trust badges.
- [x] Mobile-responsive UI adapted from `UI_Referrence_8c48ae05.jpg`.
- [x] Map Layer Switcher for OpenStreetMap Standard, Humanitarian, Carto Positron, and Dark Matter.
- [x] Add Location Form adapted from `Form_Referrence_e36981fe.jpg`.
- [x] Resolved npm `esbuild` peer dependency conflict with Vite.
- [x] Modular reconstruction of monolithic components into `/src/components/ui/`, `/add-location/`, `/storefront/`, and `/location-detail/`.
- [x] Standardized UI primitives (`Modal`, `StarRating`, `Badge`, `PhotoUploader`).
- [x] Official origami map & pin logo assets generated and integrated across Sidebar, Navbar, Map, and HTML Favicon.
- [x] Decoupled backend Express server (`server.ts`) to enable pure static SPA hosting with GitHub workflows preserved.
- [x] Configured relative base paths (`base: './'`) in Vite for portable local and web previews.
- [x] Implemented neo-brutalist collapsible sidebar navigation with Space Grotesk typography and SVG vector sprites (`sidebar.html`).
- [x] Streamlined sidebar footer by removing redundant accessibility icon buttons (`T`, `Eye`, `Refresh`) for a cleaner design.
- [x] Full compilation and zero-error TypeScript linting (`tsc --noEmit`).
- [x] Verified fast production bundle build (`vite build` in 633ms).

---

## `2026-11-11 09:00:00` — Project Overview Refinement
- **Event**: Updated README with concise project details and vision statement.
- **Decisions**:
  - Added clear Vision, Target Audience, Core Values, and Stakeholder sections to improve onboarding.
  - Streamlined introductory description for brevity and impact.
- **Impact**: Improves first‑time reader comprehension and aligns documentation with project goals.

---

## `2026-11-14 07:40:00` — Consolidated Single Top Menu Bar
- **Event**: Merged multi-layer top headers for embedded sibling pages into one unified top menu row.
- **Decisions**:
  - Combined `Back to Map`, Page Title & Subtitle, `Report a barrier`, `+ Add a place`, `Messages`, `Notifications`, `External Repo Linked` badge, and `Open Fullscreen` into a single neo-brutalist header bar in `src/App.tsx`.
  - Suppressed duplicate `<header class="top">` inside active embedded prototypes and added dynamic iframe onload style injection.
  - Linked header actions (`Report a barrier`, `Add a place`) directly to prototype dialogs and toast alerts with fallback to parent modal controls.
- **Impact**: Eliminates redundant stacked header rows across prototype views, saving vertical screen real estate and creating a clean, unified user interface.

---

## `2026-11-14 11:15:00` — Removed Floating Bottom Summary Card
- **Event**: Removed `MapFloatingCard` overlay from the interactive map view.
- **Decisions**:
  - Unmounted `MapFloatingCard` and cleaned up unused `showSummaryCard` state and handlers in `src/components/MapView.tsx`.
  - Kept location selection and search navigation directly delegated to the collapsible `PlacesPanel` and `LocationDetailDrawer`.
- **Impact**: Removes the large card obscuring the bottom map area and preventing visual clutter during map navigation.
