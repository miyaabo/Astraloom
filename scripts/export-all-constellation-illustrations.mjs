// Batch dev tool: writes one fixed, observer-independent illustration input
// JSON per IAU constellation. The catalog has 89 records because Serpens is
// split into Caput and Cauda; those records are intentionally merged into the
// one IAU Ser.json output so this command always produces 88 files.
//
// Usage: npm run export:all-constellation-illustrations
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { createConstellationIllustrationData } from './export-constellation-illustration.mjs'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUTPUT_DIRECTORY = path.join(ROOT, 'tmp/constellation-illustration-data')
const catalog = JSON.parse(
  readFileSync(
    path.join(ROOT, 'src/constellations/data/constellationCatalog.json'),
    'utf-8',
  ),
)

function groupByConstellationId(records) {
  const groups = new Map()
  for (const record of records) {
    const recordsForId = groups.get(record.id) ?? []
    recordsForId.push(record)
    groups.set(record.id, recordsForId)
  }
  return [...groups.values()].map((records) => {
    if (records.length === 1) return records[0]

    // Serpens is the catalog's sole IAU constellation represented by two
    // figures. Keep every source segment while writing one Ser.json file.
    return {
      id: records[0].id,
      name: 'Serpens',
      nameJa: records[0].nameJa,
      segments: records.flatMap((record) => record.segments),
    }
  })
}

async function clearPreviousJsonOutputs() {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true })
  const entries = await readdir(OUTPUT_DIRECTORY, { withFileTypes: true })
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
      .map((entry) => rm(path.join(OUTPUT_DIRECTORY, entry.name))),
  )
}

async function main() {
  const constellations = groupByConstellationId(catalog)
  const failures = []

  if (constellations.length !== 88) {
    throw new Error(
      `Expected 88 unique IAU constellation ids, found ${constellations.length}.`,
    )
  }

  await clearPreviousJsonOutputs()

  for (const constellation of constellations) {
    try {
      const data = createConstellationIllustrationData(constellation)
      if (!data) throw new Error('No resolvable center.')
      await writeFile(
        path.join(OUTPUT_DIRECTORY, `${constellation.id}.json`),
        `${JSON.stringify(data, null, 2)}\n`,
        'utf-8',
      )
    } catch (error) {
      failures.push({ id: constellation.id, error })
    }
  }

  const generatedFiles = (await readdir(OUTPUT_DIRECTORY)).filter((file) =>
    file.endsWith('.json'),
  )
  console.log(
    `Generated ${generatedFiles.length}/${constellations.length} JSON files.`,
  )
  if (failures.length > 0) {
    console.error(
      `Failed constellation ids: ${failures.map(({ id }) => id).join(', ')}`,
    )
    process.exitCode = 1
  }
}

await main()
