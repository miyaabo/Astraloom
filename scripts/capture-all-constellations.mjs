// One-off dev tool: like capture-constellation.mjs but loops over every
// constellation in the catalog in a single browser session (one dev-server
// boot instead of 89), selecting each via the existing search UI and
// screenshotting the canvas once its lines/labels render. Output goes to
// tmp/ (gitignored scratch) — reference captures for feeding an external AI
// image generation tool, see docs/features/phase-13-implementation-tasks.md
// Task 4.
//
// Usage: node scripts/capture-all-constellations.mjs
import { spawn } from 'node:child_process'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const devServerUrl = 'http://localhost:5173'
const outDir = path.resolve('tmp/constellation-captures')

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

async function loadConstellationNames() {
  const raw = await readFile(
    path.resolve('src/constellations/data/constellationCatalog.json'),
    'utf-8',
  )
  return JSON.parse(raw).map((record) => record.name)
}

async function captureConstellation(page, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
  await page.getByLabel('星・星座を検索').click()
  await page.getByLabel('星座名・星名・主要天体で検索').fill(name)
  await page
    .getByRole('button', { name: new RegExp(String.raw`^${escapedName} \(`) })
    .click()

  // Let the camera settle on the constellation's look direction and the
  // line/label overlay finish rendering before capturing.
  await page.waitForTimeout(1000)

  const outputPath = path.join(outDir, `${name}.png`)
  await page.locator('canvas').screenshot({ path: outputPath })
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const names = await loadConstellationNames()

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
      for (const [index, name] of names.entries()) {
        try {
          await captureConstellation(page, name)
          console.log(`[${index + 1}/${names.length}] Saved ${name}`)
        } catch (err) {
          console.error(`[${index + 1}/${names.length}] Failed ${name}:`, err.message)
          failed.push(name)
        }
      }

      if (failed.length > 0) {
        console.error(`\n${failed.length} failed: ${failed.join(', ')}`)
        process.exitCode = 1
      } else {
        console.log(`\nAll ${names.length} constellations captured to ${outDir}`)
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
