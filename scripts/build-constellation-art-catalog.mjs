// Converts the hand-authored constellation art anchor data
// (public/no-line/constellation-anchors.json — normalized 0-1 image
// coordinates, human-readable `role` labels, `unmapped`/`notes` for review)
// into the runtime catalog (src/constellations/data/constellationArt.json —
// ConstellationArtRecord[], pixel coordinates, no authoring-only fields).
// See src/constellations/constellationArtTypes.ts for the runtime shape and
// docs/features/phase-13-implementation-tasks.md Task 4 for background.
//
// Usage: node scripts/build-constellation-art-catalog.mjs
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const ANCHORS_PATH = path.join(
  ROOT,
  'public/no-line/constellation-anchors.json',
)
const OUTPUT_PATH = path.join(
  ROOT,
  'src/constellations/data/constellationArt.json',
)

/**
 * Reads a PNG's width/height straight from its IHDR chunk (bytes 16-23),
 * rather than adding an image-dimensions dependency for this one build
 * script (CLAUDE.md: don't add a dependency before checking it's needed).
 */
async function readPngDimensions(absolutePath) {
  const buffer = await readFile(absolutePath)
  const signatureOk =
    buffer.length >= 24 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  if (!signatureOk) {
    throw new Error(`Not a PNG file: ${absolutePath}`)
  }
  return {
    widthPx: buffer.readUInt32BE(16),
    heightPx: buffer.readUInt32BE(20),
  }
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

async function main() {
  const raw = JSON.parse(await readFile(ANCHORS_PATH, 'utf-8'))
  const records = []
  const problems = []

  for (const entry of raw.constellations) {
    const { constellationId, image, artBounds, anchors, unmapped } = entry

    if (!image || !image.startsWith('/no-line/')) {
      problems.push(`${constellationId}: image path must start with /no-line/`)
      continue
    }
    const imagePath = path.join(ROOT, 'public', image)
    let dimensions
    try {
      dimensions = await readPngDimensions(imagePath)
    } catch (err) {
      problems.push(`${constellationId}: ${err.message}`)
      continue
    }
    const { widthPx, heightPx } = dimensions

    if (
      !artBounds ||
      !isFiniteNumber(artBounds.minX) ||
      !isFiniteNumber(artBounds.minY) ||
      !isFiniteNumber(artBounds.maxX) ||
      !isFiniteNumber(artBounds.maxY)
    ) {
      problems.push(`${constellationId}: missing/invalid artBounds`)
      continue
    }

    // An authoring record may deliberately have no anchors while its capture
    // vertices are being reviewed. It must not become a runtime record until
    // it has enough verified correspondences for the texture fitter.
    if (!Array.isArray(anchors) || anchors.length === 0) {
      continue
    }

    const runtimeAnchors = []
    for (const anchor of anchors) {
      if (
        !isFiniteNumber(anchor.starId) ||
        !isFiniteNumber(anchor.imageX) ||
        !isFiniteNumber(anchor.imageY)
      ) {
        problems.push(
          `${constellationId}: anchor with invalid fields: ${JSON.stringify(anchor)}`,
        )
        continue
      }
      runtimeAnchors.push({
        starId: anchor.starId,
        pixelX: anchor.imageX * widthPx,
        pixelY: anchor.imageY * heightPx,
      })
    }
    if (runtimeAnchors.length < 3) {
      problems.push(
        `${constellationId}: fewer than 3 usable anchors after validation`,
      )
      continue
    }

    // unmapped is authoring-only (documents *why* a catalog vertex was
    // skipped) — not carried into the runtime record, but sanity-check its
    // shape so a malformed entry doesn't silently pass review.
    if (unmapped !== undefined) {
      if (!Array.isArray(unmapped)) {
        problems.push(`${constellationId}: unmapped must be an array`)
        continue
      }
      for (const u of unmapped) {
        if (!isFiniteNumber(u.starId) || typeof u.reason !== 'string') {
          problems.push(
            `${constellationId}: invalid unmapped entry: ${JSON.stringify(u)}`,
          )
        }
      }
    }

    records.push({
      constellationNames: [constellationId],
      imageUrl: image,
      imageWidthPx: widthPx,
      imageHeightPx: heightPx,
      pixelBounds: {
        minX: artBounds.minX * widthPx,
        minY: artBounds.minY * heightPx,
        maxX: artBounds.maxX * widthPx,
        maxY: artBounds.maxY * heightPx,
      },
      anchors: runtimeAnchors,
    })
  }

  if (problems.length > 0) {
    console.error(`${problems.length} problem(s) found:`)
    for (const p of problems) console.error(`  - ${p}`)
    process.exitCode = 1
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`)
  console.log(
    `Wrote ${records.length} constellation art record(s) to ${path.relative(ROOT, OUTPUT_PATH)}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
