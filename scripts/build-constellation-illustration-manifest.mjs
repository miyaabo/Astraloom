// Builds the machine-readable illustration manifest from the human-maintained
// motif source of truth. Do not hand-edit the generated JSON.
//
// Usage: npm run build:constellation-illustration-manifest
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MOTIFS_PATH = path.join(
  ROOT,
  'docs/constellations/illustration-motifs.md',
)
const GUIDE_DIRECTORY = path.join(ROOT, 'tmp/constellation-guides')
const OUTPUT_PATH = path.join(
  ROOT,
  'tmp/constellation-illustration-manifest.json',
)

function fieldFromEntry(body, heading) {
  const marker = `### ${heading}\n`
  const start = body.indexOf(marker)
  if (start === -1) return null
  const contentStart = start + marker.length
  const nextHeading = body.indexOf('\n### ', contentStart)
  return body
    .slice(contentStart, nextHeading === -1 ? undefined : nextHeading)
    .trim()
    .replace(/\n+/g, ' ')
}

function parseMotifEntries(markdown) {
  const headings = [...markdown.matchAll(/^## (\S+) - (.+) \/ (.+)$/gm)]
  return headings.map((heading, index) => {
    const bodyStart = heading.index + heading[0].length
    const bodyEnd = headings[index + 1]?.index ?? markdown.length
    const body = markdown.slice(bodyStart, bodyEnd)
    const [motif, mythology, illustrationInstruction] = [
      fieldFromEntry(body, 'モチーフ'),
      fieldFromEntry(body, '神話・背景'),
      fieldFromEntry(body, 'イラストの方向性'),
    ]

    if (!motif || !mythology || !illustrationInstruction) {
      throw new Error(`Incomplete motif entry: ${heading[1]}`)
    }

    return {
      constellationId: heading[1],
      nameJa: heading[2],
      name: heading[3],
      motif,
      mythology,
      illustrationInstruction,
    }
  })
}

function guideConstellationId(constellationId) {
  // The existing illustration data and guide intentionally merge Serpens's
  // Caput/Cauda records into one IAU Ser file. Both source entries therefore
  // reference that guide, while retaining distinct generated image paths.
  return constellationId.startsWith('Ser-') ? 'Ser' : constellationId
}

function main() {
  const entries = parseMotifEntries(readFileSync(MOTIFS_PATH, 'utf-8'))
  if (entries.length !== 89) {
    throw new Error(`Expected 89 motif entries, found ${entries.length}.`)
  }

  const ids = new Set(entries.map((entry) => entry.constellationId))
  if (ids.size !== entries.length) throw new Error('Duplicate motif entry id.')

  const manifest = {
    source: 'docs/constellations/illustration-motifs.md',
    constellations: entries.map((entry) => {
      const guideId = guideConstellationId(entry.constellationId)
      const guideImagePath = `tmp/constellation-guides/${guideId}.svg`
      if (!existsSync(path.join(ROOT, guideImagePath))) {
        throw new Error(
          `Missing guide image for ${entry.constellationId}: ${guideImagePath}`,
        )
      }

      return {
        constellationId: entry.constellationId,
        name: entry.name,
        nameJa: entry.nameJa,
        guideImagePath,
        outputImagePath: `public/no-line/${entry.name}_線なし.png`,
        motif: entry.motif,
        mythology: entry.mythology,
        illustrationInstruction: entry.illustrationInstruction,
      }
    }),
  }

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')
  console.log(
    `Wrote ${path.relative(ROOT, OUTPUT_PATH)} (${entries.length} entries).`,
  )
}

main()
