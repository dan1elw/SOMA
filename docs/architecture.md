# SOMA – Satellite Orbit Monitoring Application
## Architekturkonzept v2.0 (Final)

**Dokument-Zweck:** Technische Grundlage für Softwareentwicklung und Repository-Aufbau mit Claude Code
**Datum:** 2026-04-19
**Status:** Final – freigegeben für Bootstrapping
**Deployment-Modell:** Browser-only Progressive Web App (keine Server-Komponente)

---

## 1. Executive Summary

SOMA ist eine Desktop-orientierte Web-Applikation zur Echtzeit-Visualisierung von Satelliten-Ground-Tracks auf einer dunklen 2D-Weltkarte. Die Applikation läuft **vollständig im Browser** – kein Backend, keine Betriebskosten, unbegrenzt skalierbar.

Der User öffnet SOMA und sieht sofort die **ISS** als Demo-Satellit auf einer CARTO Dark Matter-Karte mit seinem 90-minütigen Vergangenheits-Track. Über eine Freitext-Suche fügt er weitere Satelliten hinzu (NORAD-ID oder Name, z.B. "Hubble", "Starlink-1234"). Jeder Satellit aktualisiert sich mit 1 Hz, GEO-Satelliten werden als statische Punkte dargestellt, LEO-Satelliten mit ihrem Track.

Die Applikation ist ästhetisch zwischen **cinematic** (dunkel, atmosphärisch, Karte als Bühne) und **editorial** (präzise Typografie, großzügiger Whitespace, ruhige UI) positioniert. Sie ist offline-fähig, benötigt keine Registrierung und nutzt direkt CelesTrak als Datenquelle im zukunftssicheren **OMM-JSON-Format**.

### 1.1 Kernentscheidungen auf einen Blick

| Aspekt | Entscheidung |
|---|---|
| Architektur | Static SPA (PWA), kein Backend |
| Datenformat | OMM (JSON) von CelesTrak |
| Datenquelle | `celestrak.org/NORAD/elements/gp.php` (CORS-freigegeben) |
| Framework | React 19 + TypeScript + Vite |
| State-Management | Zustand |
| Karte | MapLibre GL JS + CARTO Dark Matter Basemap |
| Orbit-Engine | satellite.js (SGP4/SDP4) im Web Worker |
| Persistenz | IndexedDB (OMM-Cache), Service Worker (App-Shell) |
| Start-Experience | ISS (NORAD 25544) als Default-Demo |
| Nutzungsfokus | Reine Visualisierung, Desktop, englischsprachig |
| Lizenz | MIT |

---

## 2. Produktvision & Scope

### 2.1 Vision
SOMA zeigt Satelliten-Ground-Tracks in Echtzeit auf einer Weltkarte. Zielgruppe sind Raumfahrt-Interessierte, Bildungsnutzer und technisch versierte Beobachter, die einzelne Satelliten oder kleine Gruppen gezielt beobachten wollen – nicht Massendarstellungen ganzer Konstellationen.

### 2.2 Funktionaler Scope (finale MoSCoW-Liste)

| Priorität | Feature | Beschreibung |
|---|---|---|
| MUST | Realtime-Position | Aktuelle Satellitenposition, 1 Hz Update |
| MUST | Ground Track (LEO) | Vergangenheitstrack, 1 Orbit (~90 min), Fade-Out in letzten 20% |
| MUST | GEO-Handling | Geostationäre Satelliten als statische Punkte ohne Track |
| MUST | Freitext-Suche | NORAD-ID oder Name, automatische Typerkennung |
| MUST | Katalog-Preload | ~11.000 aktive Satelliten einmalig beim App-Start |
| MUST | Multi-Selection | Unbegrenzte Anzahl parallel beobachtbarer Satelliten |
| MUST | Detail-Panel | Live-Daten bei Klick auf Satellit (Koordinaten, Höhe, Geschwindigkeit, OMM-Metadaten) |
| MUST | Track-Highlighting | Bei Klick wird Ground Track hervorgehoben |
| MUST | ISS-Default | Beim ersten Öffnen automatisch ISS angezeigt |
| MUST | PWA / Offline | Vollständig offline-fähig nach erstem Laden |
| MUST | Stale-Warning | Banner bei OMM-Daten > 24h, mit Background-Refresh |
| COULD | GEO-Präzisierung | Verbesserte GEO-Visualisierung (z.B. Analemma-Bewegung) |
| COULD | Export GeoJSON/KML | Track exportieren |
| WON'T | 3D-Globe (CesiumJS) | Nicht im MVP |
| WON'T | User-Account-System | Nicht im MVP |
| WON'T | Favoriten / History | Nicht im MVP |
| WON'T | Pass-Prediction | Nicht im MVP |
| WON'T | Zeitsteuerung (Playback/Scrub) | Nicht im MVP – nur Gegenwart + Vergangenheit |
| WON'T | CelesTrak-Gruppen-Bulk-Load | Nicht im MVP – User wählt einzeln |
| WON'T | Custom-OMM/TLE-Upload | Nicht im MVP |
| WON'T | Mehrsprachigkeit / i18n | Nicht im MVP |
| WON'T | Mobile-Optimierung | Funktional, aber nicht gestaltet |

