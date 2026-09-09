// One-off dev tool: converts every constellation entry in
// tmp/constellation-captures/constellation-art-placement-draft.json (Task 3's
// working file — artPixel filled in per star) that has enough placed anchors
// into the runtime ConstellationArtRecord shape, and writes them all to
// src/constellations/data/constellationArt.json, so progress can be browsed
// in the running app before the full 89-constellation build pipeline exists.
// NOT for production use — overwrites the runtime catalog with whatever's
// done so far in the draft.
//
// Usage: node scripts/preview-constellation-art-draft.mjs
//   (or pass specific names to restrict to just those: "Andromeda" "Antlia")
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const DRAFT_PATH = path.join(
  ROOT,
  'tmp/constellation-captures/constellation-art-placement-draft.json',
)
const OUTPUT_PATH = path.join(
  ROOT,
  'src/constellations/data/constellationArt.json',
)

async function readPngDimensions(absolutePath) {
  const buffer = await readFile(absolutePath)
  return {
    widthPx: buffer.readUInt32BE(16),
    heightPx: buffer.readUInt32BE(20),
  }
}

async function main() {
  const requestedNames = process.argv.slice(2)
  const draft = JSON.parse(await readFile(DRAFT_PATH, 'utf-8'))
  const records = []
  const skipped = []

  const entries =
    requestedNames.length > 0
      ? draft.constellations.filter((c) =>
          requestedNames.includes(c.constellationId),
        )
      : draft.constellations

  const outOfBounds = []
  for (const entry of entries) {
    const anchors = entry.stars
      .filter((s) => s.artPixel !== null)
      .map((s) => ({ starId: s.starId, artPixel: s.artPixel }))

    // Placement mistakes here don't fail loudly at render time — the fit
    // still "succeeds", it just puts an anchor's star outside wherever the
    // rendered mesh (cropped to artBounds) actually reaches, so its
    // connecting line trails off past the picture's edge into blank sky
    // (Task 3: caught this by eye on Aries/Boötes, both had several/all
    // anchors placed beyond artBounds — checking it here catches the next
    // one before it needs a screenshot to notice).
    const { minX, minY, maxX, maxY } = entry.artBounds
    for (const { starId, artPixel } of anchors) {
      if (
        artPixel.x < minX ||
        artPixel.x > maxX ||
        artPixel.y < minY ||
        artPixel.y > maxY
      ) {
        outOfBounds.push({ constellationId: entry.constellationId, starId, artPixel })
      }
    }

    if (anchors.length < 2) {
      skipped.push(entry.constellationId)
      continue
    }

    const imagePath = path.join(ROOT, 'public', entry.artImage)
    const { widthPx, heightPx } = await readPngDimensions(imagePath)

    records.push({
      constellationNames: [entry.constellationId],
      imageUrl: entry.artImage,
      imageWidthPx: widthPx,
      imageHeightPx: heightPx,
      pixelBounds: {
        minX: entry.artBounds.minX * widthPx,
        minY: entry.artBounds.minY * heightPx,
        maxX: entry.artBounds.maxX * widthPx,
        maxY: entry.artBounds.maxY * heightPx,
      },
      anchors: anchors.map(({ starId, artPixel }) => ({
        starId,
        pixelX: artPixel.x * widthPx,
        pixelY: artPixel.y * heightPx,
      })),
    })
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`)
  console.log(
    `Wrote ${records.length} preview record(s) to ${path.relative(ROOT, OUTPUT_PATH)} (${skipped.length} skipped: not enough artPixel yet)`,
  )

  if (outOfBounds.length > 0) {
    console.error(
      `\n${outOfBounds.length} artPixel value(s) fall outside their constellation's artBounds (their star's connecting line will trail off past the picture's edge):`,
    )
    for (const { constellationId, starId, artPixel } of outOfBounds) {
      console.error(
        `  - ${constellationId} star ${starId}: (${artPixel.x}, ${artPixel.y})`,
      )
    }
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
