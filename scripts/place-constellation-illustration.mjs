// Dev tool (Orion only, for now): checks whether a hand-drawn no-line
// illustration can be placed against the real constellation skeleton
// (scripts/export-constellation-illustration.mjs's gnomonic-projected star
// positions — that projection itself is NOT touched by this script).
//
// A few image-pixel anchor points (below) mark where specific HYG star ids
// visually land on the illustration (e.g. Meissa = the head, Rigel/Saiph =
// the feet). From those correspondences this script fits a similarity
// transform (uniform scale + rotation + translation — least-squares over all
// anchors, not just a minimal 2-point solve) that maps every skeleton star
// into the illustration's own pixel space, then draws the transformed
// skeleton (dots + lines) on top of the illustration into one self-contained
// SVG for human review.
//
// This is deliberately a single-constellation, throwaway-checkable
// prototype — not the anchor-authoring pipeline
// (public/no-line/constellation-anchors.json,
// scripts/build-constellation-art-catalog.mjs) that Phase 13 tried and
// backed out of for a full sky-sphere fit. If this placement approach holds
// up across more constellations, promote the anchors below into that (or a
// similar) data file instead of hand-editing more of them into this script.
//
// Usage: node scripts/place-constellation-illustration.mjs
// Output: tmp/constellation-guides/Ori-placement-check.svg
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CONSTELLATION_ID = 'Ori'
const ILLUSTRATION_PATH = path.join(ROOT, 'public/no-line/Orion_線なし.png')
const ILLUSTRATION_SIZE_PX = 1254

// Hand-picked by eye against a pixel grid overlaid on the illustration
// (identified by magnitude against known values: Betelgeuse ~0.4, Rigel
// ~0.1, Bellatrix ~1.6, Saiph ~2.1, Meissa ~3.4 — matching stars 27919,
// 24378, 25273, 27298, 26142 in the HYG catalog). Which shoulder/foot pixel
// pairs with which star was chosen by comparing this script's own
// least-squares residual across all 4 combinations of
// {Bellatrix,Betelgeuse}x{shoulder pixels} and {Rigel,Saiph}x{foot pixels} —
// this pairing is specific to this script's flat, observer-independent
// gnomonic skeleton (computeConstellationIllustrationData's fixed RA/Dec
// tangent plane). It is NOT necessarily the same pairing the live renderer's
// anchors use (src/constellations/data/constellationArt.json) — that fit is
// against real alt/az positions at a specific moment, a different tangent
// plane with its own orientation/chirality, and was separately verified
// on-screen in the actual app rather than against this script's output.
const ANCHORS = [
  { starId: 26142, pixelX: 683, pixelY: 376, label: 'Meissa (head)' },
  { starId: 25273, pixelX: 602, pixelY: 464, label: 'Bellatrix (shoulder)' },
  { starId: 27919, pixelX: 740, pixelY: 451, label: 'Betelgeuse (shoulder)' },
  { starId: 22396, pixelX: 339, pixelY: 589, label: 'Tabit (outer pelt edge)' },
  { starId: 24378, pixelX: 439, pixelY: 1104, label: 'Rigel (foot)' },
  { starId: 27298, pixelX: 803, pixelY: 1141, label: 'Saiph (foot)' },
]

const skeletonJson = execFileSync(
  'node',
  [
    path.join(ROOT, 'scripts/export-constellation-illustration.mjs'),
    CONSTELLATION_ID,
  ],
  { encoding: 'utf-8' },
)
const skeleton = JSON.parse(skeletonJson)
const skeletonStarsById = new Map(skeleton.stars.map((star) => [star.id, star]))

/**
 * Least-squares similarity fit (uniform scale + rotation + translation)
 * mapping `from` points onto `to` points, solved as one complex-number least
 * squares problem: minimize sum |z*from_i' - to_i'| where the primes are
 * centroid-relative points and z encodes scale*rotation together. This
 * generalizes the "similarity fit from 2 anchors" idea mentioned in
 * constellationArtTypes.ts to any number >= 2, using every anchor instead of
 * discarding the extras.
 */
function fitSimilarityTransform(correspondences) {
  const n = correspondences.length
  const centroidFrom = { x: 0, y: 0 }
  const centroidTo = { x: 0, y: 0 }
  for (const { from, to } of correspondences) {
    centroidFrom.x += from.x / n
    centroidFrom.y += from.y / n
    centroidTo.x += to.x / n
    centroidTo.y += to.y / n
  }

  let a = 0
  let b = 0
  let c = 0
  for (const { from, to } of correspondences) {
    const fx = from.x - centroidFrom.x
    const fy = from.y - centroidFrom.y
    const tx = to.x - centroidTo.x
    const ty = to.y - centroidTo.y
    a += fx * tx + fy * ty
    b += fx * ty - fy * tx
    c += fx * fx + fy * fy
  }
  const zx = a / c
  const zy = b / c

  return (point) => {
    const fx = point.x - centroidFrom.x
    const fy = point.y - centroidFrom.y
    return {
      x: zx * fx - zy * fy + centroidTo.x,
      y: zx * fy + zy * fx + centroidTo.y,
    }
  }
}

