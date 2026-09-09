// One-off dev tool: like capture-constellation.mjs but loops over every
// constellation in the catalog in a single browser session (one dev-server
// boot instead of 89), selecting each via the dev-only
// __debugSelectConstellationAtZenith hook (always relocates the observer to
// that constellation's zenith, so every one of its line-figure stars is
// above the horizon — see captureConstellation's comment for why the normal
// search-UI selection flow can't be reused here), switching to 鑑賞モード
// (immersive mode) to hide all chrome/labels, and screenshotting the canvas
// once its lines settle — a lines-and-stars-only capture, no
// constellation/star name text. Output goes to tmp/ (gitignored scratch),
// named by Japanese constellation name.
//
// Also reads window.__constellationAnchorDebug (set by
// Starfield.tsx's handleSelectConstellationResult right after the camera
// settles on the constellation) for every constellation's exact on-screen
// position of each line-segment star, and writes them all to
// skeleton-coordinates.json alongside the screenshots. This removes the
// original captures' ambiguity — which point in the picture is which HYG
// star — by pairing every screenshot with machine-exact coordinates instead
// of relying on eyeballing dots in an unlabeled image (see
// docs/features/phase-13-implementation-tasks.md Task 4 for why anchor
// authoring needs this).
//
// Usage: node scripts/capture-all-constellations.mjs
import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const devServerUrl = 'http://localhost:5173'
const outDir = path.resolve('tmp/constellation-captures')
const coordinatesOutputPath = path.join(outDir, 'skeleton-coordinates.json')

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  return new Promise((resolve, reject) => {
    const attempt = () => {
      fetch(url)
        .then(() => resolve())
        .catch((err) => {
          if (Date.now() > deadline) reject(err)
          else setTimeout(attempt, 300)
        })
    }
    attempt()
  })
}

// Some catalog records share the same Japanese display name (Serpens Caput
// and Serpens Cauda both show as へび座 — see constellationTypes.ts). Suffix
// those so their output files don't collide.
function disambiguateJapaneseNames(records) {
  const counts = new Map()
  for (const record of records) {
    counts.set(record.nameJa, (counts.get(record.nameJa) ?? 0) + 1)
  }
  return records.map((record) => {
    if (counts.get(record.nameJa) === 1) return record
    const suffix = record.name.includes('Caput')
      ? '(頭)'
      : record.name.includes('Cauda')
        ? '(尾)'
        : ''
    return { ...record, nameJa: `${record.nameJa}${suffix}` }
  })
}

async function loadConstellations() {
  const raw = await readFile(
    path.resolve('src/constellations/data/constellationCatalog.json'),
    'utf-8',
  )
  const records = JSON.parse(raw).map(({ name, nameJa }) => ({ name, nameJa }))
  return disambiguateJapaneseNames(records)
}

async function loadProperNamesByStarId() {
  const raw = await readFile(
    path.resolve('src/stars/data/hygCatalog.json'),
    'utf-8',
  )
  const byId = new Map()
  for (const star of JSON.parse(raw)) {
    if (star.properName) byId.set(star.id, star.properName)
  }
  return byId
}

