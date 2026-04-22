# Orbital Elements — From Physics to TLE and OMM

This document explains the classical Keplerian orbital elements, how they describe a satellite's orbit, and how they are encoded in the two common data formats: **Two-Line Element sets (TLE)** and **Orbit Mean-Motion Messages (OMM)**.

---

## 1. Why Orbital Elements?

A satellite in orbit is a point moving through three-dimensional space. At any given instant you could describe its state with six numbers: three for position (x, y, z) and three for velocity (vx, vy, vz). This works, but it has a problem — every second those numbers change completely.

Orbital elements describe the _shape and orientation of the orbit itself_, not the satellite's momentary position. For a purely Keplerian (two-body, no perturbations) orbit, five of the six elements are constant forever. Only one — the one that tracks _where along the orbit_ the satellite is right now — changes with time. This makes elements far more useful for storage, exchange, and propagation than raw state vectors.

---

## 2. The Six Classical Keplerian Elements

Every orbit is an ellipse. The six classical elements pin down that ellipse completely.

```
         ┌─────────────────────────────────────────────────┐
         │                  Orbital Plane                  │
         │                                                 │
         │          Apoapsis                               │
         │             *                                   │
         │          ·     ·                                │
         │       ·           ·                             │
         │     ·    (Focus=    ·                           │
         │    ·      Earth)     ·                          │
         │    ·       ★         ·  ← a (semi-major axis)   │
         │     ·               ·                           │
         │       ·           ·                             │
         │          ·     ·                                │
         │             *                                   │
         │          Periapsis                              │
         └─────────────────────────────────────────────────┘
```

### 2.1 Semi-Major Axis — _a_

The "average radius" of the ellipse, measured from its center to the far edge. It determines the **orbital period**: larger semi-major axis → slower orbit → longer period. This follows directly from Kepler's third law:

```
T² ∝ a³
```

