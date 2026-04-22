# SOMA — Satellite Orbit Monitoring Application

<p align="center">
  <img src="docs/logo/soma.png" width="30%" />
</p>

<p align="center">
  <a href="https://github.com/dan1elw/SOMA/releases/latest"><img src="https://img.shields.io/github/v/release/dan1elw/SOMA" alt="Latest Release"></a>
  <a href="https://github.com/dan1elw/SOMA/actions/workflows/ci.yml"><img src="https://github.com/dan1elw/SOMA/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/dan1elw/SOMA/actions/workflows/deploy.yml"><img src="https://github.com/dan1elw/SOMA/actions/workflows/deploy.yml/badge.svg" alt="Deploy"></a>
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT">
  <img src="https://img.shields.io/badge/PWA-ready-purple" alt="PWA">
  <a href="https://dan1elw.github.io/SOMA/"><img src="https://img.shields.io/badge/live-GitHub%20Pages-0a66c2" alt="Live on GitHub Pages"></a>
</p>

SOMA is a browser-based application that tracks satellites live on a dark world map — including their ground track from the last 90 minutes. Open the page and you immediately see the International Space Station (ISS) orbiting at roughly 28,000 km/h. Use the search bar to add more satellites: the Hubble Space Telescope, Starlink birds, or any of the ~11,000 active objects currently in orbit.

## What makes SOMA different

- **Runs entirely in the browser.** No account, no installation, no server. All calculations happen locally on your device.
- **Works offline.** Once loaded, SOMA keeps working without an internet connection, using the last known orbital data.
- **No trackers, no cookies.** Your data never leaves the browser.
- **Clarity over clutter.** SOMA shows a focused set of satellites beautifully rather than overwhelming you with thousands at once.

## How it works

A satellite doesn't drift randomly — its path follows the laws of orbital mechanics and can be calculated from a small set of numbers called **orbital elements**: altitude, inclination, velocity, and position at a reference time. With these numbers, you can compute where the satellite will be one second, one minute, or one hour from now.

SOMA fetches orbital elements from **CelesTrak** — a long-established public service that processes data from the US Space Surveillance Network. An in-browser algorithm (SGP4/SDP4) converts these numbers into real-time positions rendered on the map.

### OMM — the modern orbital data format

Orbital elements come in different formats:

- **TLE (Two-Line Element Set)** is the classic 1960s format: two lines of text with fixed column positions. Compact, but hard to read and increasingly strained by the growing number of satellites.
- **OMM (Orbit Mean-Elements Message)** is the modern successor, standardised by the international space agency body CCSDS. OMM is JSON-based, human-readable, extensible, and future-proof. CelesTrak is actively migrating to it.

SOMA uses OMM exclusively. This means SOMA will continue to work correctly even as the industry moves away from TLE.

## What you can do in SOMA

- Watch the ISS orbit the Earth (loaded automatically on first open).
- Search satellites by name or NORAD ID — e.g. "Hubble" or "25544".
- Track multiple satellites simultaneously.
- Click any satellite to see live data: coordinates, altitude above Earth, and velocity.
- View the 90-minute ground track — the line on the Earth's surface the satellite has passed over. Geostationary satellites, which move with the Earth, are shown as fixed points with no track.
- Use SOMA offline: the app shell, map tiles, and orbital data are all cached locally.

## Who SOMA is for

SOMA is aimed at space enthusiasts, educators, students, and anyone curious about what's passing overhead. It is not a tool for professional orbit analysis or collision avoidance — dedicated software exists for that. SOMA is about the experience of watching the invisible traffic in orbit.

## Getting started (development)

```bash
git clone https://github.com/dan1elw/SOMA.git
cd SOMA
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available scripts

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start development server         |
| `npm run build`     | Production build                 |
| `npm run preview`   | Preview production build locally |
| `npm run typecheck` | TypeScript type checking         |
| `npm run lint`      | ESLint                           |
| `npm run test`      | Vitest unit tests                |
| `npm run test:e2e`  | Playwright smoke tests           |

## Tech stack

React 19 + TypeScript 5 · Vite 6 · MapLibre GL JS · CARTO Dark Matter basemap · satellite.js (SGP4/SDP4) · Zustand · TanStack Query · Dexie.js (IndexedDB) · Tailwind CSS 4 · vite-plugin-pwa + Workbox

## Sources & further reading

- [CelesTrak](https://celestrak.org) — orbital element data source
- [OMM standard (CCSDS 502.0-B)](https://public.ccsds.org) — the modern orbital data format
- [satellite.js](https://github.com/shashwatak/satellite-js) — the SGP4/SDP4 propagation library
- [MapLibre GL JS](https://maplibre.org) — the map rendering engine
