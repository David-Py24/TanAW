# AccessMap - Interactive Map Page

Dedicated, isolated repository for the **Interactive Map Engine** of the AccessMap platform.

## Overview

This repository isolates the Leaflet + OpenStreetMap spatial cartography, multi-layer switcher, coordinate bounds, GPS geolocation, and accessibility marker rendering. By keeping the map engine in this standalone repository, GIS features, tile providers, and visual pins can be developed, tested, and upgraded without introducing regressions to the primary `AccessMap` application.

## Key Features

- **Zero-Cost Open Cartography**: Runs completely on OpenStreetMap and Carto basemaps without requiring paid Google Maps billing or API keys.
- **Layer Switcher**:
  - `osm`: Standard OpenStreetMap (official vibrant street tiles)
  - `hot`: OpenStreetMap Humanitarian (HOT) (optimized for infrastructure & accessibility)
  - `dark`: Carto Dark Matter (high-contrast dark mode)
  - `positron`: Carto Positron (clean minimalist light mode)
- **Accessibility Color Tiers**:
  - 🟢 **Green** (`#10B981`): High Accessibility (4.0–5.0★)
  - 🟡 **Amber** (`#F59E0B`): Moderate Accessibility (2.5–3.9★)
  - 🔴 **Rose** (`#F43F5E`): Low Accessibility / Barriers (< 2.5★)
- **Regional Mindanao & CDO Coverage**: Includes default center bounds for Mindanao (`[7.5, 125.0]`) and deep urban points of interest for Cagayan de Oro and Davao City.

## Repository Structure

```text
AccessMap-Interactive-Map-Page/
├── Assets/                 # Official logos, pins, and imagery
├── Backups/                # Archive snapshots
├── Docs/                   # Mapping specifications and API docs
├── Github/                 # Issue templates and workflows
├── Src/
│   ├── components/         # React MapView, MapFloatingCard, and badges
│   ├── data/               # Mindanao & CDO location datasets
│   ├── types/              # TypeScript GIS & accessibility interfaces
│   └── utils/              # Color rating & distance calculation helpers
├── Documentation.md        # Comprehensive progress log
├── README.md               # Overview and developer guide
└── index.html              # Standalone interactive browser preview
```

## Running the Standalone Preview

You can open `index.html` directly in any modern web browser to interact with the map, switch layers, test zoom levels, and inspect markers without running a dev server or installing node dependencies.

## Fetching Updates into Main `AccessMap`

To sync changes made in this repository into the main `AccessMap` project:

```bash
# Inside the main AccessMap folder:
# Add this repo as a remote if desired:
git remote add map-page ../AccessMap-Interactive-Map-Page

# Fetch changes:
git fetch map-page

# Merge into your working branch:
git merge map-page/main --allow-unrelated-histories
```
