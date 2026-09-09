// Replaces unreviewed placement guesses with a review-ready authoring catalog.
// Every source skeleton vertex is retained by its real HYG ID in `unmapped`;
// an entry is promoted to `anchors` only after a person verifies its motif
// location against the matching capture and no-line image.
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const anchorsPath = path.join(ROOT, 'public/no-line/constellation-anchors.json')
const catalogPath = path.join(
  ROOT,
  'src/constellations/data/constellationCatalog.json',
)

const current = JSON.parse(await readFile(anchorsPath, 'utf8'))
const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
const byName = new Map(catalog.map((constellation) => [constellation.name, constellation]))

const constellations = current.constellations.map((entry) => {
  const source = byName.get(entry.constellationId)
  if (source === undefined) {
    throw new Error(`No source skeleton for ${entry.constellationId}`)
  }

  const starIds = [...new Set(source.segments.flat())]
  return {
    constellationId: entry.constellationId,
    constellationKeys: entry.constellationKeys,
    image: entry.image,
    artBounds: entry.artBounds,
    anchors: [],
    unmapped: starIds.map((starId) => ({
      starId,
      reason: '元骨格キャプチャの頂点。線画モチーフ上の対応位置は未照合',
    })),
    notes:
      '元骨格キャプチャの全頂点IDを保存。目視でモチーフ位置を確認した頂点だけ anchors に登録する。',
  }
})

if (constellations.length !== 89) {
  throw new Error(`Expected 89 constellations, got ${constellations.length}`)
}

await writeFile(
  anchorsPath,
  `${JSON.stringify({ version: 1, constellations }, null, 2)}\n`,
)
console.log(`Initialized ${constellations.length} review records.`)
