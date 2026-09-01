import {
  equatorialToHorizontalAtHourAngle,
  localSiderealTimeDegrees,
} from '../astronomy/coordinates'
import type { EquatorialCoordinates, ObserverLocation } from '../astronomy/coordinates'
import { DEG_TO_RAD, RAD_TO_DEG, clamp, normalizeDegrees } from '../mathUtils'
import { projectHorizontalToSphere } from './skyProjection'
import { starfieldConfig } from './starfieldConfig'
import type { StarPosition } from './starTypes'

/**
 * Galactic (J2000, IAU 1958 system) -> equatorial (J2000) rotation matrix,
 * as commonly published (e.g. Hipparcos catalogue documentation, Astropy's
 * `Galactic` frame). Used as-is, not derived here — see galacticToEquatorial.
 * This is the equatorial->galactic matrix; galacticToEquatorial applies its
 * transpose (rotation matrices are orthogonal, so the inverse is the transpose).
 */
const EQUATORIAL_TO_GALACTIC_MATRIX: readonly (readonly number[])[] = [
  [-0.0548755604, -0.8734370902, -0.4838350155],
  [0.4941094279, -0.44482963, 0.7469822445],
  [-0.867666149, -0.1980763734, 0.4559837762],
]

/**
 * Converts galactic longitude/latitude to equatorial coordinates. Exact
 * enough to place a recognizable Milky Way band (galactic center near
 * Sagittarius, plane crossing Cygnus/Cassiopeia, etc.) without needing a full
 * astronomy library — 4次 Task 2 explicitly doesn't require precise galactic
 * coordinate conversion, only a plausible-looking band (see
 * docs/features/phase-4-implementation-tasks.md).
 */
export function galacticToEquatorial(
  lDegrees: number,
  bDegrees: number,
): EquatorialCoordinates {
  const lRad = lDegrees * DEG_TO_RAD
  const bRad = bDegrees * DEG_TO_RAD

  const xg = Math.cos(bRad) * Math.cos(lRad)
  const yg = Math.cos(bRad) * Math.sin(lRad)
  const zg = Math.sin(bRad)

  const m = EQUATORIAL_TO_GALACTIC_MATRIX
  const xe = m[0][0] * xg + m[1][0] * yg + m[2][0] * zg
  const ye = m[0][1] * xg + m[1][1] * yg + m[2][1] * zg
  const ze = m[0][2] * xg + m[1][2] * yg + m[2][2] * zg

  const decDegrees = Math.asin(clamp(ze, -1, 1)) * RAD_TO_DEG
  const raDegrees = normalizeDegrees(Math.atan2(ye, xe) * RAD_TO_DEG)
  return { raHours: raDegrees / 15, decDegrees }
}

/** One Milky Way particle's placement + how bright it should render (0-1, peaking at the galactic plane). */
export interface MilkyWayPoint {
  position: StarPosition
  brightness: number
}

interface MilkyWayCatalogEntry {
  lDegrees: number
  bDegrees: number
  brightness: number
}

/** Deterministic pseudo-random value in [0, 1), seeded by an arbitrary number — same technique as starVisualAttributes.ts, so the band's particle layout stays fixed across date/location recomputes instead of reshuffling every frame. */
function seededUnitRandom(seed: number): number {
  const x = Math.sin(seed) * 43758.5453
  return x - Math.floor(x)
}

let cachedCatalog: MilkyWayCatalogEntry[] | null = null

/**
 * Builds a fixed set of (galactic longitude, latitude, brightness) samples
 * scattered around the galactic plane (b=0), generated once and cached —
 * conceptually the Milky Way's own "catalog", analogous to
 * hygCatalogSource.ts's loadHygStarCatalog for real stars.
 *
 * Latitude is drawn from the average of two seeded uniform(-1, 1) samples,
 * giving a triangular distribution peaking at b=0 and bounded by
 * ±bandWidthDegrees — clustering more particles near the plane is what makes
 * the result read as a band rather than a uniform scatter. Brightness falls
 * off linearly with distance from the plane for the same reason.
 */
function buildMilkyWayCatalog(): MilkyWayCatalogEntry[] {
  if (cachedCatalog !== null) return cachedCatalog

  const { particleCount, bandWidthDegrees } = starfieldConfig.milkyWay
  const catalog: MilkyWayCatalogEntry[] = []
  for (let i = 0; i < particleCount; i++) {
    const lDegrees = seededUnitRandom(i * 12.9898 + 1) * 360
    const latUnit =
      (seededUnitRandom(i * 78.233 + 2) + seededUnitRandom(i * 39.425 + 3)) -
      1
    const bDegrees = latUnit * bandWidthDegrees
    const brightness = clamp(1 - Math.abs(latUnit), 0, 1)
    catalog.push({ lDegrees, bDegrees, brightness })
  }

  cachedCatalog = catalog
  return catalog
}

/**
 * Places the Milky Way band on the sky sphere for a given observer location
 * and instant, mirroring realStarDataSource.ts's generateRealStarData: the
 * underlying (galactic) catalog is fixed, only the alt/az (and therefore
 * sphere position) is recomputed per call. Particles below the horizon are
 * dropped, same as real stars.
 */
export function generateMilkyWayBand(
  location: ObserverLocation,
  date: Date,
): MilkyWayPoint[] {
  const lstDegrees = localSiderealTimeDegrees(date, location.longitudeDegrees)
  const points: MilkyWayPoint[] = []

  for (const entry of buildMilkyWayCatalog()) {
    const equatorial = galacticToEquatorial(entry.lDegrees, entry.bDegrees)
    const hourAngleDegrees = lstDegrees - equatorial.raHours * 15
    const horizontal = equatorialToHorizontalAtHourAngle(
      equatorial.decDegrees,
      hourAngleDegrees,
      location.latitudeDegrees,
    )
    if (horizontal.altitudeDegrees < 0) continue

    points.push({
      position: projectHorizontalToSphere(horizontal),
      brightness: entry.brightness,
    })
  }

  return points
}
