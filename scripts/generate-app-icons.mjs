// Generates PWA/home-screen icon PNGs from public/favicon.svg (no image
// conversion tool was available locally, so this renders the SVG in a
// headless browser and screenshots it — reuses the Playwright browser
// already installed for e2e tests instead of adding a new dependency).
import { chromium } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url)) + '/..'
const svgPath = path.join(rootDir, 'public/favicon.svg')
const outDir = path.join(rootDir, 'public/icons')

// Solid background (matches starfieldConfig.render.backgroundColor) so the
// icon reads consistently once iOS/Android apply their own rounded mask —
// apple-touch-icon in particular renders poorly with transparency.
const BACKGROUND_COLOR = '#05070f'
const SIZES = [180, 192, 512]

async function main() {
  const svgMarkup = await readFile(svgPath, 'utf8')
  await mkdir(outDir, { recursive: true })

  const browser = await chromium.launch()
  try {
    for (const size of SIZES) {
      const page = await browser.newPage({
        viewport: { width: size, height: size },
      })
      const padding = Math.round(size * 0.18)
      await page.setContent(`
        <html>
          <body style="margin:0;width:${size}px;height:${size}px;background:${BACKGROUND_COLOR};display:flex;align-items:center;justify-content:center;">
            <div style="width:${size - padding * 2}px;height:${size - padding * 2}px;display:flex;align-items:center;justify-content:center;">
              ${svgMarkup}
            </div>
          </body>
        </html>
      `)
      await page.evaluate(() => {
        const svg = document.querySelector('svg')
        if (svg) {
          svg.setAttribute('width', '100%')
          svg.setAttribute('height', '100%')
        }
      })
      const outPath = path.join(outDir, `icon-${size}.png`)
      await page.screenshot({ path: outPath })
      await page.close()
      console.log(`wrote ${outPath}`)
    }
  } finally {
    await browser.close()
  }
}

main()
