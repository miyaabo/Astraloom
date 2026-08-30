#!/usr/bin/env node
// Preprocesses d3-celestial's constellation line/name GeoJSON (DECISIONS.md
// D015) into the lightweight catalog bundled at
// src/constellations/data/constellationCatalog.json. Run manually when the
// raw data needs to be (re)generated — not part of `npm run build`.
//
// Usage:
//   node scripts/build-constellation-catalog.mjs
//
// Reads two raw inputs (not committed, see data/raw/ in .gitignore):
//   data/raw/d3-celestial-constellations.lines.json
//   data/raw/d3-celestial-constellations.json
// Download them first:
//   curl -L -o data/raw/d3-celestial-constellations.lines.json \
//     https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json
//   curl -L -o data/raw/d3-celestial-constellations.json \
//     https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.json
//
// Line vertices are given as RA/Dec (degrees) rather than HYG star ids, so
// each vertex is matched to the nearest star already present in the bundled
// src/stars/data/hygCatalog.json (built by build-hyg-catalog.mjs) by
// angular separation. Matching against the already-filtered (mag<=6.5)
// catalog, rather than the full raw HYG data, guarantees every id this
// script emits is one the app can actually resolve at runtime.
//
// The names file's per-constellation `properties.ja` (Japanese name, e.g.
// "わし座") is bundled as `nameJa` (Task 4) — it's part of the same
// BSD-3-Clause d3-celestial dataset already vetted for D015, not a new data
// source.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const linesPath = path.join(
  rootDir,
  'data/raw/d3-celestial-constellations.lines.json',
)
const namesPath = path.join(
  rootDir,
  'data/raw/d3-celestial-constellations.json',
)
const hygCatalogPath = path.join(rootDir, 'src/stars/data/hygCatalog.json')
const outputPath = path.join(
  rootDir,
  'src/constellations/data/constellationCatalog.json',
)

// Vertex-to-star matches observed in practice land within ~0.01deg; a wider
// tolerance still rejects any vertex that isn't really the same star.
const MAX_MATCH_DISTANCE_DEGREES = 0.1

for (const p of [linesPath, namesPath, hygCatalogPath]) {
  if (!existsSync(p)) {
    console.error(`Required input not found: ${p}`)
    console.error('See the usage comment at the top of this script.')
    process.exit(1)
  }
}

const lines = JSON.parse(readFileSync(linesPath, 'utf8'))
const names = JSON.parse(readFileSync(namesPath, 'utf8'))
const hygCatalog = JSON.parse(readFileSync(hygCatalogPath, 'utf8'))

if (lines.features.length !== names.features.length) {
  throw new Error(
    `Line/name feature count mismatch: ${lines.features.length} vs ${names.features.length}`,
  )
}
for (let i = 0; i < lines.features.length; i++) {
  if (lines.features[i].id !== names.features[i].id) {
    throw new Error(
      `Line/name feature order mismatch at index ${i}: ${lines.features[i].id} vs ${names.features[i].id}`,
    )
  }
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

/** Great-circle angular separation (degrees) between two RA/Dec points. */
function angularSeparationDegrees(raDeg1, decDeg1, raDeg2, decDeg2) {
  const ra1 = toRadians(raDeg1)
  const dec1 = toRadians(decDeg1)
  const ra2 = toRadians(raDeg2)
  const dec2 = toRadians(decDeg2)
  const cosSeparation =
    Math.sin(dec1) * Math.sin(dec2) +
    Math.cos(dec1) * Math.cos(dec2) * Math.cos(ra1 - ra2)
  return (Math.acos(Math.min(1, Math.max(-1, cosSeparation))) * 180) / Math.PI
}

/** Finds the bundled HYG star nearest a GeoJSON [lon, lat] vertex (RA/Dec degrees). */
function findNearestStar(lonDegrees, latDegrees) {
  const raDegrees = ((lonDegrees % 360) + 360) % 360

  let nearest = null
  let nearestDistance = Infinity
  for (const star of hygCatalog) {
    const distance = angularSeparationDegrees(
      star.raHours * 15,
      star.decDegrees,
      raDegrees,
      latDegrees,
    )
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = star
    }
  }
  return { star: nearest, distance: nearestDistance }
}

const constellations = []
let unmatchedVertexCount = 0

for (let i = 0; i < lines.features.length; i++) {
  const lineFeature = lines.features[i]
  const nameFeature = names.features[i]

  const segments = []
  for (const polyline of lineFeature.geometry.coordinates) {
    const starIds = []
    for (const [lonDegrees, latDegrees] of polyline) {
      const { star, distance } = findNearestStar(lonDegrees, latDegrees)
      if (star === null || distance > MAX_MATCH_DISTANCE_DEGREES) {
        unmatchedVertexCount++
        starIds.push(null)
        continue
      }
      starIds.push(star.id)
    }
    for (let v = 0; v < starIds.length - 1; v++) {
      const a = starIds[v]
      const b = starIds[v + 1]
      if (a === null || b === null) continue
      segments.push([a, b])
    }
  }

  constellations.push({
    id: lineFeature.id,
    name: nameFeature.properties.name,
    nameJa: nameFeature.properties.ja,
    segments,
  })
}

if (unmatchedVertexCount > 0) {
  console.warn(
    `${unmatchedVertexCount} vertex(es) had no star match within ${MAX_MATCH_DISTANCE_DEGREES}deg; affected segments were dropped.`,
  )
}

writeFileSync(outputPath, JSON.stringify(constellations))

console.log(
  `Wrote ${constellations.length} constellations (${constellations.reduce((n, c) => n + c.segments.length, 0)} segments) to ${path.relative(rootDir, outputPath)}`,
)
