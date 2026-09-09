import { describe, expect, it } from 'vitest'
import {
  projectHorizontalToSphere,
  SKY_SPHERE_RADIUS,
} from '../stars/skyProjection'
import { buildTexturedArtMeshGrid } from './constellationArtTexturePlacement'

// Three non-collinear anchors (in both pixel space and sky direction), so a
// least-squares fit through exactly 3 points reduces to an exact fit —
// letting these tests assert the grid reproduces each anchor's real position
// exactly at its own pixel location.
const ANCHOR_TOP_LEFT = {
  pixelX: 0,
  pixelY: 0,
  position: projectHorizontalToSphere({
    altitudeDegrees: 0,
    azimuthDegrees: 0,
  }),
}
const ANCHOR_TOP_RIGHT = {
  pixelX: 100,
  pixelY: 0,
  position: projectHorizontalToSphere({
    altitudeDegrees: 0,
    azimuthDegrees: 10,
  }),
}
const ANCHOR_BOTTOM_LEFT = {
  pixelX: 0,
  pixelY: 100,
  position: projectHorizontalToSphere({
    altitudeDegrees: 10,
    azimuthDegrees: 0,
  }),
}
const THREE_ANCHORS = [ANCHOR_TOP_LEFT, ANCHOR_TOP_RIGHT, ANCHOR_BOTTOM_LEFT]
// pixelBounds spanning the full 100x100 test image — these tests don't
// exercise the "crop tighter than the full image" case (see
// leoArtPrototype.ts / Starfield.tsx for a real one).
const FULL_BOUNDS = { minX: 0, minY: 0, maxX: 100, maxY: 100 }

