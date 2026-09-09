// One-off dev tool: boots the dev server, selects one constellation via the
// __debugSelectConstellationAtZenith hook (Starfield.tsx), and screenshots
// the canvas with lines/labels/art all visible — for visually checking a
// Task 3 constellation-art placement draft before committing to it (see
// scripts/preview-constellation-art-draft.mjs, which this is meant to be
// run after).
//
// Usage: node scripts/screenshot-constellation-preview.mjs "Andromeda" out.png
import { spawn } from 'node:child_process'
import path from 'node:path'
import { chromium } from '@playwright/test'

const devServerUrl = 'http://localhost:5173'

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
  const [name, outputFile] = process.argv.slice(2)
  if (!name || !outputFile) {
    console.error('Usage: node scripts/screenshot-constellation-preview.mjs "Andromeda" out.png')
    process.exit(1)
  }
  const outputPath = path.resolve(outputFile)

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

      await page.evaluate((n) => window.__debugSelectConstellationAtZenith(n), name)
      await page.waitForTimeout(1500)

      await page.screenshot({ path: outputPath })
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