### 2.3 Nicht-funktionale Anforderungen

| Kategorie | Ziel |
|---|---|
| Time-to-Interactive | < 3s auf Desktop-Breitband |
| Katalog-Load | Asynchron im Hintergrund, < 10s auf 4G |
| Rendering | 60fps bei typischen Szenarios (1–50 Satelliten) |
| Initial Bundle | < 400 KB gzipped (ohne Katalog) |
| Browser-Support | Evergreen: Chrome ≥ 120, Firefox ≥ 120, Safari ≥ 17, Edge ≥ 120 |
| Offline | App-Shell + letzter OMM-Cache funktionieren vollständig offline |
| Accessibility | WCAG 2.1 Level AA (Best Effort, nicht zertifiziert) |
| Datenschutz | Keine Tracker, keine Cookies, keine externen Analytics |

---

## 3. Architektur-Entscheidungen (ADRs)

### ADR-001: Browser-only Architektur
**Status:** Accepted
**Begründung:** Alle Propagations-Berechnungen sind clientseitig machbar (SGP4 via satellite.js). CelesTrak erlaubt CORS. Kein serverseitiger Zustand nötig, da keine User-Accounts, Favoriten oder Cross-Device-Sync im Scope sind.
**Konsequenzen:** Betriebskosten 0 €, horizontal unbegrenzt skalierbar, CDN-Auslieferung ausreichend. Abhängigkeit von CORS-Verhalten der Drittquelle; keine serverseitige Validierung möglich.

### ADR-002: OMM statt TLE als Datenformat
**Status:** Accepted
**Begründung:** CelesTrak migriert aktiv von TLE auf OMM (CCSDS 502.0-B). OMM ist JSON-nativ, unterstützt 9-stellige NORAD-IDs und liefert strukturierte Metadaten. satellite.js unterstützt OMM direkt.
**Konsequenzen:** Zukunftssicher, schlankeres Parsing, leicht größere Payload – irrelevant bei ~5 MB Gesamtgröße.

### ADR-003: CARTO Dark Matter Basemap + MapLibre GL JS
**Status:** Accepted
**Begründung:** CARTO Dark Matter passt zur cinematic-editorial Ästhetik. MapLibre GL JS ist Open Source, WebGL-basiert (Performance für Polylines) und API-kompatibel zum Mapbox-Ökosystem. Kostenloser Style bei CARTO abrufbar.
**Style-URL:** `https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json`
**Attribution:** © OpenStreetMap contributors, © CARTO.

### ADR-004: Web Worker für Orbit-Propagation
**Status:** Accepted
**Begründung:** Bei "unbegrenzter" Multi-Selection könnte der User theoretisch hunderte Satelliten hinzufügen. Propagation im Main Thread würde UI-Ruckler verursachen. Web Worker garantiert 60fps unabhängig von der Satelliten-Anzahl.
**Konsequenzen:** Zusätzliche Build-Komplexität (Vite Worker-Handling). Serialisierung der Positionen via postMessage (JSON, keine Transferables nötig bei <10 KB Batch).

### ADR-005: Zustand als State-Management
**Status:** Accepted
**Begründung:** Minimalistisch, ohne Provider-Wrapping, selektive Subscriptions. Passt zu granularen Updates (1 Hz Positions-Broadcast).

### ADR-006: ISS als Default-Satellit
**Status:** Accepted
**Begründung:** Entlastet leere Karte beim ersten Öffnen, zeigt sofort die Kernfunktion. ISS ist NORAD 25544, öffentlich bekannt, verlässlich im `active`-Feed vorhanden.

### ADR-007: Orbit-Typ-bewusste Track-Darstellung
**Status:** Accepted
**Begründung:** GEO-Satelliten bewegen sich mit der Erdrotation – ihr 24h-Ground-Track wäre ein Punkt oder eine kleine Acht. Track-Rendering ist in diesem Fall visueller Lärm.
**Logik:**
- LEO (MEAN_MOTION > 11 rev/day): 90-min-Track mit Fade-Out
- GEO (MEAN_MOTION ≈ 1.0 ± 0.05): kein Track, nur aktueller Punkt
- MEO/HEO (dazwischen): 90-min-Track als Fallback (feinere Abstufung in Post-MVP)

### ADR-008: Keine Performance-Limits
**Status:** Accepted
**Begründung:** User entscheidet selbst, wie viele Satelliten er hinzufügt. Soft-Limits würden als Bevormundung empfunden. Web Worker stellt sicher, dass selbst bei Extremnutzung die UI nicht einfriert – im schlimmsten Fall wird das Positions-Update-Intervall im Worker dynamisch adaptiv reduziert.