describe('buildTexturedArtMeshGrid', () => {
  it('returns null with fewer than 2 anchors', () => {
    expect(
      buildTexturedArtMeshGrid([ANCHOR_TOP_LEFT], FULL_BOUNDS, 100, 100, 4),
    ).toBeNull()
  })

  it('falls back to a rigid similarity fit with exactly 2 anchors', () => {
    // Only 2 anchors can't determine an affine (6 DOF) fit, but a rigid
    // rotate+scale+translate (4 DOF) is still well-defined through them.
    const grid = buildTexturedArtMeshGrid(
      [ANCHOR_TOP_LEFT, ANCHOR_TOP_RIGHT],
      FULL_BOUNDS,
      100,
      100,
      1,
    )
    expect(grid).not.toBeNull()
    const topLeft = grid!.positions.slice(0, 3)
    const topRight = grid!.positions.slice(3, 6)
    expect(topLeft[0]).toBeCloseTo(ANCHOR_TOP_LEFT.position.x, 3)
    expect(topLeft[1]).toBeCloseTo(ANCHOR_TOP_LEFT.position.y, 3)
    expect(topLeft[2]).toBeCloseTo(ANCHOR_TOP_LEFT.position.z, 3)
    expect(topRight[0]).toBeCloseTo(ANCHOR_TOP_RIGHT.position.x, 3)
    expect(topRight[1]).toBeCloseTo(ANCHOR_TOP_RIGHT.position.y, 3)
    expect(topRight[2]).toBeCloseTo(ANCHOR_TOP_RIGHT.position.z, 3)
  })

  it('produces the expected grid size', () => {
    const grid = buildTexturedArtMeshGrid(
      THREE_ANCHORS,
      FULL_BOUNDS,
      100,
      100,
      4,
    )
    expect(grid).not.toBeNull()
    const verticesPerRow = 5 // gridResolution 4 -> 5 vertices per row
    expect(grid?.positions.length).toBe(verticesPerRow * verticesPerRow * 3)
    expect(grid?.uvs.length).toBe(verticesPerRow * verticesPerRow * 2)
    expect(grid?.indices.length).toBe(4 * 4 * 6)
  })

  it('reproduces every point on the sky sphere (radius preserved)', () => {
    const grid = buildTexturedArtMeshGrid(
      THREE_ANCHORS,
      FULL_BOUNDS,
      100,
      100,
      4,
    )
    for (let i = 0; i < grid!.positions.length; i += 3) {
      const radius = Math.hypot(
        grid!.positions[i],
        grid!.positions[i + 1],
        grid!.positions[i + 2],
      )
      expect(radius).toBeCloseTo(SKY_SPHERE_RADIUS, 3)
    }
  })

  it('fits exactly through 3 anchors at their own pixel/UV locations', () => {
    const gridResolution = 1 // corners only: (0,0) (100,0) (0,100) (100,100)
    const grid = buildTexturedArtMeshGrid(
      THREE_ANCHORS,
      FULL_BOUNDS,
      100,
      100,
      gridResolution,
    )
    expect(grid).not.toBeNull()

    // Vertex order: row-major, (gridResolution+1) per row.
    // row 0: [pixel(0,0), pixel(100,0)]; row 1: [pixel(0,100), pixel(100,100)]
    const topLeft = grid!.positions.slice(0, 3)
    const topRight = grid!.positions.slice(3, 6)
    const bottomLeft = grid!.positions.slice(6, 9)

    expect(topLeft[0]).toBeCloseTo(ANCHOR_TOP_LEFT.position.x, 3)
    expect(topLeft[1]).toBeCloseTo(ANCHOR_TOP_LEFT.position.y, 3)
    expect(topLeft[2]).toBeCloseTo(ANCHOR_TOP_LEFT.position.z, 3)

    expect(topRight[0]).toBeCloseTo(ANCHOR_TOP_RIGHT.position.x, 3)
    expect(topRight[1]).toBeCloseTo(ANCHOR_TOP_RIGHT.position.y, 3)
    expect(topRight[2]).toBeCloseTo(ANCHOR_TOP_RIGHT.position.z, 3)

    expect(bottomLeft[0]).toBeCloseTo(ANCHOR_BOTTOM_LEFT.position.x, 3)
    expect(bottomLeft[1]).toBeCloseTo(ANCHOR_BOTTOM_LEFT.position.y, 3)
    expect(bottomLeft[2]).toBeCloseTo(ANCHOR_BOTTOM_LEFT.position.z, 3)

    // UVs: v=0 at pixelY=image height (bottom), v=1 at pixelY=0 (top) — GL
    // texture-space convention (THREE.Texture's default flipY).
    expect(grid!.uvs.slice(0, 2)).toEqual(new Float32Array([0, 1])) // top-left
    expect(grid!.uvs.slice(2, 4)).toEqual(new Float32Array([1, 1])) // top-right
    expect(grid!.uvs.slice(4, 6)).toEqual(new Float32Array([0, 0])) // bottom-left
  })

  it('fits sensibly with realistic (hundreds-scale) pixel coordinates and more than 3 anchors', () => {
    // Regression test: solveLeastSquaresPlane originally solved the raw 3x3
    // normal-equations system directly on pixel coordinates, which are
    // large enough (hundreds) that the system was badly conditioned —
    // Cramer's rule silently returned wildly wrong coefficients (off by
    // ~100x) rather than erroring, which only showed up with real
    // (non-tiny, non-exactly-fittable) image coordinates like these, not
    // this file's small 0-100 fixtures above. Five anchors (more than the 3
    // needed for an exact fit) at pixel coordinates in the hundreds, in a
    // rough but not perfect grid (so the fit has real, small residual —
    // like a hand/AI-drawn image never fit exactly to real star
    // proportions) is what exposed it.
    const anchors = [
      {
        pixelX: 200,
        pixelY: 200,
        position: projectHorizontalToSphere({
          altitudeDegrees: 40,
          azimuthDegrees: 170,
        }),
      },
      {
        pixelX: 800,
        pixelY: 210,
        position: projectHorizontalToSphere({
          altitudeDegrees: 42,
          azimuthDegrees: 190,
        }),
      },
      {
        pixelX: 210,
        pixelY: 800,
        position: projectHorizontalToSphere({
          altitudeDegrees: 20,
          azimuthDegrees: 172,
        }),
      },
      {
        pixelX: 790,
        pixelY: 810,
        position: projectHorizontalToSphere({
          altitudeDegrees: 22,
          azimuthDegrees: 188,
        }),
      },
      {
        // Deliberately not exactly where a perfect grid would put it, so
        // the fit is a genuine least-squares problem, not an exact one.
        pixelX: 500,
        pixelY: 480,
        position: projectHorizontalToSphere({
          altitudeDegrees: 33,
          azimuthDegrees: 179,
        }),
      },
    ]

    const grid = buildTexturedArtMeshGrid(
      anchors,
      { minX: 200, minY: 200, maxX: 800, maxY: 800 },
      1000,
      1000,
      1,
    )
    expect(grid).not.toBeNull()

    // The grid's own corners sit exactly at anchors 0/1/2/3's pixel
    // locations (pixelBounds matches their span) — each should land close
    // to that anchor's real position, not off by hundreds of world units
    // (SKY_SPHERE_RADIUS is 500) the way the unconditioned version did.
    const corners = [
      grid!.positions.slice(0, 3),
      grid!.positions.slice(3, 6),
      grid!.positions.slice(6, 9),
      grid!.positions.slice(9, 12),
    ]
    corners.forEach((corner, i) => {
      const anchor = anchors[i]
      const distance = Math.hypot(
        corner[0] - anchor.position.x,
        corner[1] - anchor.position.y,
        corner[2] - anchor.position.z,
      )
      expect(distance).toBeLessThan(20) // world units, out of a radius-500 sphere
    })
  })

  it('falls back to similarity when the anchors are collinear in pixel space (affine fit unsolvable)', () => {
    const grid = buildTexturedArtMeshGrid(
      [
        { pixelX: 0, pixelY: 0, position: ANCHOR_TOP_LEFT.position },
        { pixelX: 50, pixelY: 0, position: ANCHOR_TOP_RIGHT.position },
        { pixelX: 100, pixelY: 0, position: ANCHOR_BOTTOM_LEFT.position },
      ],
      FULL_BOUNDS,
      100,
      100,
      4,
    )
    expect(grid).not.toBeNull()
  })

  it('falls back to similarity (preserving the image proportions) when real star positions are nearly collinear despite well-spread pixel anchors', () => {
    // Mirrors Apus (Task 3): three real stars sitting nearly in a line on
    // the sky, anchored to pixels spread across two dimensions. An affine
    // fit would be forced to squash the image into a sliver to satisfy
    // every anchor; the similarity fallback keeps it undistorted instead.
    const nearlyCollinearSky = [
      projectHorizontalToSphere({ altitudeDegrees: 40, azimuthDegrees: 100 }),
      projectHorizontalToSphere({ altitudeDegrees: 40.5, azimuthDegrees: 101 }),
      projectHorizontalToSphere({ altitudeDegrees: 41, azimuthDegrees: 102 }),
    ]
    const anchors = [
      { pixelX: 100, pixelY: 500, position: nearlyCollinearSky[0] },
      { pixelX: 500, pixelY: 100, position: nearlyCollinearSky[1] },
      { pixelX: 900, pixelY: 500, position: nearlyCollinearSky[2] },
    ]

    // pixelBounds' corners coincide with anchors 0 and 2 — the least-squares
    // fit (through all 3 anchors, not forced exactly through any pair) should
    // still land its bottom-left/bottom-right corners close to those anchors'
    // real positions, unlike the old farthest-pair version's failure mode
    // (Aquila: the two chosen anchors fit exactly while a third was dragged
    // far from its actual star).
    const grid = buildTexturedArtMeshGrid(
      anchors,
      { minX: 100, minY: 100, maxX: 900, maxY: 500 },
      1000,
      600,
      1,
    )
    expect(grid).not.toBeNull()

    const worldDistance = (a: Float32Array, b: { x: number; y: number; z: number }) =>
      Math.hypot(a[0] - b.x, a[1] - b.y, a[2] - b.z)
    const bottomLeft = grid!.positions.slice(6, 9)
    const bottomRight = grid!.positions.slice(9, 12)
    expect(worldDistance(bottomLeft, anchors[0].position)).toBeLessThan(5)
    expect(worldDistance(bottomRight, anchors[2].position)).toBeLessThan(5)
  })
})