For a circular orbit it equals the orbital radius. For the ISS, _a_ ≈ 6,780 km (about 400 km above Earth's surface).

### 2.2 Eccentricity — _e_

How _stretched_ the ellipse is, on a scale from 0 to 1 (exclusive for bound orbits):

| Value | Shape                                 |
| ----- | ------------------------------------- |
| 0.0   | Perfect circle                        |
| 0–0.1 | Nearly circular (most LEO satellites) |
| 0.74  | Highly elliptical (Molniya orbit)     |
| 1.0   | Parabolic escape trajectory           |

The ISS has _e_ ≈ 0.0003 — essentially circular.

### 2.3 Inclination — _i_

The tilt of the orbital plane relative to Earth's equatorial plane, in degrees (0° – 180°).

| Inclination | Description                                                  |
| ----------- | ------------------------------------------------------------ |
| 0°          | Equatorial orbit (follows the equator)                       |
| 28.5°       | ISS (latitude of Kennedy Space Center)                       |
| 90°         | Polar orbit (passes over both poles)                         |
| 98°         | Sun-synchronous (retrograde, used by Earth-observation sats) |
| > 90°       | Retrograde — orbits opposite to Earth's rotation             |

### 2.4 Right Ascension of the Ascending Node — _Ω_ (RAAN)

Inclination tells us the _tilt_ of the orbital plane, but not _where_ that tilted plane intersects the equator. RAAN is the angle (measured eastward from the vernal equinox, a fixed reference direction in inertial space) to the point where the satellite crosses the equator going _northward_ (the ascending node).

Think of it as the "longitude" of the orbital plane, but in inertial space — it does not rotate with Earth.

### 2.5 Argument of Perigee — _ω_

Within the orbital plane, this is the angle from the ascending node to the point of closest approach (perigee), measured in the direction of motion. It orients the ellipse _within_ the orbital plane.

For a circular orbit (_e_ = 0), perigee is undefined, so _ω_ is conventionally set to 0.

### 2.6 True Anomaly — _ν_ (or Mean Anomaly — _M_)

The final element: _where along the orbit is the satellite right now?_

- **True anomaly** (_ν_): the actual angle from perigee to the satellite's current position, measured at Earth's center. Directly geometric, but non-linear with time.
- **Mean anomaly** (_M_): a fictional angle that increases _linearly_ with time. At perigee M = 0°; one full orbit later M = 360°. Converting M → ν requires solving Kepler's equation.

TLE and OMM store **Mean Anomaly** because it is trivially propagated forward in time: `M(t) = M₀ + n·Δt`, where _n_ is the mean motion.

---

## 3. Beyond Kepler: Mean Motion and Perturbations

Real satellites are not in perfect Keplerian orbits. Earth is not a perfect sphere, atmospheric drag slows LEO satellites, the Moon and Sun pull, and solar radiation pressure pushes. Propagators like **SGP4/SDP4** account for these by working with _mean_ elements — averaged to remove short-period oscillations — and adding perturbation corrections analytically.

**Mean Motion** (_n_) replaces the semi-major axis in TLE/OMM because it is directly observable (count how many revolutions per day). The relationship is:

```
n = √( μ / a³ )      where μ = GM_Earth ≈ 3.986 × 10¹⁴ m³/s²
```

TLE/OMM store _n_ in **revolutions per day**. The ISS has _n_ ≈ 15.5 rev/day, giving a period of about 92 minutes.

---

## 4. Two-Line Element Sets (TLE)

TLE is a 50-year-old fixed-width ASCII format developed by NORAD. It encodes the mean elements (in the SGP4 mean element theory, also called TEME frame) as two 69-character lines plus an optional title line.

### 4.1 Structure

```
ISS (ZARYA)
1 25544U 98067A   24001.50000000  .00002182  00000-0  43227-4 0  9990
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50377579433733
```

**Line 1** — Metadata and time derivatives:

```
1 25544U 98067A   24001.50000000  .00002182  00000-0  43227-4 0  9990
│ │       │         │              │           │         │      │ │
│ │       │         │              │           │         │      │ └─ Checksum
│ │       │         │              │           │         │      └─── Element set number
│ │       │         │              │           │         └────────── BSTAR drag term
│ │       │         │              │           └──────────────────── Second derivative of mean motion
│ │       │         │              └──────────────────────────────── First derivative of mean motion (ballistic coeff)
│ │       │         └─────────────────────────────────────────────── Epoch (year + day-of-year + fractional day)
│ │       └───────────────────────────────────────────────────────── International Designator
│ └───────────────────────────────────────────────────────────────── NORAD Catalog Number
└─────────────────────────────────────────────────────────────────── Line number
```

**Line 2** — The orbital elements:

```
2 25544  51.6416 247.4627 0006703 130.5360 325.0288 15.50377579433733
│ │      │       │        │       │        │         │
│ │      │       │        │       │        │         └─ Revolution number at epoch
│ │      │       │        │       │        └─────────── Mean Anomaly (degrees)
│ │      │       │        │       └──────────────────── Argument of Perigee (degrees)
│ │      │       │        └──────────────────────────── Eccentricity (decimal point implied: 0006703 → 0.0006703)
│ │      │       └───────────────────────────────────── RAAN (degrees)
│ │      └───────────────────────────────────────────── Inclination (degrees)
│ └──────────────────────────────────────────────────── NORAD Catalog Number
└─────────────────────────────────────────────────────── Line number
```

### 4.2 Limitations of TLE

- **Fixed-width, column-sensitive.** A single misplaced character corrupts the data silently (only a single-digit checksum catches errors).
- **Implied decimal points.** Eccentricity stores `0006703` meaning `0.0006703`; BSTAR uses a non-standard scientific notation.
- **No metadata.** There is no field for satellite name, operator, launch date, or reference frame — you need a separate catalog lookup.
- **Reference frame implicit.** TLE elements are always in the TEME (True Equator, Mean Equinox) frame, but this is never stated in the format itself.
- **No version or schema.** Parsers must hard-code column offsets.

> **SOMA does not parse TLE.** Per ADR-002, SOMA uses OMM (JSON) exclusively, which avoids every one of these issues.

---

## 5. Orbit Mean-Motion Message (OMM)

OMM is the modern CCSDS standard (CCSDS 502.0-B) for exchanging mean orbital elements. CelesTrak serves OMM as JSON, making it trivially parseable with any JSON library.

### 5.1 Example (ISS)

```json
{
  "CCSDS_OMM_VERS": "2.0",
  "COMMENT": "GENERATED VIA SPACETRACK.ORG API",
  "CREATION_DATE": "2024-01-01T12:00:00.000000",
  "ORIGINATOR": "18 SPCS",
  "OBJECT_NAME": "ISS (ZARYA)",
  "OBJECT_ID": "1998-067A",
  "CENTER_NAME": "EARTH",
  "REF_FRAME": "TEME",
  "TIME_SYSTEM": "UTC",
  "MEAN_ELEMENT_THEORY": "SGP4",
  "EPOCH": "2024-001.50000000",
  "MEAN_MOTION": 15.50377579,
  "ECCENTRICITY": 0.0006703,
  "INCLINATION": 51.6416,
  "RA_OF_ASC_NODE": 247.4627,
  "ARG_OF_PERICENTER": 130.536,
  "MEAN_ANOMALY": 325.0288,
  "EPHEMERIS_TYPE": 0,
  "CLASSIFICATION_TYPE": "U",
  "NORAD_CAT_ID": 25544,
  "ELEMENT_SET_NO": 999,
  "REV_AT_EPOCH": 43373,
  "BSTAR": 0.000043227,
  "MEAN_MOTION_DOT": 0.00002182,
  "MEAN_MOTION_DDOT": 0.0
}
```

### 5.2 Field-to-Element Mapping

| OMM Field           | Keplerian Element            | Unit                   | TLE Equivalent                       |
| ------------------- | ---------------------------- | ---------------------- | ------------------------------------ |
| `MEAN_MOTION`       | Mean motion (_n_)            | rev/day                | Line 2, cols 53–63                   |
| `ECCENTRICITY`      | Eccentricity (_e_)           | dimensionless          | Line 2, cols 27–33 (implied decimal) |
| `INCLINATION`       | Inclination (_i_)            | degrees                | Line 2, cols 9–16                    |
| `RA_OF_ASC_NODE`    | RAAN (_Ω_)                   | degrees                | Line 2, cols 18–25                   |
| `ARG_OF_PERICENTER` | Argument of perigee (_ω_)    | degrees                | Line 2, cols 35–42                   |
| `MEAN_ANOMALY`      | Mean anomaly (_M_)           | degrees                | Line 2, cols 44–51                   |
| `BSTAR`             | Drag term                    | 1/earth-radii          | Line 1, cols 54–61                   |
| `MEAN_MOTION_DOT`   | First time derivative of _n_ | rev/day²               | Line 1, cols 34–43                   |
| `EPOCH`             | Reference time               | ISO 8601 / day-of-year | Line 1, cols 19–32                   |

### 5.3 Advantages over TLE

| Property                                 | TLE                        | OMM (JSON)                                |
| ---------------------------------------- | -------------------------- | ----------------------------------------- |
| Human-readable field names               | No                         | Yes                                       |
| Explicit reference frame                 | No (always TEME, implicit) | Yes (`REF_FRAME`)                         |
| Explicit time system                     | No                         | Yes (`TIME_SYSTEM`)                       |
| Machine-parseable without column offsets | No                         | Yes                                       |
| Extensible                               | No                         | Yes (standard allows custom keywords)     |
| Rich satellite metadata                  | No                         | Partial (name, COSPAR ID, classification) |
| Error detection                          | 1-digit checksum           | JSON structural validation                |

---

## 6. From Elements to Position: SGP4 Propagation

Given a set of mean elements at epoch, SGP4 computes the satellite's position at any other time _t_:

```
1. Advance Mean Anomaly:   M(t) = M₀ + n·Δt
2. Solve Kepler's equation: M = E − e·sin(E)  →  eccentric anomaly E
3. Compute true anomaly ν  from E and e
4. Apply perturbation corrections for:
   - Earth's oblateness (J2, J3, J4 zonal harmonics)
   - Atmospheric drag (using BSTAR)
   - Solar/lunar gravity (SDP4 only, for deep-space orbits with period > 225 min)
5. Rotate from orbital plane into TEME frame using i, Ω, ω
6. Optionally rotate TEME → ITRF (Earth-fixed) to get geodetic lat/lon/alt
```

SOMA runs this entirely in a **Web Worker** (ADR-004) at 1 Hz, receiving batches of positions on the main thread via `postMessage`.

---

## 7. Orbit Classification in SOMA

SOMA uses `MEAN_MOTION` to classify orbits for rendering decisions (ADR-007):

| Class | Mean Motion              | Typical Altitude  | Examples                   |
| ----- | ------------------------ | ----------------- | -------------------------- |
| LEO   | > 11.25 rev/day          | 200–2,000 km      | ISS, Starlink, Hubble      |
| MEO   | 1.8–2.5 rev/day          | 2,000–35,786 km   | GPS, Galileo, GLONASS      |
| GEO   | 0.95–1.05 rev/day        | ~35,786 km        | Weather sats, TV broadcast |
| HEO   | < 11.25, outside MEO/GEO | Highly elliptical | Molniya, Tundra            |

GEO satellites have a ground track that is (ideally) a single stationary point — no track is rendered, only a marker. All other classes receive a 90-minute track with a fade-out gradient over the last 20% of the path.

---

## 8. Further Reading

- **CCSDS 502.0-B** — Orbit Data Messages standard (defines OMM formally)
- **Vallado, D.A.** — _Fundamentals of Astrodynamics and Applications_ (SGP4 reference implementation)
- **Hoots & Roehrich (1980)** — _Spacetrack Report No. 3_ (original SGP4 paper)
- [CelesTrak GP data documentation](https://celestrak.org/NORAD/documentation/)
- [satellite.js](https://github.com/shashwatak/satellite-js) — the SGP4 library used by SOMA