async function captureConstellation(page, { name, nameJa }, properNamesByStarId) {
  // Uses the dev-only __debugSelectConstellationAtZenith hook (Starfield.tsx)
  // instead of driving the search UI — the search UI's selection handler
  // only relocates to the constellation's zenith when it's *entirely*
  // invisible from the current location/date, so a constellation with even
  // one segment already above the horizon (common) got captured with most
  // of its stars missing. The debug hook always relocates, guaranteeing
  // every constellation's full star set is above the horizon for its
  // capture, regardless of what's currently in view for any other
  // constellation earlier in this same loop.
  await page.evaluate((n) => window.__debugSelectConstellationAtZenith(n), name)

  // Let the camera settle on the constellation's look direction and the
  // line/label overlay finish rendering before capturing.
  await page.waitForTimeout(1000)

  // Read while still in normal mode (handleSelectConstellationResult, which
  // sets this global, early-returns if already in immersive mode — see the
  // guard at the top of that function — so this must happen before the
  // immersive toggle below, and before the *next* iteration's search click).
  const debugAnchors = await page.evaluate(
    () => window.__constellationAnchorDebug,
  )
  if (debugAnchors?.name !== name) {
    throw new Error(
      `__constellationAnchorDebug missing or stale for ${name} (got ${debugAnchors?.name ?? 'undefined'})`,
    )
  }
  const anchors = debugAnchors.anchors.map(({ starId, xPercent, yPercent, visible }) => ({
    starId,
    properName: properNamesByStarId.get(starId) ?? null,
    xPercent,
    yPercent,
    visible,
  }))

  // Playwright's element.screenshot() clips to the canvas's on-screen
  // bounding box, not just its own painted pixels — any HTML overlay drawn
  // over that same region (search bar, selection info card, constellation
  // and star name labels from ConstellationLabelsOverlay.tsx) still shows up
  // in the capture. 鑑賞モード (displayState.ts's "immersive" mode) hides all
  // of that chrome without touching the current selection, so lines and
  // stars stay while everything else disappears — exactly the "lines and
  // stars only" capture this script needs. The toggle button itself stays
  // rendered (chromeVisibility remains 'visible' even in immersive mode), so
  // it's hidden with an inline style just for the screenshot and restored
  // right after — it needs to stay clickable to leave immersive mode again
  // (handleSelectConstellationResult early-returns while in immersive mode,
  // which would break the next constellation's selection).
  const returnButton = page.getByLabel('鑑賞モードに切替')
  await returnButton.click()
  await page.waitForTimeout(300)

  const exitButton = page.getByLabel('通常表示に戻る')
  await exitButton.evaluate((el) => {
    el.style.visibility = 'hidden'
  })

  const outputPath = path.join(outDir, `${nameJa}.png`)
  await page.locator('canvas').screenshot({ path: outputPath })

  await exitButton.evaluate((el) => {
    el.style.visibility = 'visible'
  })
  await exitButton.click()
  await page.waitForTimeout(200)

  return { constellationId: name, constellationNameJa: nameJa, anchors }
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const constellations = await loadConstellations()
  const properNamesByStarId = await loadProperNamesByStarId()

  const devServer = spawn(
    'npm',
    ['run', 'dev', '--', '--port', '5173', '--strictPort'],
    { stdio: 'ignore', shell: true },
  )

  try {
    await waitForServer(devServerUrl, 30000)

    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
      await page.goto(devServerUrl)
      await page.locator('canvas').waitFor({ state: 'visible' })
      await page.waitForTimeout(500)

      const failed = []
      const coordinateRecords = []
      for (const [index, constellation] of constellations.entries()) {
        try {
          const record = await captureConstellation(
            page,
            constellation,
            properNamesByStarId,
          )
          coordinateRecords.push(record)
          console.log(
            `[${index + 1}/${constellations.length}] Saved ${constellation.nameJa}`,
          )
        } catch (err) {
          console.error(
            `[${index + 1}/${constellations.length}] Failed ${constellation.nameJa}:`,
            err.message,
          )
          failed.push(constellation.nameJa)
        }
      }

      await writeFile(
        coordinatesOutputPath,
        `${JSON.stringify({ version: 1, constellations: coordinateRecords }, null, 2)}\n`,
      )
      console.log(
        `Wrote skeleton coordinates for ${coordinateRecords.length} constellation(s) to ${coordinatesOutputPath}`,
      )

      if (failed.length > 0) {
        console.error(`\n${failed.length} failed: ${failed.join(', ')}`)
        process.exitCode = 1
      } else {
        console.log(
          `\nAll ${constellations.length} constellations captured to ${outDir}`,
        )
      }
    } finally {
      await browser.close()
    }
  } finally {
    devServer.kill()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
