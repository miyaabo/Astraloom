// Batch dev tool: renders all precomputed illustration JSON files into SVG
// skeleton guides. It delegates every file's layout to
// render-constellation-guide.mjs, so the single-guide and batch-guide output
// share the same uniform scale-to-fit, star sizing, line, and label rules.
//
// Usage: npm run render:all-constellation-guides
import { execFileSync } from 'node:child_process'
import { mkdir, readdir, rm } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const INPUT_DIRECTORY = path.join(ROOT, 'tmp/constellation-illustration-data')
const OUTPUT_DIRECTORY = path.join(ROOT, 'tmp/constellation-guides')

async function clearPreviousSvgOutputs() {
  await mkdir(OUTPUT_DIRECTORY, { recursive: true })
  const entries = await readdir(OUTPUT_DIRECTORY, { withFileTypes: true })
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
      .map((entry) => rm(path.join(OUTPUT_DIRECTORY, entry.name))),
  )
}

async function main() {
  const inputFiles = (await readdir(INPUT_DIRECTORY, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => entry.name)
    .sort()
  const failures = []

  if (inputFiles.length !== 88) {
    throw new Error(
      `Expected 88 illustration JSON files, found ${inputFiles.length}.`,
    )
  }

  await clearPreviousSvgOutputs()

  for (const inputFile of inputFiles) {
    const constellationId = path.basename(inputFile, '.json')
    try {
      execFileSync(
        'node',
        [
          path.join(ROOT, 'scripts/render-constellation-guide.mjs'),
          '--input',
          path.join(INPUT_DIRECTORY, inputFile),
        ],
        { stdio: 'ignore' },
      )
    } catch {
      failures.push(constellationId)
    }
  }

  const outputCount = (await readdir(OUTPUT_DIRECTORY)).filter((file) =>
    file.endsWith('.svg'),
  ).length
  console.log(`Generated ${outputCount}/${inputFiles.length} SVG guides.`)
  console.log(
    failures.length === 0
      ? 'Failed constellation ids: none'
      : `Failed constellation ids: ${failures.join(', ')}`,
  )
  if (failures.length > 0) process.exitCode = 1
}

await main()