### ADR-009: Keine Zeit-Playback-Funktionalität im MVP
**Status:** Accepted
**Begründung:** Klarer Fokus auf "Gegenwart + Vergangenheit" als mentalen Modus. Vereinfacht State-Management, Datenstrukturen und UI. Kein TimeSlider, kein Play/Pause, kein Zeitraffer.

---

## 4. Systemarchitektur

### 4.1 Laufzeit-Topologie

```
┌────────────────────────────────────────────────────────────────┐
│                          BROWSER                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Main Thread (React UI)                      │  │
│  │                                                          │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │  │  MapView    │  │ SearchPanel  │  │  DetailPanel   │   │  │
│  │  │ (MapLibre)  │  │(Autocomplete)│  │  (OMM + Live)  │   │  │
│  │  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘   │  │
│  │         │                 │                  │           │  │
│  │         └────────┬────────┴──────────────────┘           │  │
│  │                  │                                       │  │
│  │          ┌───────▼────────┐                              │  │
│  │          │ Zustand Stores │                              │  │
│  │          │  - catalog     │                              │  │
│  │          │  - active      │                              │  │
│  │          │  - positions   │                              │  │
│  │          │  - ui          │                              │  │
│  │          └───────┬────────┘                              │  │
│  └──────────────────┼─────────────────────────────────────-─┘  │
│                     │ postMessage                              │
│  ┌──────────────────▼───────────────────────────────────────┐  │
│  │           Orbit Worker (Web Worker)                      │  │
│  │                                                          │  │
│  │   ┌──────────────┐    ┌──────────────────────────┐       │  │
│  │   │ OMM Loader   │───▶│  SGP4 Propagator         │       │  │
│  │   │ (in-memory)  │    │  (satellite.js)          │       │  │
│  │   └──────────────┘    └───────────┬──────────────┘       │  │
│  │                                   │                      │  │
│  │   ┌──────────────┐    ┌───────────▼──────────────┐       │  │
│  │   │ Orbit-Type   │    │  Track Generator         │       │  │
│  │   │ Classifier   │    │  (90 min past, LEO only) │       │  │
│  │   └──────────────┘    └──────────────────────────┘       │  │
│  │           │                        │                     │  │
│  │           └──────────┬─────────────┘                     │  │
│  │                      │ 1 Hz Broadcast                    │  │
│  │              ┌───────▼────────┐                          │  │
│  │              │ PositionBatch  │                          │  │
│  │              │ + TrackDelta   │                          │  │
│  │              └────────────────┘                          │  │
│  └───────────────────────────────────────────────────────-──┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Storage Layer                                 │  │
│  │   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │  │
│  │   │ IndexedDB   │  │ LocalStorage │  │ Cache API     │   │  │
│  │   │ (Dexie.js)  │  │ (Settings)   │  │ (Map Tiles)   │   │  │
│  │   │ - Catalog   │  │ - ActiveSats │  │               │   │  │
│  │   │ - OMM Cache │  │              │  │               │   │  │
│  │   └─────────────┘  └──────────────┘  └───────────────┘   │  │
│  └────────────────────────────────────────────────────────-─┘  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Service Worker (Workbox)                        │  │
│  │   - Precache: App-Shell (JS, CSS, HTML, Fonts)           │  │
│  │   - Runtime-Cache: CARTO Tiles (CacheFirst, 7d)          │  │
│  │   - Runtime-Cache: CelesTrak OMM (StaleWhileRevalidate)  │  │
│  └────────────────────────────────────────────────────────-─┘  │
└────────────────────────┬─────────────────────────────────────-─┘
                         │ fetch (CORS)
                         ▼
         ┌───────────────────────────────────┐
         │   celestrak.org                   │
         │ /NORAD/elements/gp.php            │
         │  ?GROUP=active&FORMAT=json        │
         │  ?CATNR=<id>&FORMAT=json          │
         └───────────────────────────────────┘
```

### 4.2 Verantwortlichkeiten

| Komponente | Verantwortung |
|---|---|
| Main Thread | UI, Interaktion, State-Orchestrierung, MapLibre-Rendering |
| Orbit Worker | OMM-Parsing, SGP4-Propagation, Orbit-Klassifikation, Track-Generation |
| Zustand Stores | Single-Source-of-Truth, granulare Subscriptions |
| IndexedDB | Katalog-Daten (5 MB), OMM-Cache pro Satellit |
| LocalStorage | Kleine Settings, Liste aktiver NORAD-IDs (für Restore) |
| Cache API | Map-Tile-Cache (via Service Worker) |
| Service Worker | App-Shell-Precaching, Runtime-Caching, Offline-Fähigkeit |

