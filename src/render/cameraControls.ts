import { starfieldConfig } from '../stars/starfieldConfig'

/** The subset of StarfieldRenderer this module drives — kept as an interface so input handling stays decoupled from rendering (PRODUCT.md: "View/camera" is its own responsibility). */
export interface CameraControlTarget {
  rotateBy(deltaYawDegrees: number, deltaPitchDegrees: number): void
  zoomBy(deltaFovDegrees: number): void
}

/**
 * Wires drag-to-look (single pointer), pinch/wheel-to-zoom, and tap/click
 * selection input on the canvas to the renderer's camera. D014 chose
 * drag-only view control (no gyroscope), matching the phone-drag interaction
 * used across PC and mobile.
 *
 * Drag follows a "grab the sky" convention — the point under the pointer
 * stays under the pointer as you drag, like panning a photo sphere — rather
 * than an FPS-style mouse-look, since that's the natural touch gesture for
 * this app's phone/tablet-first usage (D001).
 *
 * `onTap` (Task 5) fires on pointerup when the whole gesture stayed a single
 * pointer that barely moved (starfieldConfig.controls.tap.maxMovementPixels)
 * — i.e. it never became a drag or a pinch — so star/constellation selection
 * doesn't fire on every drag release.
 */
export function attachCameraControls(
  canvas: HTMLCanvasElement,
  target: CameraControlTarget,
  onTap?: (clientX: number, clientY: number) => void,
): () => void {
  const { drag, zoom, tap } = starfieldConfig.controls
  const pointers = new Map<number, { x: number; y: number }>()
  let dragPointerId: number | null = null
  let lastPinchDistance: number | null = null
  // Set alongside dragPointerId on the initial single-finger press; cleared
  // (like dragPointerId) the moment a second finger joins, so a pinch never
  // resolves into a tap once it's released back down to one finger.
  let tapPointerId: number | null = null
  let tapStart: { x: number; y: number } | null = null

  function pinchDistance(): number | null {
    if (pointers.size < 2) return null
    const [a, b] = [...pointers.values()]
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function handlePointerDown(event: PointerEvent): void {
    canvas.setPointerCapture(event.pointerId)
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.size === 1) {
      dragPointerId = event.pointerId
      tapPointerId = event.pointerId
      tapStart = { x: event.clientX, y: event.clientY }
    } else {
      dragPointerId = null
      tapPointerId = null
      tapStart = null
      lastPinchDistance = pinchDistance()
    }
  }

  function handlePointerMove(event: PointerEvent): void {
    const previous = pointers.get(event.pointerId)
    if (!previous) return
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointers.size >= 2) {
      const distance = pinchDistance()
      if (distance !== null && lastPinchDistance !== null) {
        target.zoomBy(
          -(distance - lastPinchDistance) * zoom.pinchDegreesPerPixel,
        )
      }
      lastPinchDistance = distance
      return
    }

    if (event.pointerId !== dragPointerId) return
    const deltaX = event.clientX - previous.x
    const deltaY = event.clientY - previous.y
    target.rotateBy(
      deltaX * drag.degreesPerPixel,
      deltaY * drag.degreesPerPixel,
    )
  }

  function releasePointer(event: PointerEvent): void {
    pointers.delete(event.pointerId)
    if (pointers.size < 2) lastPinchDistance = null
    if (event.pointerId === dragPointerId) dragPointerId = null
    if (event.pointerId === tapPointerId) {
      tapPointerId = null
      tapStart = null
    }

    // A pinch (2 fingers) dropping to exactly 1 finger should hand control to
    // that remaining finger instead of leaving dragPointerId null — otherwise
    // the surviving finger can't rotate the view until fully released and
    // re-pressed.
    if (pointers.size === 1 && dragPointerId === null) {
      dragPointerId = pointers.keys().next().value ?? null
    }
  }

  // Handles pointerup specifically (not pointercancel, which should never
  // resolve as a tap): checks whether this release completes a tap before
  // running the same cleanup as releasePointer.
  function handlePointerUp(event: PointerEvent): void {
    if (onTap && event.pointerId === tapPointerId && tapStart !== null) {
      const distance = Math.hypot(
        event.clientX - tapStart.x,
        event.clientY - tapStart.y,
      )
      if (distance <= tap.maxMovementPixels) {
        onTap(event.clientX, event.clientY)
      }
    }
    releasePointer(event)
  }

  function handleWheel(event: WheelEvent): void {
    event.preventDefault()
    target.zoomBy(event.deltaY * zoom.wheelDegreesPerUnit)
  }

  canvas.addEventListener('pointerdown', handlePointerDown)
  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerup', handlePointerUp)
  canvas.addEventListener('pointercancel', releasePointer)
  canvas.addEventListener('wheel', handleWheel, { passive: false })

  return () => {
    canvas.removeEventListener('pointerdown', handlePointerDown)
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerup', handlePointerUp)
    canvas.removeEventListener('pointercancel', releasePointer)
    canvas.removeEventListener('wheel', handleWheel)
  }
}
