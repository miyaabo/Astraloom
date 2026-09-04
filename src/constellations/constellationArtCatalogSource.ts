import type { ConstellationArtRecord } from './constellationArtTypes'

/**
 * Validates a single record's shape at load time, mirroring
 * constellationCatalogSource.ts's isValidConstellationRecord (CLAUDE.md
 * Security Baseline: validate external/generated data at the point it's
 * consumed, not just wherever it happens to be generated).
 */
function isValidConstellationArtRecord(
  record: unknown,
): record is ConstellationArtRecord {
  if (typeof record !== 'object' || record === null) return false
  const { constellationIds, anchors } = record as Record<string, unknown>

  if (!Array.isArray(constellationIds) || constellationIds.length === 0)
    return false
  if (!constellationIds.every((id) => typeof id === 'string' && id.length > 0))
    return false
  if (!Array.isArray(anchors) || anchors.length === 0) return false

  const isValidAnchor = (anchor: unknown) => {
    if (typeof anchor !== 'object' || anchor === null) return false
    const { starId, pixelX, pixelY } = anchor as Record<string, unknown>
    return (
      typeof starId === 'number' &&
      Number.isFinite(starId) &&
      typeof pixelX === 'number' &&
      Number.isFinite(pixelX) &&
      typeof pixelY === 'number' &&
      Number.isFinite(pixelY)
    )
  }

  return anchors.every(isValidAnchor)
}

let cachedCatalog: ConstellationArtRecord[] | null = null

/**
 * Loads the pre-matched constellation art catalog (DECISIONS.md D033).
 * Currently an empty placeholder (data/constellationArt.json) — 13次 Task 4's
 * two drawing attempts (a full texture, then an auto-traced outline) were
 * both rejected at Human Check and their generated data removed with them;
 * see docs/features/phase-13-implementation-tasks.md Task 4 for the open
 * options. This loader and the anchor-matching pipeline it expects
 * (constellationArtTypes.ts) are kept so a future art approach only needs to
 * regenerate this JSON, not rebuild the loading/placement plumbing.
 *
 * Dynamically imported (not a static top-level import) rather than assuming
 * the eventual real catalog stays small — once populated it's only ever
 * needed after a user actually selects a constellation, so bundling it
 * eagerly would grow the initial JS payload for no benefit on first paint
 * (Performance Rules / PRODUCT.md Mobile). Vite code-splits this into its own
 * chunk, fetched once and cached by the browser (and by `cachedCatalog` here)
 * on first use.
 */
export async function loadConstellationArtCatalog(): Promise<
  ConstellationArtRecord[]
> {
  if (cachedCatalog === null) {
    const module = await import('./data/constellationArt.json')
    cachedCatalog = (module.default as unknown[]).filter(
      isValidConstellationArtRecord,
    )
  }
  return cachedCatalog
}

let cachedRecordsByConstellationId: Map<string, ConstellationArtRecord> | null =
  null

/**
 * Finds the art record covering a given ConstellationRecord.id, or null if
 * that constellation has no art record. A few images may cover several
 * constellationIds (e.g. the old Argo Navis figure covering Car/Pup/Vel,
 * DECISIONS.md D033); any of them should resolve to the same record.
 */
export async function findConstellationArtByConstellationId(
  constellationId: string,
): Promise<ConstellationArtRecord | null> {
  if (cachedRecordsByConstellationId === null) {
    cachedRecordsByConstellationId = new Map()
    for (const record of await loadConstellationArtCatalog()) {
      for (const id of record.constellationIds) {
        cachedRecordsByConstellationId.set(id, record)
      }
    }
  }
  return cachedRecordsByConstellationId.get(constellationId) ?? null
}
