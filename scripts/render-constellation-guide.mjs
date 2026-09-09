// Dev tool: renders one constellation's illustration-generation JSON (from
// scripts/export-constellation-illustration.mjs) as a flat 1024x1024 SVG
// "skeleton guide" — stars as dots (sized by magnitude), constellation lines
// as line segments, star ids as small labels. This is NOT meant to look like
// finished art: it exists so a later illustration-generation step has an
// exact, undistorted reference for the constellation's shape, orientation,
// and proportions to draw on top of. Does not touch or reimplement the
// gnomonic projection itself — it shells out to
// export-constellation-illustration.mjs and only does 2D layout (uniform
// scale-to-fit + a Y-axis flip so north/positive-dec points up the image).
//
// Usage:
//   node scripts/render-constellation-guide.mjs [constellationId]
//   (defaults to "Ori" / Orion)
//   node scripts/render-constellation-guide.mjs --input <illustration-json>
//
// Output: tmp/constellation-guides/<constellationId>.svg (gitignored scratch,
// same convention as tmp/constellation-captures/ used by the other
// constellation dev scripts). Open the file directly in a browser or image
// viewer to review it.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const CANVAS_SIZE = 1024
const PADDING_RATIO = 0.12
const MIN_STAR_RADIUS_PX = 3
const MAX_STAR_RADIUS_PX = 11
const BACKGROUND_COLOR = '#0b0d14'
const STAR_COLOR = '#ffffff'
const LINE_COLOR = '#7f93b8'
const LABEL_COLOR = '#5c6b85'

const constellationId = process.argv[2] ?? 'Ori'
const inputPath = process.argv[2] === '--input' ? process.argv[3] : null

if (process.argv[2] === '--input' && !inputPath) {
  console.error('Missing illustration JSON path after --input.')
  process.exit(1)
}

const illustrationJson = inputPath
  ? readFileSync(path.resolve(ROOT, inputPath), 'utf-8')
  : execFileSync(
      'node',
      [
        path.join(ROOT, 'scripts/export-constellation-illustration.mjs'),
        constellationId,
      ],
      { encoding: 'utf-8' },
    )
const data = JSON.parse(illustrationJson)

if (data.stars.length === 0) {
  console.error(`No stars to render for constellation: ${constellationId}`)
  process.exit(1)
}

const xs = data.stars.map((star) => star.x)
const ys = data.stars.map((star) => star.y)
const minX = Math.min(...xs)
const maxX = Math.max(...xs)
const minY = Math.min(...ys)
const maxY = Math.max(...ys)
const centerX = (minX + maxX) / 2
const centerY = (minY + maxY) / 2

const usableSize = CANVAS_SIZE * (1 - 2 * PADDING_RATIO)
const spanX = maxX - minX
const spanY = maxY - minY
// A single-point or perfectly straight-line constellation would divide by
// zero; fall back to no scaling in that degenerate case (not expected for
// any real catalog entry).
const scale =
  Math.max(spanX, spanY) > 0 ? usableSize / Math.max(spanX, spanY) : 1

// Data space is standard math orientation (y up); SVG y grows downward, so
// flip it to keep positive declination (north) pointing up the image, same
// convention as a normal star chart.
function toImageSpace({ x, y }) {
  return {
    x: CANVAS_SIZE / 2 + (x - centerX) * scale,
    y: CANVAS_SIZE / 2 - (y - centerY) * scale,
  }
}

const magnitudes = data.stars.map((star) => star.magnitude)
const minMagnitude = Math.min(...magnitudes)
const maxMagnitude = Math.max(...magnitudes)
const magnitudeRange = maxMagnitude - minMagnitude

function starRadius(magnitude) {
  if (magnitudeRange === 0) {
    return (MIN_STAR_RADIUS_PX + MAX_STAR_RADIUS_PX) / 2
  }
  // Lower (or negative) magnitude means a brighter star, so it maps to the
  // larger end of the radius range.
  const brightness = (maxMagnitude - magnitude) / magnitudeRange
  return (
    MIN_STAR_RADIUS_PX + brightness * (MAX_STAR_RADIUS_PX - MIN_STAR_RADIUS_PX)
  )
}

const positionsById = new Map(
  data.stars.map((star) => [star.id, toImageSpace(star)]),
)

const lineElements = data.lines
  .map(({ from, to }) => {
    const start = positionsById.get(from)
    const end = positionsById.get(to)
    if (!start || !end) return ''
    return `  <line x1="${start.x.toFixed(2)}" y1="${start.y.toFixed(2)}" x2="${end.x.toFixed(2)}" y2="${end.y.toFixed(2)}" stroke="${LINE_COLOR}" stroke-width="1.5" />`
  })
  .join('\n')

const starElements = data.stars
  .map((star) => {
    const { x, y } = positionsById.get(star.id)
    const radius = starRadius(star.magnitude)
    const dot = `  <circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius.toFixed(2)}" fill="${STAR_COLOR}" />`
    const label = `  <text x="${(x + radius + 2).toFixed(2)}" y="${(y - radius - 2).toFixed(2)}" font-size="10" font-family="monospace" fill="${LABEL_COLOR}">${star.id}</text>`
    return `${dot}\n${label}`
  })
  .join('\n')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
  <!-- Skeleton guide for illustration generation: ${data.name} (${data.nameJa}, ${data.constellationId}). Star positions and lines follow exact catalog geometry; this is a reference layout, not finished art. -->
  <rect width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" fill="${BACKGROUND_COLOR}" />
${lineElements}
${starElements}
</svg>
`

const outDir = path.join(ROOT, 'tmp/constellation-guides')
mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `${data.constellationId}.svg`)
writeFileSync(outPath, svg, 'utf-8')

console.log(`Wrote ${path.relative(ROOT, outPath)}`)
