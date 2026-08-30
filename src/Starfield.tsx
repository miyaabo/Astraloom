import { useEffect, useRef, useState } from 'react'
import type { ObserverLocation } from './astronomy/coordinates'
import type { CompassHandle } from './CompassOverlay'
import { CompassOverlay } from './CompassOverlay'
import type {
  ConstellationLabelEntry,
  ConstellationLabelsHandle,
} from './ConstellationLabelsOverlay'
import { ConstellationLabelsOverlay } from './ConstellationLabelsOverlay'
import {
  computeConstellationLineSegments,
  computeConstellationLookDirection,
  computeConstellationStarLabels,
} from './constellations/constellationProjection'
import {
  findConstellationByStarId,
  loadConstellationCatalog,
} from './constellations/constellationCatalogSource'
import type { ConstellationRecord } from './constellations/constellationTypes'
import { DateTimeOverlay } from './DateTimeOverlay'
import { LocationOverlay } from './LocationOverlay'
import { findLocationPreset, locationPresets } from './locationPresets'
import { NextConstellationButton } from './NextConstellationButton'
import { PlaybackOverlay } from './PlaybackOverlay'
import type { PlaybackDirection } from './playback/playbackTime'
import {
  accumulatePlaybackTick,
  advancePlaybackDate,
} from './playback/playbackTime'
import { usePlaybackClock } from './playback/usePlaybackClock'
import { attachCameraControls } from './render/cameraControls'
import type { LabelTarget } from './render/StarfieldRenderer'
import { StarfieldRenderer } from './render/StarfieldRenderer'
import { SearchOverlay } from './SearchOverlay'
import { equatorialToHorizontal } from './astronomy/coordinates'
import { projectHorizontalToSphere } from './stars/skyProjection'
import { findHygStarById } from './stars/hygCatalogSource'
import { generateRealStarData } from './stars/realStarDataSource'
import type { SelectedStarInfo } from './stars/starInfo'
import {
  buildSelectedConstellationInfo,
  buildSelectedStarInfo,
} from './stars/starInfo'
import { toDisplayStarName } from './stars/starNameJa'
import type { HygStarRecord } from './stars/starTypes'
import { StarInfoOverlay } from './StarInfoOverlay'

