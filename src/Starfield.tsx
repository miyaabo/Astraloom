import { useEffect, useRef } from 'react'
import { StarfieldRenderer } from './render/StarfieldRenderer'
import { generateStarData } from './stars/starDataSource'

/** Bridges the Three.js renderer's imperative lifecycle into React mount/unmount. */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const renderer = new StarfieldRenderer(canvas, generateStarData())

    // ResizeObserver catches layout-size changes from any cause (window
    // resize, orientation change, mobile address-bar show/hide) and fires
    // once immediately on observe(), so no separate initial call is needed.
    const resizeObserver = new ResizeObserver(() => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight)
    })
    resizeObserver.observe(canvas)
    renderer.start()

    return () => {
      resizeObserver.disconnect()
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100vw', height: '100vh' }}
    />
  )
}
