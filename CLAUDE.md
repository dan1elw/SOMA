# SOMA — Satellite Orbit Monitoring Application

Diese Datei ist der verbindliche Kontext für Claude Code in diesem Repository.
Sie wird bei jedem Session-Start automatisch geladen. Halte dich strikt an die
hier dokumentierten Regeln; das Architekturkonzept ist final freigegeben.

---

## 1. Was SOMA ist (in einem Satz)

Eine **Browser-only Progressive Web App** zur Echtzeit-Visualisierung von
Satelliten-Ground-Tracks auf einer dunklen 2D-Weltkarte — kein Backend,
keine Server-Kosten, vollständig offline-fähig.

Volldokument: `docs/architecture.md` — **diese Datei ist die Single Source of Truth.**
Bei Widersprüchen zwischen Code und Architekturdokument gewinnt das Dokument.

---

## 2. Harte Architektur-Constraints (nicht verhandelbar)

Diese Regeln sind ADRs. Sie zu verletzen bedeutet, einen neuen ADR schreiben
und explizite Freigabe einholen. Nicht "mal eben" ändern.

- **ADR-001: Browser-only.** Kein Node-Server, keine API-Routen, keine Edge
  Functions. Alles läuft clientseitig.
- **ADR-002: OMM (JSON), nicht TLE.** Parse niemals TLE-Strings. CelesTrak
  liefert OMM über `?FORMAT=json`.
- **ADR-003: MapLibre GL JS + CARTO Dark Matter.** Keine Mapbox-proprietären
  Features, keine Google Maps, kein Leaflet. WebGL ist Pflicht.
- **ADR-004: Orbit-Propagation im Web Worker.** SGP4/SDP4 läuft **niemals** im
  Main Thread. Wenn du Propagations-Code im Main Thread siehst: Bug.
- **ADR-005: Zustand für State.** Kein Redux, kein MobX, kein Context für
  globalen State. TanStack Query ausschließlich für Server-State (OMM-Fetch).
- **ADR-006: ISS als Default.** NORAD 25544 wird beim Cold Boot immer
  automatisch geladen.
- **ADR-007: Orbit-Typ bestimmt Track-Rendering.** GEO: kein Track, nur Punkt.
  LEO/MEO/HEO: 90-min-Track mit Fade-Out.
- **ADR-008: Keine Performance-Limits für den User.** Kein "max 50 Satelliten"-
  Hardcoded-Limit. Adaptive Tick-Rate im Worker statt Bevormundung.
- **ADR-009: Kein Playback, kein Scrubbing, kein TimeSlider.** Nur Gegenwart +
  Vergangenheit.

### Ausgeschlossen aus dem MVP (WON'T, nicht "später" — **nie** im v1.0):

3D-Globe, User-Accounts, Favoriten, Pass-Prediction, Zeitsteuerung, Bulk-Group-
Load, Custom-OMM-Upload, i18n, Mobile-Optimierung. Wenn User danach fragt:
freundlich ablehnen und auf Scope verweisen.

---

## 3. Tech-Stack (final)

```
React 19 + TypeScript 5 (strict) + Vite 6
Zustand 5 (client state)  |  TanStack Query 5 (server state)
MapLibre GL JS + CARTO Dark Matter GL Style
satellite.js (SGP4/SDP4, im Web Worker)
Dexie.js (IndexedDB)  |  vite-plugin-pwa + Workbox
Tailwind CSS 4  |  Lucide React
Vitest + React Testing Library  |  Playwright (E2E, nur Smoke)
ESLint + Prettier + Husky + lint-staged  |  Conventional Commits
```

Füge keine Dependencies hinzu, ohne sie zu rechtfertigen. Insbesondere:
**kein Analytics, keine Tracker, keine Cookies, kein Tag-Manager** (Abschnitt 11
des Architekturdokuments — DSGVO-Grundregel).

---

## 4. Projektstruktur (feature-based, verbindlich)

```
src/
  app/        Root, Providers, Bootstrap
  features/
    map/      MapLibre-Integration, Marker, Track-Layer
    search/   Freitext-Autocomplete, Fuzzy-Match
    detail/   Detail-Panel mit Live-Daten + OMM-Metadaten
    orbit/    Web Worker (propagator, classifier, trackGenerator)
    catalog/  CelesTrak-API, Katalog-Load, Stale-Check
    offline/  Offline-/Stale-Banner, Netzwerk-Status
  shared/     Wiederverwendbare UI-Primitives, Hooks, Utils, Icons
  store/      Zustand-Stores (catalog, activeSatellites, positions, ui)
  storage/    Dexie-Schema, OMM-Cache, Settings
  styles/     globals.css, tokens.css
  types/      omm.ts, satellite.ts, index.ts
```

**Regeln für neue Dateien:**
- Feature-Code gehört in `src/features/<feature>/` — niemals in `shared/`.
- `shared/` ist ausschließlich für feature-agnostische Primitives.
- Types leben im Feature, außer sie sind feature-übergreifend (→ `src/types/`).
- Worker-Code lebt ausschließlich unter `src/features/orbit/worker/`.

