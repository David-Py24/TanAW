# Documentation

## Progress - 2026-11-08 22:18:19 (+08:00)
- Added major internal folders: `Src/`, `Github/`, `Docs/`, `Backups/`, `Assets/`.

## Progress - 2026-11-08 23:34:10 (+08:00)
- **Background Redesign (Profile & Account Pages)**:
  - Removed legacy mountain clipart scene (`.scene` with SVG mountain silhouettes, water, and terrain paths) from `Src/Profile Settings.html` and `Src/Profile & account (1).html`.
  - Replaced background with a clean white base (`--bg: #FFFFFF;`) and integrated the motion texture grid system referred from `Src/AccessMap.html`:
    - `.bg-noise`: Micro-texture fractal noise overlay with SVG turbulence filter.
    - `.bg-grid-drift`: Multi-scale coordinate grid pattern with radial points and grid lines animated via `gridDrift`.
    - `.bg-topo-drift`: Smooth topographic contour vectors animated via `topoFloat`.
    - `.bg-orb`: Subtle luminous ambient gradient orbs (`orb-1`, `orb-2`, `orb-3`).
    - `.bg-radar-ring`: Concentric pulsing radar rings (`ring-1`, `ring-2`).
  - Redesigned the card header banner (`.cover`) in `Src/Profile Settings.html` to replace the mountain SVG clipart with a soft gradient (`--soft` to `--accent-light`), fine grid overlay (`.cover-grid`), and subtle dashed topographic elevation curves matching the AccessMap design system.
  - Maintained accessibility compliance with `prefers-reduced-motion: reduce` across all background and card animation layers.

## Progress - 2026-11-08 23:45:21 (+08:00)
- **Theme Standardization**:
  - Removed dark mode media queries (`@media (prefers-color-scheme: dark)`) and `[data-theme="dark"]` overrides from `Src/Profile Settings.html` and `Src/Profile & account (1).html`.
  - Established light mode as the default and only active theme across the profile and account pages, ensuring full aesthetic consistency with `Src/AccessMap.html`.

## Progress - 2026-11-09 00:07:30 (+08:00)
- **AccessMap Metrics & Contributor Profile Alignment**:
  - Replaced e-commerce placeholder stats (`First seen`, `First purchase`, `Revenue`, `MRR`) with core AccessMap community contributions:
    - **Location pins**: 148
    - **Saved routes**: 24
    - **AI storefront scans**: 86
    - **Verified tags**: 312
  - Transformed Public Profile fields to align with the AccessMap app ecosystem:
    - **Contributor Identity**: `accessmap.org/@{slug}` handle with real-time lowercase slug formatting.
    - **Navigation Mode**: Routing preference selector supporting Step-Free (Wheelchair/Stroller), Low Incline & Ramps, Tactile Paving, and Sensory Quiet Transit.
    - **Mapping Focus**: Community mapping area and priority tags input (e.g., Downtown CDO ramps & auto-doors).
  - Refactored settings toggles to reflect mapping features: public contributor leaderboard visibility, offline route & map tile cache management, and multi-device active sessions (Mobile & PC suite).
  - Synchronized form validation, state management, and toast notifications across `Src/Profile Settings.html` and `Src/Profile & account (1).html`.
