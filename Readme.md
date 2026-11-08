# AccessMap SaaS 🗺️♿

> **Local crowdsourced accessibility mapping platform powered by computer vision AI storefront auditing.**

AccessMap enables communities, wheelchair users, parents with strollers, and urban planners to pin, rate, and verify real-world locations based on granular accessibility tags. With an embedded AI vision engine, users can snap storefront entrance photos to instantly audit ramp grades, door widths, steps, and threshold obstacles.

---

## ✨ Features

- **📍 Crowdsourced Accessibility Pins**: Pin places with 40+ granular tags (zero-step entry, tactile paving, automatic door openers, wide ADA restrooms, elevator statuses).
- **👁️ Computer Vision Storefront Auditing**: Point your mobile camera at any entrance to identify steps, measure door clearance, and estimate ramp slopes in seconds.
- **💻 Desktop PC Analytical Suite**: Comprehensive GIS dashboard inspired by OpenStreetMap and Leaflet (featuring the Cagayan de Oro pilot atlas), enabling municipal planners to review audits, filter barrier reports, and export GeoJSON datasets.
- **📱 On-The-Go Mobile Navigation**: Resized, tall mobile UI with floating search, turn-by-turn step-free routing, and quick photo-pin submissions.
- **🎨 Dark Teal Design System (`#21524B`)**: Neo-brutalist high-contrast styling meeting WCAG AAA color contrast standards.
- **🌊 Ambient Motion Texture**: Multi-layered background motion featuring GIS coordinate grid drift, topographic elevation contours, and subtle luminous glowing orbs.

---

## 📁 Project Structure

```text
AccessMap-Landiing-Page/
├── assets/                               # Media, imagery, and dashboard reference previews
│   └── cdo-map-dashboard-preview.jpg     # Cagayan de Oro OpenStreetMap Leaflet interface preview
├── backup/                               # Legacy templates and safe rollback backups
├── Docs/                                 # Architectural specifications and project records
├── SRC/                                  # Component and standalone page sources
│   ├── AccessMap.html                    # Source implementation of AccessMap landing page
│   └── Spectra.html                      # Source mirror
├── .gitignore                            # Git ignore configuration
├── AccessMap.md                          # Project core definition and requirements
├── Changes.md                            # Standardized change log adhering to documentation template
├── Documentation Template (Structure).md # Documentation standard specification
├── index.html                            # Root deployment entry-point for web hosts
└── Readme.md                             # Main project documentation
```

---

## 🚀 Getting Started

No build tooling or package managers (`npm`/`yarn`) are required. AccessMap is built with pure, modern HTML5 and CSS3 for instant rendering and maximum compatibility.

### Running Locally

1. **Directly in Browser**:
   Double click [`index.html`](./index.html) or open it with any modern web browser.

2. **Using VS Code Live Server**:
   Right-click `index.html` and choose **"Open with Live Server"**.

3. **Using Python Local Server**:
   ```bash
   python -m http.server 3000
   ```
   Navigate to `http://127.0.0.1:3000` in your browser.

4. **Using Node / npx**:
   ```bash
   npx serve .
   ```

---

## 🎨 Color Palette & Design System

| Token | Hex Value | Usage |
|---|---|---|
| `--accent` | `#21524B` | Primary Dark Teal Brand Color (Buttons, active pins, badges) |
| `--accent-hover` | `#2B6860` | Interactive hover state |
| `--accent-deep` | `#13332E` | Deep pine teal for strong typographic emphasis |
| `--accent-light` | `#E7F2F0` | Soft mist teal for tag and badge backgrounds |
| `--ink` | `#0F172A` | Slate dark black for headings and body copy |
| `--bg` | `#F5FAFD` | Crisp soft canvas background |
| `--line` | `#0F172A` | Neo-brutalist 1.8px high-contrast structural borders |

---

## 🛠️ Tech Stack

- **Markup**: Semantic HTML5 (ARIA attributes, accessible landmark roles)
- **Styling**: Modern CSS3 (CSS Variables, Flexbox, CSS Grid, Keyframe Animations, `@media (prefers-reduced-motion)`)
- **Typography**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) via Google Fonts
- **Cartography**: OpenStreetMap & Leaflet vector interface styling

---

## 📄 Documentation

For full details on recent architectural changes, technical decisions, and rollout history, refer to:
- [`Changes.md`](./Changes.md)
- [`Documentation Template (Structure).md`](./Documentation%20Template%20(Structure).md)

---

## ⚖️ License

MIT License. Open and free for universal accessibility advocates, developers, and civic organizations.