---

## 5. Datenmodelle

### 5.1 OMM (CelesTrak JSON-Response)

```typescript
interface OMM {
  OBJECT_NAME: string;          // "ISS (ZARYA)"
  OBJECT_ID: string;            // "1998-067A" (International Designator)
  EPOCH: string;                // ISO-8601 UTC
  MEAN_MOTION: number;          // Revs/Tag – Schlüssel für Orbit-Klassifikation
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: 'U' | 'C' | 'S';
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}
```

### 5.2 Abgeleitete Typen

```typescript
type OrbitClass = 'LEO' | 'MEO' | 'GEO' | 'HEO' | 'UNKNOWN';

interface ActiveSatellite {
  noradId: number;
  name: string;
  omm: OMM;
  orbitClass: OrbitClass;
  addedAt: number;              // Unix ms
  ommFetchedAt: number;         // für Stale-Check
}

interface SatellitePosition {
  noradId: number;
  timestamp: number;            // Unix ms
  latitude: number;             // Grad [-90, 90]
  longitude: number;            // Grad [-180, 180]
  altitude: number;             // km über WGS84
  velocity: number;             // km/s
}

interface GroundTrackSegment {
  // Polyline zwischen zwei Antimeridian-Crossings
  coordinates: Array<[number, number]>;  // [lon, lat][]
}

interface GroundTrack {
  noradId: number;
  segments: GroundTrackSegment[];
  oldestTimestamp: number;      // für Fade-Out-Berechnung
  newestTimestamp: number;
}

interface CatalogEntry {
  // Reduzierter Satz für Suche – nicht die vollen OMM-Daten
  noradId: number;
  name: string;
  objectId: string;             // International Designator
}
```

### 5.3 Orbit-Klassifikations-Regel

```typescript
function classifyOrbit(meanMotion: number): OrbitClass {
  if (meanMotion > 11.25) return 'LEO';        // Orbital period < ~128 min
  if (meanMotion >= 0.95 && meanMotion <= 1.05) return 'GEO';
  if (meanMotion >= 1.8 && meanMotion <= 2.5)  return 'MEO';  // ~12h orbit
  if (meanMotion < 11.25) return 'HEO';
  return 'UNKNOWN';
}
```

---

## 6. Kern-Datenflüsse

### 6.1 App-Start (Cold Boot)

```
 T=0     User öffnet SOMA
          │
 T=50ms   Service Worker wird aktiv
          App-Shell aus Precache geladen
          │
 T=200ms  React-App gemountet, leere Karte + CARTO Dark Matter Tiles
          Loading-Indikator in SearchPanel
          │
 T=500ms  Parallel gestartet:
          ├─ Katalog-Load aus IndexedDB (falls cached)
          ├─ OMM-Fetch für ISS (NORAD 25544) aus Cache/CelesTrak
          └─ Orbit Worker initialisiert
          │
 T=800ms  ISS-OMM an Worker übergeben
          Worker startet Propagation
          │
 T=1000ms Erste Position für ISS empfangen
          Marker + Track werden gerendert
          │
 T=1–5s   Katalog-Aktualisierung im Hintergrund (falls > 24h alt)
          Banner bei stale Daten
          │
 T=ready  App ist interaktiv, Suche aktiv, ISS wird propagiert
```

### 6.2 Satellit hinzufügen

```
 User tippt "Hub" in Suchleiste
  │
  ▼
 Client-side Fuzzy-Search im Katalog (IndexedDB)
  │
  ▼
 Autocomplete-Dropdown zeigt "HST", "Hubble Space Telescope", …
  │
  ▼
 User klickt Eintrag
  │
  ▼
 Prüfung: OMM bereits im Cache und < 24h alt?
  │        │
  │        ├─ Ja  → OMM aus Cache
  │        └─ Nein → fetch(celestrak.org/?CATNR=20580&FORMAT=json)
  │
  ▼
 OMM in IndexedDB speichern (timestamp)
  │
  ▼
 ActiveSatellite an Zustand-Store pushen
  │
  ▼
 Worker: postMessage({ type: 'ADD_SAT', payload: omm })
  │
  ▼
 Worker berechnet 90-min-Track rückwärts + aktuelle Position
  │
  ▼
 Worker: postMessage({ type: 'INITIAL_TRACK', payload: ... })
  │
  ▼
 UI rendert Marker + Track auf Karte
```

### 6.3 Realtime-Tick (1 Hz)