/** Bridges the Three.js renderer's imperative lifecycle into React mount/unmount. */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<StarfieldRenderer | null>(null)
  const compassRef = useRef<CompassHandle>(null)
  const labelsOverlayRef = useRef<ConstellationLabelsHandle>(null)
  const [constellationLabels, setConstellationLabels] = useState<
    ConstellationLabelEntry[]
  >([])
  // The constellation currently shown (Task 5: set when a tap/click selects
  // one of its stars), so its line/label positions can be recomputed on
  // every date/location change — see refreshConstellationDisplay below. Null
  // when nothing is selected.
  const selectedConstellationRef = useRef<ConstellationRecord | null>(null)
  const [selectedStarInfo, setSelectedStarInfo] =
    useState<SelectedStarInfo | null>(null)
  const [date, setDate] = useState(() => new Date())
  const [location, setLocation] = useState<ObserverLocation>(
    () => locationPresets[0].location,
  )
  // At most one overlay panel open at a time (date/location are anchored to
  // the same top-right corner and would overlap; search is top-left but
  // stays in this same single-open state to keep the "only one panel open"
  // rule simple app-wide — Task 6).
  const [openOverlay, setOpenOverlay] = useState<
    'date' | 'location' | 'search' | null
  >(null)
  const [isPlaying, setIsPlaying] = useState(false)
  // Must match one of PlaybackOverlay's SPEED_PRESET_MAGNITUDES so the speed
  // <select> reflects the actual playback rate on first render.
  const [speedMagnitude, setSpeedMagnitude] = useState(50)
  const [direction, setDirection] = useState<PlaybackDirection>(1)
  // Accumulates real time between throttled recomputes (Task 5); see
  // accumulatePlaybackTick for why recompute is capped below the rAF rate.
  const pendingPlaybackRealMsRef = useRef(0)
  // handleCanvasTap (defined below) is passed to attachCameraControls inside
  // the mount-only effect, so it can't close over each render's fresh
  // `location`/`date`. Instead the effect wires a stable wrapper that always
  // calls whatever this ref currently points to, updated every render below
  // — the same "latest callback" approach usePlaybackClock uses internally.
  const handleCanvasTapRef = useRef<(clientX: number, clientY: number) => void>(
    () => {},
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Only the initial `date`/`location` values seed the renderer here;
    // later changes go through handleDateChange/handleLocationChange below
    // (updateStars), not a remount, so the WebGL context isn't recreated on
    // every edit.
    const renderer = new StarfieldRenderer(
      canvas,
      generateRealStarData(location, date),
      (headingDegrees) => compassRef.current?.update(headingDegrees),
      (positions) => labelsOverlayRef.current?.update(positions),
      // Design Backlog 見た目改善: labels spread apart/together as the view
      // zooms, so a vertical-shift declutter offset computed at one zoom
      // level can stop being enough (or become unnecessary) at another.
      () => labelsOverlayRef.current?.resetDeclutter(),
    )
    rendererRef.current = renderer

    // ResizeObserver catches layout-size changes from any cause (window
    // resize, orientation change, mobile address-bar show/hide) and fires
    // once immediately on observe(), so no separate initial call is needed.
    const resizeObserver = new ResizeObserver(() => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight)
    })
    resizeObserver.observe(canvas)
    renderer.start()

    const detachCameraControls = attachCameraControls(
      canvas,
      renderer,
      (clientX, clientY) => handleCanvasTapRef.current(clientX, clientY),
    )

    return () => {
      detachCameraControls()
      resizeObserver.disconnect()
      renderer.dispose()
      rendererRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `date` here only seeds the initial render; see comment above.
  }, [])

  // Recomputes the currently selected constellation's line/label positions
  // for a given date/location. Doesn't move the camera itself (a tap/click
  // selection never moves the camera — see handleCanvasTap below) but
  // returns the constellation's average look direction so callers that do
  // want to move the view (Task 6's search selection) don't need to
  // recompute the same segments separately. Stars physically move across the
  // sky as `date` advances (real alt/az recompute, same as
  // generateRealStarData), so a selected constellation's lines/labels need
  // the same recompute on every date/location change or they visibly lag
  // behind the star field during playback — this was reported as
  // lines/labels barely moving compared to the stars while time-lapsing.
  function refreshConstellationDisplay(
    constellation: ConstellationRecord,
    nextLocation: ObserverLocation,
    nextDate: Date,
  ): { azimuthDegrees: number; altitudeDegrees: number } | null {
    const segments = computeConstellationLineSegments(
      constellation,
      nextLocation,
      nextDate,
    )
    rendererRef.current?.showConstellationLines(segments)

    const lookDirection = computeConstellationLookDirection(segments)
    if (!lookDirection) {
      // Every segment is below the horizon now (e.g. after a large time
      // jump) — nothing left to label.
      rendererRef.current?.setLabelTargets([])
      setConstellationLabels([])
      return null
    }

    const starLabels = computeConstellationStarLabels(
      constellation,
      nextLocation,
      nextDate,
    )
    // Brightest-first (lower magnitude = brighter), so when two star labels
    // land close together on screen, StarfieldRenderer's thinning
    // (updateLabelPositions, Design Backlog 見た目改善) keeps the brighter
    // one — labelTargets/constellationLabels order is that priority order,
    // constellation name always first.
    const sortedStarLabels = [...starLabels].sort(
      (a, b) =>
        (findHygStarById(a.starId)?.magnitude ?? Infinity) -
        (findHygStarById(b.starId)?.magnitude ?? Infinity),
    )
    const labelTargets: LabelTarget[] = [
      {
        key: 'constellation-name',
        position: projectHorizontalToSphere(lookDirection),
      },
      ...sortedStarLabels.map((label) => ({
        key: `star-${label.starId}`,
        position: label.position,
      })),
    ]
    rendererRef.current?.setLabelTargets(labelTargets)
    setConstellationLabels([
      {
        key: 'constellation-name',
        text: `${constellation.name} (${constellation.nameJa})`,
        variant: 'constellation',
      },
      ...sortedStarLabels.map((label) => ({
        key: `star-${label.starId}`,
        text: toDisplayStarName(label.properName),
        variant: 'star' as const,
      })),
    ])
    return lookDirection
  }

  function handleDateChange(nextDate: Date): void {
    setDate(nextDate)
    rendererRef.current?.updateStars(generateRealStarData(location, nextDate))
    if (selectedConstellationRef.current) {
      refreshConstellationDisplay(
        selectedConstellationRef.current,
        location,
        nextDate,
      )
    }
  }

  function handleLocationChange(nextLocation: ObserverLocation): void {
    setLocation(nextLocation)
    rendererRef.current?.updateStars(generateRealStarData(nextLocation, date))
    if (selectedConstellationRef.current) {
      refreshConstellationDisplay(
        selectedConstellationRef.current,
        nextLocation,
        date,
      )
    }
  }

  // Advances `date` through the same handleDateChange -> generateRealStarData
  // -> updateStars path as the manual date picker (Task 4). Re-created each
  // render so it always closes over the latest date/speed/direction, which
  // usePlaybackClock picks up via its onTick ref without restarting the loop.
  // Recompute is throttled (Task 5) via accumulatePlaybackTick so the
  // (measured) expensive recompute+geometry-rebuild doesn't run on every rAF.
  function handlePlaybackTick(deltaRealMs: number): void {
    const { nextPendingRealMs, elapsedRealMs } = accumulatePlaybackTick(
      pendingPlaybackRealMsRef.current,
      deltaRealMs,
    )
    pendingPlaybackRealMsRef.current = nextPendingRealMs
    if (elapsedRealMs === null) return

    handleDateChange(
      advancePlaybackDate(date, elapsedRealMs, speedMagnitude, direction),
    )
  }

  usePlaybackClock(isPlaying, handlePlaybackTick)

  // Clears the current star/constellation selection (Task 5): closes the
  // info panel and hides whatever line/labels were shown for it, returning
  // to the plain starfield (D017 / Product Principle 5).
  function clearSelection(): void {
    setSelectedStarInfo(null)
    selectedConstellationRef.current = null
    rendererRef.current?.hideConstellationLines()
    rendererRef.current?.setLabelTargets([])
    setConstellationLabels([])
  }

  // Shows a star's info panel and, if it belongs to a constellation, that
  // constellation's line + name/star labels (reusing the same
  // refreshConstellationDisplay used for date/location changes). Shared by
  // handleCanvasTap (Task 5) and Task 6's search result selection below —
  // both resolve to a HygStarRecord + its constellation (if any) before
  // calling this.
  function selectStar(
    star: HygStarRecord,
    constellation: ConstellationRecord | null,
  ): void {
    setSelectedStarInfo(buildSelectedStarInfo(star, constellation))

    if (constellation) {
      selectedConstellationRef.current = constellation
      refreshConstellationDisplay(constellation, location, date)
    } else {
      selectedConstellationRef.current = null
      rendererRef.current?.hideConstellationLines()
      rendererRef.current?.setLabelTargets([])
      setConstellationLabels([])
    }
  }

  // Handles a tap/click on the canvas (Task 5, via attachCameraControls'
  // onTap — see handleCanvasTapRef below). Hit-tests for the nearest star
  // under the pointer and, on a hit, selects it (selectStar above). Tapping
  // empty space deselects.
  function handleCanvasTap(clientX: number, clientY: number): void {
    const canvas = canvasRef.current
    const renderer = rendererRef.current
    if (!canvas || !renderer) return

    const hit = renderer.hitTestStar(
      clientX,
      clientY,
      canvas.getBoundingClientRect(),
    )
    if (!hit) {
      clearSelection()
      return
    }

    const hygStar = findHygStarById(hit.hygId)
    if (!hygStar) {
      clearSelection()
      return
    }

    selectStar(hygStar, findConstellationByStarId(hit.hygId))
  }
  // Refs may not be written during render (only in effects/event handlers),
  // so syncing the "latest callback" ref (see its declaration above) needs
  // its own effect — cheap enough to run after every render.
  useEffect(() => {
    handleCanvasTapRef.current = handleCanvasTap
  })

  // Task 6: a search-selected star gets the same info panel/constellation
  // display a tap/click would (selectStar above), plus moves the view to
  // the star's current direction — equatorialToHorizontal is the same
  // conversion constellationProjection.ts uses for line/label placement.
  function handleSelectStarResult(star: HygStarRecord): void {
    selectStar(star, findConstellationByStarId(star.id))
    const horizontal = equatorialToHorizontal(
      { raHours: star.raHours, decDegrees: star.decDegrees },
      location,
      date,
    )
    rendererRef.current?.lookAt(
      horizontal.azimuthDegrees,
      horizontal.altitudeDegrees,
    )
    setOpenOverlay(null)
  }

  // Task 6: a search-selected constellation has no single star to show info
  // for, so this shows its line/labels and moves the view to their average
  // direction. Task 7 added constellation trivia to that same info panel
  // (buildSelectedConstellationInfo leaves brightness/color null, which
  // StarInfoOverlay treats as "no star selected" and skips that line).
  function handleSelectConstellationResult(
    constellation: ConstellationRecord,
  ): void {
    setSelectedStarInfo(buildSelectedConstellationInfo(constellation))
    selectedConstellationRef.current = constellation
    const lookDirection = refreshConstellationDisplay(
      constellation,
      location,
      date,
    )
    if (lookDirection) {
      rendererRef.current?.lookAt(
        lookDirection.azimuthDegrees,
        lookDirection.altitudeDegrees,
      )
    }
    setOpenOverlay(null)
  }

  // Revives the Task 3/4 dev-only test button as a real feature: jumps to
  // the next currently-visible constellation each press, cycling through
  // constellations with at least one line segment above the horizon right
  // now (reusing computeConstellationLineSegments' own horizon cutoff),
  // sorted by name for a stable, repeatable cycling order. Wraps around, and
  // continues from whichever constellation is already selected (including
  // one picked via search or a tap) rather than always restarting from the
  // top of the list.
  function handleNextConstellation(): void {
    const visible = loadConstellationCatalog()
      .filter(
        (c) => computeConstellationLineSegments(c, location, date).length > 0,
      )
      .sort((a, b) => a.name.localeCompare(b.name))
    if (visible.length === 0) return

    const currentIndex = selectedConstellationRef.current
      ? visible.findIndex(
          (c) => c.name === selectedConstellationRef.current?.name,
        )
      : -1
    const next = visible[(currentIndex + 1) % visible.length]
    handleSelectConstellationResult(next)
  }

  return (
    <>
      <canvas ref={canvasRef} className="starfield-canvas" />
      <CompassOverlay ref={compassRef} />
      <ConstellationLabelsOverlay
        ref={labelsOverlayRef}
        labels={constellationLabels}
      />
      <SearchOverlay
        isOpen={openOverlay === 'search'}
        onToggleOpen={() =>
          setOpenOverlay((current) => (current === 'search' ? null : 'search'))
        }
        onSelectConstellation={handleSelectConstellationResult}
        onSelectStar={handleSelectStarResult}
      />
      <NextConstellationButton onClick={handleNextConstellation} />
      <DateTimeOverlay
        date={date}
        onChange={handleDateChange}
        isOpen={openOverlay === 'date'}
        onToggleOpen={() =>
          setOpenOverlay((current) => (current === 'date' ? null : 'date'))
        }
        timeZoneId={findLocationPreset(location).timeZoneId}
      />
      <LocationOverlay
        location={location}
        onChange={handleLocationChange}
        isOpen={openOverlay === 'location'}
        onToggleOpen={() =>
          setOpenOverlay((current) =>
            current === 'location' ? null : 'location',
          )
        }
      />
      <PlaybackOverlay
        isPlaying={isPlaying}
        onTogglePlaying={() => setIsPlaying((current) => !current)}
        speedMagnitude={speedMagnitude}
        onSpeedChange={setSpeedMagnitude}
        direction={direction}
        onToggleDirection={() =>
          setDirection((current) => (current === 1 ? -1 : 1))
        }
      />
      <StarInfoOverlay info={selectedStarInfo} onClose={clearSelection} />
    </>
  )
}