---

## 5. Kritische Implementierungsdetails

### 5.1 Orbit-Klassifikation (Abschnitt 5.3 des Dokuments)

```ts
function classifyOrbit(meanMotion: number): OrbitClass {
  if (meanMotion > 11.25)                       return 'LEO';
  if (meanMotion >= 0.95 && meanMotion <= 1.05) return 'GEO';
  if (meanMotion >= 1.8  && meanMotion <= 2.5)  return 'MEO';
  if (meanMotion < 11.25)                       return 'HEO';
  return 'UNKNOWN';
}
```

Diese Funktion **muss** in `src/features/orbit/worker/classifier.ts` liegen
und durch Unit-Tests abgedeckt sein (ISS=LEO, GOES-16=GEO, GPS=MEO, Molniya=HEO).

### 5.2 Antimeridian-Splitting

Ground Tracks werden am 180°-Meridian in separate `GroundTrackSegment`s
gesplittet. Kein "Strich durch die Welt" akzeptabel. Implementation in
`src/features/map/hooks/useAntimeridianSplit.ts`. Eigener Unit-Test ist Pflicht.

### 5.3 Fade-Out der letzten 20 % des Tracks

Nutzt MapLibre `line-gradient` Expression, **nicht** mehrere Layer. Fallback
auf diskrete Opacity-Segmente nur, wenn `line-gradient` nicht verfügbar.

### 5.4 1-Hz-Tick

Läuft **ausschließlich** im Worker-Intervall. Main Thread erhält Batches via
`postMessage` — niemals pro Satellit einzeln.

### 5.5 CelesTrak-Endpoints

```
Katalog:     https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json
Einzel-Sat:  https://celestrak.org/NORAD/elements/gp.php?CATNR=<id>&FORMAT=json
```

Keine anderen Endpoints. Keine Query-Varianten ohne ADR.

### 5.6 Caching

| Typ              | Storage   | TTL  | Strategie                        |
|------------------|-----------|------|----------------------------------|
| Katalog          | IndexedDB | 24h  | Stale-While-Revalidate           |
| Einzel-OMM       | IndexedDB | 24h  | Cache-First + Background-Update  |
| Map-Tiles        | Cache API | 7d   | Cache-First                      |
| App-Shell        | Cache API | perm | Precache                         |

---

## 6. Code-Qualitäts-Regeln

### TypeScript
- `strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.
- Keine `any`. Wenn unvermeidbar: `unknown` + Type-Guard.
- Öffentliche Modul-Exports brauchen explizite Return-Types.

### React
- Funktionskomponenten, keine Klassen.
- Custom Hooks für alles, was Side-Effects oder Store-Zugriffe hat.
- `useEffect` ist die Ausnahme, nicht die Regel — frag dich immer, ob ein
  abgeleiteter Wert oder ein Event-Handler reicht.

### Tests
- Pure Functions (classifier, formatters, fuzzyMatch, antimeridian):
  **100 % Unit-Test-Abdeckung.**
- Worker-Logik: Unit-Test gegen bekannte ISS-Position zu fixem Zeitstempel.
- Komponenten: Testing Library, nur kritische User-Flows.
- E2E: Nur Smoke-Test (`app startet, ISS ist sichtbar`).

### Commits
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Eine logische Änderung pro Commit.
- Kein `WIP`, kein `update`, kein `stuff`.

---

## 7. Arbeitsweise für Claude Code

### Immer zuerst
1. Prüfe, in welcher **Roadmap-Phase** (Abschnitt 13 des Architekturdokuments)
   wir uns befinden. Phase-fremde Features nicht vorschlagen.
2. Prüfe, ob das Ziel einen der spezialisierten **Subagents** braucht
   (`orbit-engineer`, `map-renderer`, `celestrak-integrator`,
   `architecture-reviewer`). Delegiere aktiv.
3. Bei Unsicherheit über Architektur-Konformität: **`/adr-check` ausführen**,
   bevor du Code schreibst.

### Immer
- Types zuerst schreiben, dann Implementation.
- Neuer Feature-Code kommt mit mindestens einem Test.
- Nach jeder Änderung: `npm run typecheck && npm run lint && npm run test`
  (oder `/verify`).
- Wenn ein Vorschlag gegen einen ADR verstößt: laut sagen, Alternative anbieten,
  nicht stillschweigend umgehen.

### Nie
- Nie `any` einführen, um einen Fehler "wegzumachen".
- Nie Propagations-Code im Main Thread platzieren.
- Nie neue Dependencies ohne Begründung installieren.
- Nie Scope erweitern (WON'T-Liste respektieren).
- Nie TLE-Parsing-Code schreiben.
- Nie Analytics/Tracker hinzufügen.

---

## 8. Referenzen

- Architekturdokument: `docs/architecture.md` (Single Source of Truth)
- CelesTrak: https://celestrak.org
- satellite.js: https://github.com/shashwatak/satellite-js
- MapLibre: https://maplibre.org
- OMM-Standard (CCSDS 502.0-B): https://public.ccsds.org