```
 Worker-Intervall (1000 ms):
  │
  ├─ Aktueller Zeitstempel (Date.now())
  │
  ├─ Für jeden aktiven Satelliten:
  │    ├─ SGP4-Propagation → ECI-Position
  │    ├─ ECI → ECF → Geodetic (lat/lon/alt)
  │    ├─ Wenn LEO: Track-Punkt anhängen, ältere > 90 min entfernen
  │    └─ Wenn GEO: keine Track-Operation
  │
  ├─ Batch zusammenstellen: { positions: [...], trackDeltas: [...] }
  │
  └─ postMessage(batch)
       │
       ▼
       Main Thread: Zustand.setPositions(batch)
       │
       ▼
       React-Re-Render selektiv (nur veränderte Satelliten)
       │
       ▼
       MapLibre: Marker-Positionen setzen, Track-Layer updaten
```

---

## 7. Frontend-Projektstruktur

```
soma/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint, Typecheck, Test, Build
│       └── deploy.yml                # Cloudflare Pages Deploy on main
├── public/
│   ├── favicon.svg
│   ├── manifest.webmanifest          # PWA manifest
│   └── robots.txt
├── src/
│   ├── app/
│   │   ├── App.tsx                   # Root, MapView + Panels
│   │   ├── providers.tsx             # QueryClient, Theme, Error Boundary
│   │   └── bootstrap.ts              # Initial-Load-Logik (ISS, Katalog)
│   ├── features/
│   │   ├── map/
│   │   │   ├── components/
│   │   │   │   ├── MapView.tsx
│   │   │   │   ├── SatelliteMarker.tsx
│   │   │   │   └── GroundTrackLayer.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useMapInstance.ts
│   │   │   │   └── useAntimeridianSplit.ts
│   │   │   └── utils/
│   │   │       ├── trackRenderer.ts  # Fade-Out-Gradient
│   │   │       └── projection.ts
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── SearchPanel.tsx
│   │   │   │   └── AutocompleteItem.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSatelliteSearch.ts
│   │   │   └── utils/
│   │   │       └── fuzzyMatch.ts     # NORAD-ID oder Name
│   │   ├── detail/
│   │   │   ├── components/
│   │   │   │   ├── DetailPanel.tsx
│   │   │   │   ├── LiveDataRow.tsx
│   │   │   │   └── OmmMetadata.tsx
│   │   │   └── utils/
│   │   │       └── formatters.ts     # Dezimalgrad, km, UTC
│   │   ├── orbit/
│   │   │   ├── worker/
│   │   │   │   ├── orbit.worker.ts   # Entry
│   │   │   │   ├── propagator.ts     # SGP4 Wrapper
│   │   │   │   ├── classifier.ts     # LEO/MEO/GEO/HEO
│   │   │   │   └── trackGenerator.ts # 90-min Past Track
│   │   │   ├── hooks/
│   │   │   │   └── useOrbitWorker.ts
│   │   │   └── types.ts
│   │   ├── catalog/
│   │   │   ├── api/
│   │   │   │   └── celestrak.ts      # Fetch Functions
│   │   │   ├── hooks/
│   │   │   │   ├── useCatalog.ts
│   │   │   │   └── useStaleCheck.ts
│   │   │   └── utils/
│   │   │       └── catalogBuilder.ts # Reduktion auf CatalogEntry
│   │   └── offline/
│   │       ├── components/
│   │       │   ├── StaleBanner.tsx
│   │       │   └── OfflineBanner.tsx
│   │       └── hooks/
│   │           └── useNetworkStatus.ts
│   ├── shared/
│   │   ├── components/               # Button, Panel, Badge, Tooltip
│   │   ├── hooks/                    # useInterval, useDebounce
│   │   ├── utils/                    # time.ts, units.ts
│   │   └── icons/
│   ├── store/
│   │   ├── catalogStore.ts
│   │   ├── activeSatellitesStore.ts
│   │   ├── positionsStore.ts
│   │   └── uiStore.ts
│   ├── storage/
│   │   ├── db.ts                     # Dexie.js Schema
│   │   ├── ommCache.ts
│   │   └── settings.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── tokens.css                # Design Tokens
│   ├── types/
│   │   ├── omm.ts
│   │   ├── satellite.ts
│   │   └── index.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── tests/
│   ├── unit/
│   │   ├── classifier.test.ts
│   │   ├── propagator.test.ts
│   │   ├── antimeridian.test.ts
│   │   ├── fuzzyMatch.test.ts
│   │   └── formatters.test.ts
│   └── e2e/
│       └── smoke.spec.ts             # Playwright
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── README.md
└── LICENSE                           # MIT
```

---

## 8. Technologiestack (Final)

### 8.1 Core
| Bereich | Technologie | Zweck |
|---|---|---|
| Language | TypeScript 5.x | Typsicherheit |
| Framework | React 19 | UI |
| Build | Vite 6 | Dev-Server, Bundling, Worker-Support |
| State | Zustand 5 | Global State |
| Server-State | TanStack Query 5 | OMM-Fetching mit Retry/Caching |

### 8.2 Domain
| Bereich | Technologie | Zweck |
|---|---|---|
| Orbit Math | satellite.js | SGP4/SDP4-Propagation |
| Karte | MapLibre GL JS | 2D-Rendering, WebGL |
| Basemap | CARTO Dark Matter (GL Style) | Ästhetik, kostenlos |

