# TanAW

> **TanAW** – An accessibility‑first navigation and community platform for Iligan City and across Mindanao, helping everyone find step‑free routes, accessible places, and community support.

**Project Deployment Link:** [https://tanaw1.vercel.app/](https://tanaw1.vercel.app/)

---

## Project Details

- **Project Deployment Link**: https://tanaw1.vercel.app/
- **Vision**: Empower people with mobility challenges to navigate urban environments confidently and safely.
- **Target Audience**: Residents and visitors of Iligan City and across Mindanao seeking accessible routes, venue owners wanting to showcase accessibility, and community volunteers verifying data.
- **Core Values**: Open‑source, zero‑cost mapping, privacy‑by‑design, community‑driven verification, and inclusive design.
- **Key Stakeholders**: End‑users, local accessibility NGOs, city planners, and the open‑source contributor community.

---

> An accessibility-first navigation and community platform for Mindanao — helping everyone find step-free routes, accessible places, and community support.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Modules / Pages](#modules--pages)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Contributing](#contributing)
- [License](#license)

---

## About

**TanAW** (*meaning "to see / look closely" in Bisaya*) is a web application focused on accessible navigation and community engagement. It combines an interactive map with step-free route planning, AI storefront accessibility scanning, saved places, contribution history, a community leaderboard, messaging, and accessibility settings (Dark Mode & Text Scale).

## Features

- Interactive map with category-aware accessibility pins (`Accessible`, `Partial`, `Not Accessible`), live geolocation, and place search.
- AI Storefront Accessibility Scanner powered by Google Gemini 2.5 Flash Vision to automatically detect ramps, steps, door widths, and obstacles from storefront photos.
- Step-free route and venue discovery across Iligan City and Mindanao.
- Saved places and personal contribution history tracking.
- Community leaderboard, live activity feed, and local mapper messaging.
- Sign-in / registration anti-trolling verification gate.
- Built-in Dark Mode and Large Text (`100%` / `115%` / `125%`) accessibility toolbar.

## Modules / Pages

| Module | Description |
|---|---|
| `AuthGatePage` | Sign-in and account registration gate for verified community contributions. |
| `MapView` & `PlacesPanel` | Interactive Leaflet map engine, category/status filters, and synchronized places directory. |
| `StorefrontScannerModal` | AI storefront image analyzer for instant accessibility feature detection. |
| `AddLocationModal` | Guided 2-step modal for pinning and submitting new accessible places with compressed photos. |
| `LocationDetailDrawer` | Detailed venue breakdown with verified checklist, photo gallery, and community reviews. |
| `CommunityView` | Live community stats, Top Verified Mappers leaderboard, and recent reports. |
| `ProfileHubView` | Unified user hub for Account Settings, Contributions, Saved Places, and Community Messages. |

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6
- **Styling:** Tailwind CSS v4, Lucide React icons, custom Dark Mode & font-scaling CSS
- **Mapping:** Leaflet, React-Leaflet, OpenStreetMap tiles
- **AI & Cloud:** Google Gemini 2.5 Flash (`@google/genai`), Firebase Firestore & Storage
- **Deployment:** Vercel ([https://tanaw1.vercel.app/](https://tanaw1.vercel.app/)) & GitHub Actions

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/dxctypee/TanAW.git
cd TanAW

# Install dependencies
npm install

# Run the dev server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values (such as `VITE_GEMINI_API_KEY` and Firebase configuration keys).

## Project Structure

```
TanAW/
├── src/
│   ├── components/         # MapView, PlacesPanel, CommunityView, ProfileHubView, AuthGatePage, etc.
│   ├── context/            # A11yContext (Dark Mode & Text Scaling)
│   ├── data/               # Seed locations and Mindanao venue data
│   ├── prompts/            # Gemini AI storefront analysis prompt
│   ├── services/           # Firebase Firestore & Storage location services
│   ├── utils/              # Local storage, auth, and client-side image compression
│   ├── App.tsx             # Main application shell
│   └── main.tsx            # Entry point
├── functions/              # Firebase Cloud Functions
├── index.html
└── package.json
```

## Development Workflow

- Branch from `first-rev` or `main` for feature updates.
- Keep commits scoped and descriptive.
- Run `npm run lint` and `npm run build` before pushing changes.
- Do not commit secrets or credentials; use `.env.example` for variable names.

## Contributing

1. Create a feature branch (`git checkout -b feature/<name>`).
2. Keep commits scoped and descriptive.
3. Run TypeScript checks (`npm run lint`) and a production build (`npm run build`) before submitting.
4. Open a Pull Request targeting the main repository branch.

## License

MIT / Open Source.
