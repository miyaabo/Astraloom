import { describe, expect, it, vi } from 'vitest'
import { attachCameraControls } from './cameraControls'
import type { CameraControlTarget } from './cameraControls'

/**
 * Minimal EventTarget-shaped fake canvas: attachCameraControls only needs
 * addEventListener/removeEventListener/setPointerCapture, not real layout or
 * a real PointerEvent (jsdom doesn't implement pointer capture).
 */
function createFakeCanvas() {
  const handlers = new Map<string, (event: never) => void>()
  return {
    element: {
      setPointerCapture: vi.fn(),
      addEventListener: (type: string, handler: (event: never) => void) => {
        handlers.set(type, handler)
      },
      removeEventListener: (type: string) => {
        handlers.delete(type)
      },
    } as unknown as HTMLCanvasElement,
    fire(type: string, event: unknown) {
      handlers.get(type)?.(event as never)
    },
  }
}

function pointerEvent(pointerId: number, clientX: number, clientY: number) {
  return { pointerId, clientX, clientY }
}

describe('attachCameraControls', () => {
  it('hands drag control to the remaining finger when a pinch drops from two fingers to one', () => {
    const canvas = createFakeCanvas()
    const target: CameraControlTarget = {
      rotateBy: vi.fn(),
      zoomBy: vi.fn(),
    }
    attachCameraControls(canvas.element, target)

    // Two fingers down starts a pinch (no drag).
    canvas.fire('pointerdown', pointerEvent(1, 0, 0))
    canvas.fire('pointerdown', pointerEvent(2, 100, 0))

    // Finger 1 lifts, leaving only finger 2 on the canvas.
    canvas.fire('pointerup', pointerEvent(1, 0, 0))

    // The surviving finger should immediately be able to drag/rotate, not
    // require a fresh press first.
    canvas.fire('pointermove', pointerEvent(2, 110, 5))

    expect(target.rotateBy).toHaveBeenCalledTimes(1)
    expect(target.rotateBy).toHaveBeenCalledWith(
      10 * 0.15, // starfieldConfig.controls.drag.degreesPerPixel
      5 * 0.15,
    )
  })

  it('does not treat a single-finger release as a drag start', () => {
    const canvas = createFakeCanvas()
    const target: CameraControlTarget = {
      rotateBy: vi.fn(),
      zoomBy: vi.fn(),
    }
    attachCameraControls(canvas.element, target)

    canvas.fire('pointerdown', pointerEvent(1, 0, 0))
    canvas.fire('pointerup', pointerEvent(1, 0, 0))
    canvas.fire('pointermove', pointerEvent(1, 50, 50))

    expect(target.rotateBy).not.toHaveBeenCalled()
  })

  it('fires onTap for a single pointer that presses and releases without moving far', () => {
    const canvas = createFakeCanvas()
    const target: CameraControlTarget = { rotateBy: vi.fn(), zoomBy: vi.fn() }
    const onTap = vi.fn()
    attachCameraControls(canvas.element, target, onTap)

    canvas.fire('pointerdown', pointerEvent(1, 100, 200))
    canvas.fire('pointerup', pointerEvent(1, 103, 198))

    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onTap).toHaveBeenCalledWith(103, 198)
  })

  it('does not fire onTap once the pointer has moved past a drag', () => {
    const canvas = createFakeCanvas()
    const target: CameraControlTarget = { rotateBy: vi.fn(), zoomBy: vi.fn() }
    const onTap = vi.fn()
    attachCameraControls(canvas.element, target, onTap)

    canvas.fire('pointerdown', pointerEvent(1, 0, 0))
    canvas.fire('pointermove', pointerEvent(1, 60, 0))
    canvas.fire('pointerup', pointerEvent(1, 60, 0))

    expect(onTap).not.toHaveBeenCalled()
  })

  it('does not fire onTap for a pinch gesture', () => {
    const canvas = createFakeCanvas()
    const target: CameraControlTarget = { rotateBy: vi.fn(), zoomBy: vi.fn() }
    const onTap = vi.fn()
    attachCameraControls(canvas.element, target, onTap)

    canvas.fire('pointerdown', pointerEvent(1, 0, 0))
    canvas.fire('pointerdown', pointerEvent(2, 100, 0))
    canvas.fire('pointerup', pointerEvent(1, 0, 0))
    canvas.fire('pointerup', pointerEvent(2, 100, 0))

    expect(onTap).not.toHaveBeenCalled()
  })

  it('does not fire onTap on pointercancel', () => {
    const canvas = createFakeCanvas()
    const target: CameraControlTarget = { rotateBy: vi.fn(), zoomBy: vi.fn() }
    const onTap = vi.fn()
    attachCameraControls(canvas.element, target, onTap)

    canvas.fire('pointerdown', pointerEvent(1, 0, 0))
    canvas.fire('pointercancel', pointerEvent(1, 0, 0))

    expect(onTap).not.toHaveBeenCalled()
  })
})