// Skeleton coordinates are plain math orientation (y increasing = north/up,
// same as computeConstellationIllustrationData); image pixel coordinates
// grow downward. That's a reflection, not a rotation, so it must be applied
// before the similarity fit below — a pure rotation+scale can't produce it,
// and trying anyway just drags every point toward a bad compromise. Flipping
// y here mirrors the same choice render-constellation-guide.mjs makes for
// its skeleton-only guide image.
function toMathSpace(star) {
  return { x: star.x, y: -star.y }
}

const correspondences = ANCHORS.map((anchor) => {
  const star = skeletonStarsById.get(anchor.starId)
  if (!star) {
    throw new Error(
      `Anchor star ${anchor.starId} not found in ${CONSTELLATION_ID} skeleton`,
    )
  }
  return {
    from: toMathSpace(star),
    to: { x: anchor.pixelX, y: anchor.pixelY },
  }
})
const transform = fitSimilarityTransform(correspondences)

const magnitudes = skeleton.stars.map((star) => star.magnitude)
const minMagnitude = Math.min(...magnitudes)
const maxMagnitude = Math.max(...magnitudes)
const magnitudeRange = maxMagnitude - minMagnitude
const MIN_STAR_RADIUS_PX = 4
const MAX_STAR_RADIUS_PX = 14

function starRadius(magnitude) {
  if (magnitudeRange === 0) {
    return (MIN_STAR_RADIUS_PX + MAX_STAR_RADIUS_PX) / 2
  }
  const brightness = (maxMagnitude - magnitude) / magnitudeRange
  return (
    MIN_STAR_RADIUS_PX + brightness * (MAX_STAR_RADIUS_PX - MIN_STAR_RADIUS_PX)
  )
}

const positionsById = new Map(
  skeleton.stars.map((star) => [star.id, transform(toMathSpace(star))]),
)
const anchorStarIds = new Set(ANCHORS.map((anchor) => anchor.starId))

const lineElements = skeleton.lines
  .map(({ from, to }) => {
    const start = positionsById.get(from)
    const end = positionsById.get(to)
    if (!start || !end) return ''
    return `  <line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="#ffd166" stroke-width="2" stroke-opacity="0.85" />`
  })
  .join('\n')

const starElements = skeleton.stars
  .map((star) => {
    const { x, y } = positionsById.get(star.id)
    const radius = starRadius(star.magnitude)
    const isAnchor = anchorStarIds.has(star.id)
    const fill = isAnchor ? '#ff2e63' : '#ffffff'
    const dot = `  <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius.toFixed(2)}" fill="${fill}" stroke="#000000" stroke-width="0.75" />`
    const label = `  <text x="${(x + radius + 3).toFixed(2)}" y="${(y - radius - 3).toFixed(2)}" font-size="14" font-family="monospace" fill="#ffd166">${star.id}</text>`
    return `${dot}\n${label}`
  })
  .join('\n')

const illustrationBase64 = readFileSync(ILLUSTRATION_PATH).toString('base64')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ILLUSTRATION_SIZE_PX}" height="${ILLUSTRATION_SIZE_PX}" viewBox="0 0 ${ILLUSTRATION_SIZE_PX} ${ILLUSTRATION_SIZE_PX}">
  <!-- Placement check for ${skeleton.name} (${skeleton.nameJa}): the no-line illustration with the real star skeleton (yellow lines/labels, white dots; red dots are the anchors used to fit the transform) drawn on top via a least-squares similarity fit. Dev confirmation only, not shipped UI. -->
  <rect width="${ILLUSTRATION_SIZE_PX}" height="${ILLUSTRATION_SIZE_PX}" fill="#0b0d14" />
  <image href="data:image/png;base64,${illustrationBase64}" width="${ILLUSTRATION_SIZE_PX}" height="${ILLUSTRATION_SIZE_PX}" />
${lineElements}
${starElements}
</svg>
`

const outDir = path.join(ROOT, 'tmp/constellation-guides')
mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `${CONSTELLATION_ID}-placement-check.svg`)
writeFileSync(outPath, svg, 'utf-8')

console.log(`Wrote ${path.relative(ROOT, outPath)}`)
