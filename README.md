# AccessMap

> **AccessMap** – An accessibility‑first navigation and community platform for Mindanao, helping everyone find step‑free routes, accessible places, and community support.

---

## Project Details

- **Vision**: Empower people with mobility challenges to navigate urban environments confidently and safely.
- **Target Audience**: Residents and visitors of Mindanao seeking accessible routes, venue owners wanting to showcase accessibility, and community volunteers verifying data.
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
- [Documentation](#documentation)
- [License](#license)

---

## About

AccessMap is a web application focused on accessible navigation and community engagement. It combines an interactive map with step-free route planning, saved places, contribution history, a community leaderboard, messaging, and accessibility resources — all wrapped in a neo-brutalist UI.

## Features

- Interactive map with spatial marker clustering, category-aware animated pins, and proximity radar.
- Step-free route planning with live OSRM accessible route preview.
- Mindanao city viewport switcher.
- Saved places and contribution history tracking.
- Community leaderboard and messaging.
- Sign-in / registration portal.
- Accessibility statement and help resources.
- Neo-brutalist, responsive navigation banner with back-to-map and fullscreen controls.

## Modules / Pages

| Module | Description |
|---|---|
| AccessMap (main) | Vite + React host app, sidebar, prototype mounting. |
| Interactive Map Page | Map engine, markers, routing, viewport switcher. |
| Step-Free Route Planner Page | Accessible route planning UI. |
| Saved Places Page | Saved locations management. |
| Contribution History Page | User contribution log. |
| Community Leaderboard Page | Community rankings. |
| Landing Page | Marketing / portal entry. |
| Sign-in Page | Authentication UI. |
| Profile / Account Page | User profile and account settings. |
| Help / Accessibility Statement Page | Accessibility resources. |
| Messages Page | In-app messaging. |

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** CSS (neo-brutalist theme), Tailwind (where applicable)
- **Mapping / Routing:** OSRM, SVG pins, spatial clustering
- **Tooling:** Git (multi-repo), ESLint/TypeScript

## Getting Started

### Prerequisites

- Node.js (LTS)
- npm / pnpm
- Git

### Installation

```bash
# Clone the main repository
git clone https://github.com/David-Py24/AccessMap-.git
cd AccessMap

# Install dependencies
npm install

# Run the dev server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values (see `.env.example`).

## Project Structure

```
AcessMap/
├── AccessMap/                       # Main Vite + React app
├── AccessMap-Interactive-Map-Page/   # Map module
├── AccessMap-Step-Free-Route-Planner-Page/
├── AccessMap-Saved-Places-Page/
├── AccessMap-Contribution-History-Page/
├── AccessMap-Community-Leaderboard-Page/
├── AccessMap-Landiing-Page/
├── AccessMap-Help-Accessibility-Statement-Page/
├── Assets/                          # Brand assets & references
├── Documentation-Main.md            # Progress / changelog log
├── RepoHub.md                       # Git activity ledger
└── .agents/                         # Workspace governance & memory
```

## Development Workflow

- Each module may have its own Git history and branch — identify the owning repo before editing.
- Keep changes scoped to the requested module; preserve existing UI/behavior elsewhere.
- Record durable decisions in `.agents/memory/decisions.md`.
- Log progress in `Documentation-Main.md`.

## Backend & Database Collaboration

- The default `main` branch contains the integrated frontend host app and is the base for backend/database work.
- Page modules are tracked as separate `feature/*` branches and sibling repositories; they are not automatically merged into `main`.
- To add backend or database features, branch from `main`:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b feature/backend-<name>
  ```
- Push your branch to `origin` (`https://github.com/David-Py24/AccessMap-.git`) and open a pull request targeting `main`.
- Keep frontend module changes in their owning repository/branch, then integrate through pull requests.
- Do not commit secrets or credentials; use `.env.example` for variable names.

## Contributing

1. Create a feature branch per module.
2. Keep commits scoped and descriptive.
3. Run TypeScript checks and a production build before submitting.
4. Update documentation for any structural change.

## Documentation

- [Documentation-Main.md](Documentation-Main.md) — dated progress/changelog.
- [RepoHub.md](RepoHub.md) — workspace Git activity ledger.
- Per-module `README.md` and `Documentation.md` files.

## License

TBD.
