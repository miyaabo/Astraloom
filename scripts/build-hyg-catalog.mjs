#!/usr/bin/env node
// Preprocesses the HYG Database (DECISIONS.md D013) into the lightweight
// catalog bundled at src/stars/data/hygCatalog.json. Run manually when the
// raw catalog needs to be (re)generated — not part of `npm run build`, so
// normal dev/CI runs never need network access.
//
// Usage:
//   node scripts/build-hyg-catalog.mjs [path-to-raw-csv-or-csv.gz]
//
// If no path is given, defaults to data/raw/hyg_v44.csv.gz. If that file is
// missing, download it first:
//   curl -L -o data/raw/hyg_v44.csv.gz \
//     https://codeberg.org/astronexus/hyg/media/branch/main/data/hyg/CURRENT/hyg_v44.csv.gz

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const inputPath = path.resolve(
  process.argv[2] ?? path.join(rootDir, 'data/raw/hyg_v44.csv.gz'),
)
const outputPath = path.join(rootDir, 'src/stars/data/hygCatalog.json')

// 0次の仮データ密度(6000)と近い見かけの密度になる閾値(DECISIONS.md D013)。
const MAGNITUDE_LIMIT = 6.5
// HYG id 0 is the Sun ("Sol") — not a nighttime star, always excluded.
const SUN_ID = 0

if (!existsSync(inputPath)) {
  console.error(`Raw catalog not found: ${inputPath}`)
  console.error('See the usage comment at the top of this script.')
  process.exit(1)
}

const raw = readFileSync(inputPath)
const isGzip = raw[0] === 0x1f && raw[1] === 0x8b
const text = (isGzip ? gunzipSync(raw) : raw).toString('utf8')

/** Splits one CSV line, honoring double-quoted fields (HYG has no embedded newlines in quoted fields). */
function parseCsvLine(line) {
  const fields = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        current += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)
  return fields
}

const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
const header = parseCsvLine(lines[0])
const columnIndex = (name) => {
  const index = header.indexOf(name)
  if (index === -1)
    throw new Error(`Column "${name}" not found in catalog header`)
  return index
}

const iId = columnIndex('id')
const iRa = columnIndex('ra')
const iDec = columnIndex('dec')
const iMag = columnIndex('mag')
const iCi = columnIndex('ci')
const iProper = columnIndex('proper')

const stars = []
for (let i = 1; i < lines.length; i++) {
  const fields = parseCsvLine(lines[i])

  const id = Number(fields[iId])
  const raHours = Number(fields[iRa])
  const decDegrees = Number(fields[iDec])
  const magnitude = Number(fields[iMag])
  const ciField = fields[iCi]

  if (id === SUN_ID) continue
  if (![id, raHours, decDegrees, magnitude].every(Number.isFinite)) continue
  if (magnitude > MAGNITUDE_LIMIT) continue

  const colorIndex = ciField === '' ? null : Number(ciField)
  const properName =
    fields[iProper].trim() === '' ? null : fields[iProper].trim()

  stars.push({
    id,
    raHours,
    decDegrees,
    magnitude,
    colorIndex: Number.isFinite(colorIndex) ? colorIndex : null,
    properName,
  })
}

writeFileSync(outputPath, JSON.stringify(stars))

console.log(
  `Wrote ${stars.length} stars to ${path.relative(rootDir, outputPath)}`,
)
