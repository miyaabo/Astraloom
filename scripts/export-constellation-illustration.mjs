// Dev tool: prints one constellation's illustration-generation JSON (star
// id/2D position/magnitude + line connections by star id) to stdout, so the
// output of src/constellations/constellationProjection.ts's
// computeConstellationIllustrationData can be eyeballed without going
// through the running app. Reads the same two bundled data files that
// function reads at runtime (src/constellations/data/constellationCatalog.json,
// src/stars/data/hygCatalog.json) and reimplements its projection math
// directly, since scripts/ don't import src/*.ts elsewhere in this repo
// (there's no ts-node/tsx in devDependencies) — keep this in sync with
// computeConstellationIllustrationData if that projection ever changes.
//
// Usage:
//   node scripts/export-constellation-illustration.mjs [constellationId]
//   (defaults to "Ori" / Orion; ids are d3-celestial IAU abbreviations, see
//   src/constellations/data/constellationCatalog.json)
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')
const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

const constellationId = process.argv[2] ?? 'Ori'

const catalog = JSON.parse(
  readFileSync(
    path.join(ROOT, 'src/constellations/data/constellationCatalog.json'),
    'utf-8',
  ),
)
const hygCatalog = JSON.parse(
  readFileSync(path.join(ROOT, 'src/stars/data/hygCatalog.json'), 'utf-8'),
)
const starsById = new Map(hygCatalog.map((star) => [star.id, star]))

function equatorialCenter(segments) {
  const uniqueStarIds = new Set(segments.flat())
  let sumX = 0
  let sumY = 0
  let sumZ = 0
  for (const starId of uniqueStarIds) {
    const star = starsById.get(starId)
    if (!star) continue
    const raRad = star.raHours * 15 * DEG_TO_RAD
    const decRad = star.decDegrees * DEG_TO_RAD
    sumX += Math.cos(decRad) * Math.cos(raRad)
    sumY += Math.cos(decRad) * Math.sin(raRad)
    sumZ += Math.sin(decRad)
  }
  const length = Math.hypot(sumX, sumY, sumZ)
  if (length === 0) return null
  return {
    raHours: (Math.atan2(sumY, sumX) * RAD_TO_DEG) / 15,
    decDegrees: Math.asin(sumZ / length) * RAD_TO_DEG,
  }
}

/**
 * Uses the same fixed gnomonic projection as
 * computeConstellationIllustrationData in constellationProjection.ts.
 * Exported for the batch script; the single-constellation CLI below retains
 * its original stdout-only behavior.
 */
export function createConstellationIllustrationData(constellation) {
  const center = equatorialCenter(constellation.segments)
  if (!center) return null

  const centerRaRad = center.raHours * 15 * DEG_TO_RAD
  const centerDecRad = center.decDegrees * DEG_TO_RAD

  function projectToTangentPlane(star) {
    const raRad = star.raHours * 15 * DEG_TO_RAD
    const decRad = star.decDegrees * DEG_TO_RAD
    const cosc =
      Math.sin(centerDecRad) * Math.sin(decRad) +
      Math.cos(centerDecRad) * Math.cos(decRad) * Math.cos(raRad - centerRaRad)
    return {
      x:
        ((Math.cos(decRad) * Math.sin(raRad - centerRaRad)) / cosc) *
        RAD_TO_DEG,
      y:
        ((Math.cos(centerDecRad) * Math.sin(decRad) -
          Math.sin(centerDecRad) *
            Math.cos(decRad) *
            Math.cos(raRad - centerRaRad)) /
          cosc) *
        RAD_TO_DEG,
    }
  }

  const uniqueStarIds = [...new Set(constellation.segments.flat())]
  const stars = []
  for (const starId of uniqueStarIds) {
    const star = starsById.get(starId)
    if (!star) continue
    const { x, y } = projectToTangentPlane(star)
    stars.push({ id: starId, x, y, magnitude: star.magnitude })
  }

  const lines = constellation.segments
    .filter(([from, to]) => starsById.has(from) && starsById.has(to))
    .map(([from, to]) => ({ from, to }))

  return {
    constellationId: constellation.id,
    name: constellation.name,
    nameJa: constellation.nameJa,
    stars,
    lines,
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const constellation = catalog.find((entry) => entry.id === constellationId)
  if (!constellation) {
    console.error(`Unknown constellation id: ${constellationId}`)
    console.error(
      'See src/constellations/data/constellationCatalog.json for valid ids.',
    )
    process.exit(1)
  }

  const illustrationData = createConstellationIllustrationData(constellation)
  if (!illustrationData) {
    console.error('No resolvable center for this constellation.')
    process.exit(1)
  }

  console.log(JSON.stringify(illustrationData, null, 2))
}