### 8.3 Infrastructure (Browser)
| Bereich | Technologie | Zweck |
|---|---|---|
| IndexedDB | Dexie.js | Katalog + OMM-Cache |
| PWA | vite-plugin-pwa + Workbox | Service Worker, Offline |
| Styling | Tailwind CSS 4 | Utility-First |
| Icons | Lucide React | Icon-Set |

### 8.4 Quality & DX
| Bereich | Technologie |
|---|---|
| Linting | ESLint + typescript-eslint |
| Formatting | Prettier |
| Unit Tests | Vitest + React Testing Library |
| E2E | Playwright |
| Commit Hooks | Husky + lint-staged |
| Commit-Stil | Conventional Commits |

---

## 9. CelesTrak-Integration

### 9.1 Endpoints

**Katalog-Load (einmal pro Tag):**
```
GET https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json
```
Liefert alle aktiven Satelliten (~11.000) mit vollständigen OMM-Daten.

**Einzel-Lookup (bei Suche):**
```
GET https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=json
```
Liefert OMM für spezifische NORAD-ID.

### 9.2 Caching-Strategie

| Typ | Storage | TTL | Strategie |
|---|---|---|---|
| Katalog (alle active) | IndexedDB | 24h | Stale-While-Revalidate |
| OMM einzelner Sat | IndexedDB | 24h | Cache-First mit Background-Update |
| Map-Tiles | Cache API | 7 Tage | Cache-First |
| App-Shell | Cache API | permanent | Precache, Update on activate |

### 9.3 Stale-Handling
1. Beim App-Start prüft `useStaleCheck`: Ist das neueste OMM > 24h alt?
2. Falls ja: Warnbanner einblenden ("Satellite data is older than 24 hours. Refreshing in background...")
3. Parallel: Background-Refetch der aktiven Satelliten
4. Bei Erfolg: Banner schließt sich automatisch
5. Bei Fehler (offline / CORS-Problem): Banner bleibt, aber App funktional mit alten Daten

### 9.4 Fehlerbehandlung
| Fehler | Verhalten |
|---|---|
| Netzwerk offline | Cache verwenden, Offline-Banner |
| CORS-Fehler | Dialog mit Hinweis + GitHub-Issue-Link |
| Leere Response | Retry mit exponential Backoff (max 3) |
| NORAD-ID nicht gefunden | Toast: "Satellite #XXXXX not found in catalog" |

---

## 10. UI/UX-Leitlinien (Cinematic + Editorial)

### 10.1 Layout-Grundriss (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌────────────┐                                             │
│  │ SOMA       │                                             │
│  │ ◯ Search…  │                  [Full-Width Dark Map]      │
│  └────────────┘                                             │
│                                                             │
│                                                             │
│                                                             │
│                     [ISS Marker with 90-min glowing trail]  │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                                  ┌─────────┐│
│                                                  │ ISS     ││
│                                                  │ 51.6°N  ││
│                                                  │ -0.12°E ││
│                                                  │ 418 km  ││
│                                                  │ 7.66km/s││
│                                                  └─────────┘│
│                                                             │
│  ⚠ Data older than 24h – refreshing…                        │
└─────────────────────────────────────────────────────────────┘
```

- **Karte: 100% Viewport** – UI schwebt als Overlays
- **Links oben:** Brand + Search-Panel (kollabierbar)
- **Rechts unten:** Detail-Panel für selektierten Satelliten
- **Unten zentriert (bei Bedarf):** Stale-/Offline-Banner

### 10.2 Typografie

| Rolle | Empfehlung | Fallback |
|---|---|---|
| Display / Brand | *Instrument Serif* oder *Fraunces* | Georgia |
| UI-Sans | *Geist* oder *Inter Display* | system-ui |
| Mono (Zahlen, IDs) | *JetBrains Mono* oder *Geist Mono* | ui-monospace |

**Regel:** Monospace überall dort, wo numerische Werte stehen (Koordinaten, Höhe, Geschwindigkeit, NORAD-ID, EPOCH).

### 10.3 Farbpalette (Vorschlag, final im Design-Sprint)

```css
:root {
  --soma-bg:          #0a0e14;   /* CARTO Dark-Matter-nahe */
  --soma-surface:     rgba(16, 22, 30, 0.85); /* Glass-Effect */
  --soma-border:      rgba(255, 255, 255, 0.08);
  --soma-text:        #e6e9ef;
  --soma-text-muted:  #8a94a3;
  --soma-accent:      #7dd3fc;   /* Cold cyan – Satellite-Signal */
  --soma-track:       #7dd3fc;   /* Track-Linie, mit Glow */
  --soma-warning:     #fbbf24;   /* Stale-Banner */
}
```

### 10.4 Mikro-Interaktionen

| Event | Verhalten |
|---|---|
| Hover auf Marker | Tooltip mit Name + aktueller Höhe (fade-in 150ms) |
| Click auf Marker | Detail-Panel slide-in von rechts; Track wird "highlighted" (dickere Linie, stärkerer Glow); andere Tracks dezenter (Opacity 0.3) |
| Track-Rendering | Fade-Out der ältesten 20% via `line-gradient` (MapLibre expression) |
| App-Start | Subtile Fade-In-Animation der Karte; ISS-Marker "erscheint" pulsierend einmal |

### 10.5 Accessibility
- Alle interaktiven Elemente keyboard-navigierbar (Tab, Enter, Esc)
- Search-Panel ist erste fokussierbare Komponente nach dem App-Load
- Farben erfüllen WCAG AA-Kontrast (4.5:1 Text, 3:1 UI)
- `prefers-reduced-motion`: Marker-Pulse-Animation deaktiviert

---

## 11. Security & Compliance

| Aspekt | Maßnahme |
|---|---|
| CSP | Strikte Policy: nur eigene Assets, CelesTrak, CARTO |
| CORS | Read-only von Drittquellen |
| DSGVO | Keine User-Daten verlassen den Browser, keine Tracker, keine Cookies |
| Third-Party Scripts | Keine (kein Analytics, kein Tag-Manager) |
| Dependencies | Dependabot + `npm audit` in CI; 0 High/Critical-Findings als Merge-Bedingung |
| Subresource Integrity | Wo CDN-Assets genutzt werden |

---

## 12. Deployment

### 12.1 Hosting
**Empfehlung:** Cloudflare Pages
- Globales CDN, automatisches HTTPS
- Kostenlos für Open Source
- Atomic Deploys aus GitHub

**Alternativen:** Netlify, Vercel, GitHub Pages.

### 12.2 CI/CD (GitHub Actions)

```yaml
# .github/workflows/ci.yml
on: [push, pull_request]
jobs:
  lint:      { eslint, prettier --check }
  typecheck: { tsc --noEmit }
  test:      { vitest run }
  build:     { vite build }
  e2e:       { playwright test }  # nur auf main
