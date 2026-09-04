// One-off dev tool: launches the app, selects a constellation by name via
// the existing search UI, and screenshots the canvas once its lines/labels
// have rendered. Used to gather reference captures of the app's own
// constellation display (star points + connecting lines, full planetarium
// look — glow/twinkle/background stars included) for feeding into an
// external AI image generation tool (see docs/features/phase-13-implementation-tasks.md
// Task 4). Not a regression test — output goes to tmp/ (gitignored scratch).
//
// Usage: node scripts/capture-constellation.mjs "Leo"
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'

const constellationName = process.argv[2]
if (!constellationName) {
  console.error('Usage: node scripts/capture-constellation.mjs "<constellation name>"')
  process.exit(1)
}

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

async function main() {
  await mkdir(outDir, { recursive: true })

  const devServer = spawn('npm', ['run', 'dev', '--', '--port', '5173', '--strictPort'], {
    stdio: 'ignore',
    shell: true,
  })

  try {
    await waitForServer(devServerUrl, 30000)

    const browser = await chromium.launch()
    try {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
      await page.goto(devServerUrl)
      await page.locator('canvas').waitFor({ state: 'visible' })
      await page.waitForTimeout(500)

      await page.getByLabel('星・星座を検索').click()
      await page.getByLabel('星座名・星名・主要天体で検索').fill(constellationName)
      const escapedName = constellationName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      await page
        .getByRole('button', { name: new RegExp(`^${escapedName} \\(`) })
        .click()

      // Let the camera settle on the constellation's look direction and the
      // line/label overlay finish rendering before capturing.
      await page.waitForTimeout(1000)

      const outputPath = path.join(outDir, `${constellationName}.png`)
      await page.locator('canvas').screenshot({ path: outputPath })
      console.log(`Saved ${outputPath}`)
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