```

```yaml
# .github/workflows/deploy.yml
on:
  push: { branches: [main] }
jobs:
  deploy: { Cloudflare Pages Action → dist/ }
```

### 12.3 Environments

| Env | Branch | URL |
|---|---|---|
| Production | `main` | `soma.example.com` |
| Preview | PR | `*.pages.dev` (auto) |

---

## 13. Entwicklungs-Roadmap

### Phase 1 – Foundation (Woche 1)
- Repo-Setup, CI/CD, Tooling
- Vite + React + TS + Tailwind + ESLint + Prettier
- Husky, lint-staged, Conventional Commits
- README, LICENSE (MIT), CONTRIBUTING.md

### Phase 2 – Map + Minimal Render (Woche 2)
- MapLibre-Integration mit CARTO Dark Matter
- Weltkarte, neutral zentriert, komplett sichtbar
- Statischer ISS-Marker (hardcoded Position) – Sanity-Check

### Phase 3 – Orbit Engine (Woche 3)
- Web Worker Setup
- satellite.js Integration
- OMM-Parsing, SGP4-Propagation
- Orbit-Klassifikation (LEO/MEO/GEO/HEO)
- Unit-Tests: ISS-Position zu bekanntem Zeitpunkt

### Phase 4 – Realtime + Tracks (Woche 4)
- 1 Hz-Tick im Worker
- Marker-Position-Updates
- Ground-Track-Generation für LEO (90 min)
- Antimeridian-Splitting
- Fade-Out-Rendering via MapLibre `line-gradient`

### Phase 5 – CelesTrak Integration + Katalog (Woche 5)
- Katalog-Load beim App-Start
- IndexedDB-Cache (Dexie)
- Einzel-OMM-Fetch per NORAD-ID
- Stale-Banner, Background-Refresh

### Phase 6 – Search + Detail-Panel (Woche 6)
- Search-Panel mit Freitext-Autocomplete
- NORAD-ID vs. Name Erkennung
- Fuzzy-Match
- Detail-Panel (Live-Daten + OMM-Metadaten)
- Track-Highlighting bei Selektion

### Phase 7 – PWA + Offline (Woche 7)
- Service Worker via vite-plugin-pwa
- App-Shell-Precaching
- Map-Tile-Caching
- Offline-Banner
- Manifest für Install

### Phase 8 – Polish (Woche 8)
- Typografie-Integration (Fonts laden, Fallbacks)
- Farbpalette finalisieren
- Mikro-Interaktionen
- Accessibility-Audit
- Performance-Tuning (Bundle-Analyse)
- E2E-Smoke-Test

---

## 14. Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|---|---|---|---|
| CelesTrak entfernt CORS | Niedrig | Hoch | Proxy-Option vorhalten (optionaler Cloudflare Worker) |
| SDP4-Genauigkeit bei GEO | Niedrig | Niedrig | Visueller Scope – statischer Punkt reicht |
| Performance bei extremen User-Selektionen (1000+) | Mittel | Mittel | Adaptive Tick-Rate im Worker |
| MapLibre `line-gradient`-Limits | Niedrig | Niedrig | Fallback auf segmentierte Linien mit diskreter Opacity |
| Katalog-Endpoint wird langsam | Niedrig | Mittel | IndexedDB-Cache funktioniert weiter |
| Font-Lizenzen (Instrument Serif, Geist) | Niedrig | Niedrig | OFL/SIL-lizenzierte Alternativen verfügbar |

---

## 15. Akzeptanzkriterien (MVP)

- [ ] App startet, ISS ist innerhalb 3s auf der Karte sichtbar
- [ ] CARTO Dark Matter-Karte, Welt komplett sichtbar, neutral zentriert
- [ ] ISS-Marker aktualisiert sich 1×/Sekunde sichtbar
- [ ] 90-min-Vergangenheitstrack mit Fade-Out wird gerendert
- [ ] Antimeridian-Crossing korrekt ohne "Strich durch die Welt"
- [ ] Suche nach "Hubble" findet NORAD 20580
- [ ] Suche nach "25544" findet ISS
- [ ] Hinzufügen beliebig vieler Satelliten funktioniert
- [ ] GEO-Satellit wird als statischer Punkt ohne Track dargestellt
- [ ] Click auf Marker öffnet Detail-Panel + hebt Track hervor
- [ ] Koordinaten im Panel: Dezimalgrad, UTC, km/h, km
- [ ] App funktioniert offline nach erstem Laden
- [ ] Warnbanner bei OMM > 24h, Background-Refresh
- [ ] Lighthouse Desktop: Performance ≥ 90, Accessibility ≥ 90
- [ ] 0 High/Critical `npm audit` Findings
- [ ] CI-Pipeline grün auf `main`
- [ ] README mit Setup + Development-Guide

---

## 16. Repository-Bootstrapping Checklist (für Claude Code)

1. **`npm create vite@latest soma -- --template react-ts`**
2. **Dependencies installieren:**
   - Runtime: `zustand`, `@tanstack/react-query`, `maplibre-gl`, `satellite.js`, `dexie`, `lucide-react`
   - Dev: `tailwindcss`, `vite-plugin-pwa`, `workbox-window`, `@playwright/test`, `vitest`, `@testing-library/react`, `eslint`, `prettier`, `husky`, `lint-staged`
3. **Tailwind Setup** (Tailwind 4)
4. **ESLint + Prettier + Husky + lint-staged** konfigurieren
5. **Projektstruktur** gemäß Abschnitt 7 anlegen
6. **Type-Definitions** zuerst schreiben (`src/types/omm.ts`, `satellite.ts`)
7. **Orbit Worker Setup** mit Vite verifizieren (`worker { format: 'es' }`)
8. **Minimaler ISS-Propagator-Test** als erster Vitest-Test
9. **GitHub Actions Workflow** vor erster Feature-Implementation
10. **README** mit Setup, Development-Commands, Architektur-Übersicht
11. **LICENSE (MIT)** committen
12. **Initial Commit:** `feat: scaffold SOMA project with base architecture`

---

## Anhang A: Glossar

| Begriff | Bedeutung |
|---|---|
| OMM | Orbit Mean-Elements Message (CCSDS 502.0-B) |
| TLE | Two-Line Element Set (Legacy-Format) |
| SGP4 | Simplified General Perturbations 4 – LEO-Propagator |
| SDP4 | Deep-Space-Variante für hohe Orbits |
| Ground Track | Projektion der Satellitenbahn auf Erdoberfläche |
| NORAD ID | Eindeutige Katalognummer |
| Antimeridian | 180°-Datumsgrenze (Rendering-Edge-Case) |
| LEO/MEO/GEO/HEO | Orbit-Höhenklassen |
| PWA | Progressive Web App |
| ECI/ECF | Earth-Centered Inertial / Earth-Centered Fixed (Koordinatensysteme) |

---

## Anhang B: Referenzen

- CelesTrak: https://celestrak.org
- OMM-Standard (CCSDS 502.0-B): https://public.ccsds.org
- satellite.js: https://github.com/shashwatak/satellite-js
- MapLibre GL JS: https://maplibre.org
- CARTO Basemaps: https://github.com/CartoDB/basemap-styles
- Workbox: https://developer.chrome.com/docs/workbox

---

**Ende des Konzepts.**
Dieses Dokument ist die verbindliche Grundlage für das Repository-Bootstrapping und die Entwicklung von SOMA v1.0.