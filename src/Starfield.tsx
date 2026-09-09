import { buildSelectedCelestialBodyInfo } from './celestialBodies/celestialBodyInfo'
import { useEffect, useRef, useState } from 'react'
import type { ObserverLocation } from './astronomy/coordinates'
import { calculateMoonState } from './celestialBodies/moonStateSource'
import { calculatePlanetStates } from './celestialBodies/planetStateSource'
import type {
  CelestialBodySearchRecord,
  SupportedCelestialBodyId,
} from './celestialBodies/celestialBodyTypes'
import type { CompassHandle } from './CompassOverlay'
import { CompassOverlay } from './CompassOverlay'
import type {
  ConstellationLabelEntry,
  ConstellationLabelsHandle,
} from './ConstellationLabelsOverlay'
import { ConstellationLabelsOverlay } from './ConstellationLabelsOverlay'
import { findConstellationArtByConstellationName } from './constellations/constellationArtCatalogSource'
import { buildRigidConstellationArtMesh } from './constellations/constellationArtRigidPlacement'
import {
  computeConstellationLineSegments,
  computeConstellationStarPositions,
  computeConstellationLookDirection,
  computeConstellationStarLabels,
  findConstellationZenithLocation,
  rankConstellationsByAltitude,
} from './constellations/constellationProjection'
import {
  findConstellationByStarId,
  loadConstellationCatalog,
} from './constellations/constellationCatalogSource'
import type { ConstellationRecord } from './constellations/constellationTypes'
import {
  canAutoHideChrome,
  closeControlMenu,
  closeSelectionInfo,
  createInitialDisplayState,
  isChromeSuppressed,
  openSelectionInfo,
  requestChromeAutoHide,
  revealChrome,
  toggleControlMenu,
  toggleControlMenuSection,
  toggleImmersiveMode,
  toggleNightModeUi,
  toggleProjectorMode,
} from './displayState'
import { ControlMenuOverlay } from './ControlMenuOverlay'
import { ImmersiveModeToggle } from './ImmersiveModeToggle'
import { findLocationPreset, locationPresets } from './locationPresets'
import type { PlaybackDirection } from './playback/playbackTime'
import {
  accumulatePlaybackTick,
  advancePlaybackDate,
} from './playback/playbackTime'
import { usePlaybackClock } from './playback/usePlaybackClock'
import { attachCameraControls } from './render/cameraControls'
import type { LabelTarget } from './render/StarfieldRenderer'
import { StarfieldRenderer } from './render/StarfieldRenderer'
import { SearchSection } from './SearchSection'
import { SkySelectionSection } from './SkySelectionSection'
import { TimeControlsSection } from './TimeControlsSection'
import { DisplaySettingsSection } from './DisplaySettingsSection'
import {
  equatorialToHorizontal,
  zenithObserverLocation,
} from './astronomy/coordinates'
import { generateCelestialBodyRenderData } from './celestialBodies/celestialBodyDataSource'
import {
  createDisplayStateFromSavedScene,
  createPersistedSceneState,
  createSavedSceneSnapshot,
} from './save/sceneState'
import { loadSceneFromStorage, saveSceneToStorage } from './save/sceneStorage'
import { projectHorizontalToSphere } from './stars/skyProjection'
import { findHygStarById } from './stars/hygCatalogSource'
import { generateMilkyWayBand } from './stars/milkyWay'
import { generateRealStarData } from './stars/realStarDataSource'
import type { SelectedStarInfo } from './stars/starInfo'
import {
  buildSelectedConstellationInfo,
  buildSelectedStarInfo,
} from './stars/starInfo'
import { toDisplayStarName } from './stars/starNameJa'
import type { HygStarRecord } from './stars/starTypes'
import { StarInfoOverlay } from './StarInfoOverlay'
import { applyOverlayAppearance } from './overlayStyles'

/** Bridges the Three.js renderer's imperative lifecycle into React mount/unmount. */
function loadInitialSavedScene() {
  if (typeof window === 'undefined') return null
  return loadSceneFromStorage(window.localStorage)?.scene ?? null
}

/** Some mobile browsers (notably iOS Safari) don't support the Fullscreen API on arbitrary elements — hide the control there rather than show a button that silently does nothing. */
function isFullscreenSupported(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.documentElement.requestFullscreen === 'function'
  )
}

function createInitialLocationMetadata(
  savedScene: ReturnType<typeof loadInitialSavedScene>,
) {
  if (savedScene) {
    return {
      label: savedScene.location.label,
      timeZoneId: savedScene.location.timeZoneId,
    }
  }

  const preset = locationPresets[0]
  return {
    label: preset.name,
    timeZoneId: preset.timeZoneId,
  }
}

function findCelestialBodyState(
  id: SupportedCelestialBodyId,
  location: ObserverLocation,
  date: Date,
) {
  if (id === 'moon') {
    return calculateMoonState(location, date)
  }

  const match = calculatePlanetStates(location, date).find(
    (body) => body.id === id,
  )
  if (!match) {
    throw new Error(`Missing celestial body state for ${id}`)
  }
  return match
}

export function Starfield() {
  const [initialSavedScene] = useState(() => loadInitialSavedScene())
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
  const selectedCelestialBodyIdRef = useRef<SupportedCelestialBodyId | null>(
    null,
  )
  const [selectedStarInfo, setSelectedStarInfo] =
    useState<SelectedStarInfo | null>(null)
  const [displayState, setDisplayState] = useState(() =>
    initialSavedScene
      ? createDisplayStateFromSavedScene(initialSavedScene)
      : createInitialDisplayState(),
  )
  const [date, setDate] = useState(() =>
    initialSavedScene ? new Date(initialSavedScene.dateIso) : new Date(),
  )
  const [location, setLocation] = useState<ObserverLocation>(() =>
    initialSavedScene
      ? {
          latitudeDegrees: initialSavedScene.location.latitudeDegrees,
          longitudeDegrees: initialSavedScene.location.longitudeDegrees,
        }
      : locationPresets[0].location,
  )
  const [locationMetadata, setLocationMetadata] = useState(() =>
    createInitialLocationMetadata(initialSavedScene),
  )
  const [isPlaying, setIsPlaying] = useState(false)
  // Must match TimeControlsSection's preset values so the speed
  // <select> reflects the actual playback rate on first render.
  const [speedMagnitude, setSpeedMagnitude] = useState(
    () => initialSavedScene?.playback.speedMagnitude ?? 50,
  )
  const [direction, setDirection] = useState<PlaybackDirection>(
    () => initialSavedScene?.playback.direction ?? 1,
  )
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>(
    'idle',
  )
  // Not part of displayState: fullscreen is a browser-owned mode that can
  // change outside our own toggle (Esc key, OS gesture), so it's tracked via
  // the fullscreenchange event below rather than the pure toggle-state
  // conventions in displayState.ts. Also excluded from SavedSceneState (D020)
  // — it's a transient, device-local UI mode, not part of the scene itself.
  const [isFullscreen, setIsFullscreen] = useState(false)
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
  const displayStateRef = useRef(displayState)
  const autoHideTimeoutRef = useRef<number | null>(null)
  const isPointerInteractingRef = useRef(false)

  useEffect(() => {
    displayStateRef.current = displayState
  }, [displayState])

  useEffect(() => {
    applyOverlayAppearance(
      displayState.isProjectorMode,
      displayState.isNightModeUi,
    )
    return () => applyOverlayAppearance(false, false)
  }, [displayState.isProjectorMode, displayState.isNightModeUi])

  useEffect(() => {
    function handleFullscreenChange(): void {
      setIsFullscreen(document.fullscreenElement !== null)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    // Nudges the page by the 1px of scroll room index.css sets aside, which
    // makes mobile browsers (Safari/Chrome/etc.) collapse their address-bar
    // chrome — a broad, no-action-required baseline for the projector-chrome
    // problem, on top of the Fullscreen API button and iOS home-screen route
    // (see DECISIONS.md D031). Some browsers reset scroll on rotation, so
    // this re-runs on orientation change too.
    function collapseBrowserChrome(): void {
      window.scrollTo(0, 1)
    }
    collapseBrowserChrome()
    window.addEventListener('orientationchange', collapseBrowserChrome)
    return () =>
      window.removeEventListener('orientationchange', collapseBrowserChrome)
  }, [])

  useEffect(() => {
    function clearAutoHideTimeout(): void {
      if (autoHideTimeoutRef.current === null) return
      window.clearTimeout(autoHideTimeoutRef.current)
      autoHideTimeoutRef.current = null
    }

    function scheduleAutoHide(): void {
      const current = displayStateRef.current
      if (
        current.isImmersiveMode ||
        current.chromeVisibility !== 'visible' ||
        !canAutoHideChrome(current)
      ) {
        return
      }
      clearAutoHideTimeout()
      autoHideTimeoutRef.current = window.setTimeout(() => {
        setDisplayState((state) => requestChromeAutoHide(state))
      }, 5_000)
    }

    function revealChromeAndScheduleAutoHide(): void {
      if (displayStateRef.current.isImmersiveMode) return
      setDisplayState((state) => revealChrome(state))
      clearAutoHideTimeout()
      scheduleAutoHide()
    }

    function handlePointerDown(): void {
      if (displayStateRef.current.isImmersiveMode) return
      isPointerInteractingRef.current = true
      revealChromeAndScheduleAutoHide()
    }

    function handlePointerMove(): void {
      if (displayStateRef.current.isImmersiveMode) return
      if (!isPointerInteractingRef.current) return
      revealChromeAndScheduleAutoHide()
    }

    function handlePointerUp(): void {
      if (displayStateRef.current.isImmersiveMode) return
      isPointerInteractingRef.current = false
      revealChromeAndScheduleAutoHide()
    }

    function handlePointerCancel(): void {
      if (displayStateRef.current.isImmersiveMode) return
      isPointerInteractingRef.current = false
      revealChromeAndScheduleAutoHide()
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (displayStateRef.current.isImmersiveMode) return
      if (event.key === 'Escape' && displayStateRef.current.isControlMenuOpen) {
        setDisplayState((state) => closeControlMenu(state))
        return
      }
      revealChromeAndScheduleAutoHide()
    }

    clearAutoHideTimeout()
    window.addEventListener('pointerdown', handlePointerDown, { capture: true })
    window.addEventListener('pointermove', handlePointerMove, { capture: true })
    window.addEventListener('pointerup', handlePointerUp, { capture: true })
    window.addEventListener('pointercancel', handlePointerCancel, {
      capture: true,
    })
    window.addEventListener('wheel', revealChromeAndScheduleAutoHide, {
      capture: true,
    })
    window.addEventListener('keydown', handleKeyDown, {
      capture: true,
    })
    scheduleAutoHide()

    return () => {
      isPointerInteractingRef.current = false
      clearAutoHideTimeout()
      window.removeEventListener('pointerdown', handlePointerDown, {
        capture: true,
      })
      window.removeEventListener('pointermove', handlePointerMove, {
        capture: true,
      })
      window.removeEventListener('pointerup', handlePointerUp, {
        capture: true,
      })
      window.removeEventListener('pointercancel', handlePointerCancel, {
        capture: true,
      })
      window.removeEventListener('wheel', revealChromeAndScheduleAutoHide, {
        capture: true,
      })
      window.removeEventListener('keydown', handleKeyDown, {
        capture: true,
      })
    }
  }, [
    displayState.activeControlMenuSection,
    displayState.chromeVisibility,
    displayState.isControlMenuOpen,
    displayState.isImmersiveMode,
    displayState.isSelectionInfoOpen,
  ])

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
      generateCelestialBodyRenderData(location, date),
      generateMilkyWayBand(location, date),
      (headingDegrees) => compassRef.current?.update(headingDegrees),
      (positions) => labelsOverlayRef.current?.update(positions),
      // Design Backlog 見た目改善: labels spread apart/together as the view
      // zooms, so a vertical-shift declutter offset computed at one zoom
      // level can stop being enough (or become unnecessary) at another.
      () => labelsOverlayRef.current?.resetDeclutter(),
    )
    rendererRef.current = renderer
    renderer.applyProjectorMode(displayStateRef.current.isProjectorMode)
    if (initialSavedScene) {
      renderer.restoreViewState(
        initialSavedScene.view.azimuthDegrees,
        initialSavedScene.view.altitudeDegrees,
        initialSavedScene.view.fovDegrees,
      )
    }

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
  //
  // Shows the selected constellation's art (Phase 13 Task 4), alongside its
  // lines/labels, using the same anchors→sky-sphere pipeline the removed
  // leoArtPrototype.ts one-off used, generalized to the full catalog
  // (constellationArtCatalogSource.ts / constellationArtProjection.ts).
  // Looked up by `constellation.name`, not `.id` — see
  // constellationArtTypes.ts's ConstellationArtRecord doc comment for why
  // `.id` can't distinguish Serpens Caput from Serpens Cauda. Async (the art
  // catalog is lazy-loaded), so this is fired without awaiting from
  // refreshConstellationDisplay; the `selectedConstellationRef` check after
  // the await guards against a stale result landing after the user already
  // selected something else (or cleared the selection) while this was
  // in flight.
  async function updateConstellationArt(
    constellation: ConstellationRecord,
    atLocation: ObserverLocation,
    atDate: Date,
  ): Promise<void> {
    const record = await findConstellationArtByConstellationName(
      constellation.name,
    )

    if (selectedConstellationRef.current?.name !== constellation.name) return

    if (record === null) {
      rendererRef.current?.hideConstellationArt()
      return
    }

    const meshGrid = buildRigidConstellationArtMesh(
      constellation,
      record,
      atLocation,
      atDate,
    )
    if (meshGrid === null) {
      rendererRef.current?.hideConstellationArt()
      return
    }
    rendererRef.current?.showConstellationArt(meshGrid, record.imageUrl)
  }

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
    void updateConstellationArt(constellation, nextLocation, nextDate)

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
    rendererRef.current?.updateCelestialBodies(
      generateCelestialBodyRenderData(location, nextDate),
    )
    rendererRef.current?.updateMilkyWay(
      generateMilkyWayBand(location, nextDate),
    )
    if (selectedConstellationRef.current) {
      refreshConstellationDisplay(
        selectedConstellationRef.current,
        location,
        nextDate,
      )
    }
    if (selectedCelestialBodyIdRef.current) {
      setSelectedStarInfo(
        buildSelectedCelestialBodyInfo(
          findCelestialBodyState(
            selectedCelestialBodyIdRef.current,
            location,
            nextDate,
          ),
        ),
      )
    }
  }

  function handleLocationChange(nextLocation: ObserverLocation): void {
    setLocation(nextLocation)
    const preset = findLocationPreset(nextLocation)
    setLocationMetadata({
      label: preset.name,
      timeZoneId: preset.timeZoneId,
    })
    rendererRef.current?.updateStars(generateRealStarData(nextLocation, date))
    rendererRef.current?.updateCelestialBodies(
      generateCelestialBodyRenderData(nextLocation, date),
    )
    rendererRef.current?.updateMilkyWay(
      generateMilkyWayBand(nextLocation, date),
    )
    if (selectedConstellationRef.current) {
      refreshConstellationDisplay(
        selectedConstellationRef.current,
        nextLocation,
        date,
      )
    }
    if (selectedCelestialBodyIdRef.current) {
      setSelectedStarInfo(
        buildSelectedCelestialBodyInfo(
          findCelestialBodyState(
            selectedCelestialBodyIdRef.current,
            nextLocation,
            date,
          ),
        ),
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
    setDisplayState((current) => closeSelectionInfo(current))
    selectedConstellationRef.current = null
    selectedCelestialBodyIdRef.current = null
    rendererRef.current?.highlightCelestialBody(null)
    rendererRef.current?.hideConstellationLines()
    rendererRef.current?.hideConstellationArt()
    rendererRef.current?.setLabelTargets([])
    setConstellationLabels([])
  }

  function handleToggleProjectorMode(): void {
    const nextProjectorMode = !displayState.isProjectorMode
    setDisplayState((current) => toggleProjectorMode(current))
    rendererRef.current?.applyProjectorMode(nextProjectorMode)
  }

  function handleToggleNightModeUi(): void {
    setDisplayState((current) => toggleNightModeUi(current))
  }

  function handleToggleImmersiveMode(): void {
    setDisplayState((current) => toggleImmersiveMode(current))
  }

  function handleToggleFullscreen(): void {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
      return
    }
    document.documentElement.requestFullscreen().catch(() => {})
  }

  function handleSaveScene(): void {
    const renderer = rendererRef.current
    if (!renderer) {
      setSaveStatus('error')
      return
    }

    const scene = createPersistedSceneState(
      createSavedSceneSnapshot({
        date,
        location,
        timeZoneId: locationMetadata.timeZoneId,
        locationLabel: locationMetadata.label,
        speedMagnitude,
        direction,
        displayState: {
          isProjectorMode: displayState.isProjectorMode,
          isNightModeUi: displayState.isNightModeUi,
        },
        view: renderer.getViewStateSnapshot(),
      }),
    )
    const result = saveSceneToStorage(window.localStorage, scene)
    setSaveStatus(result.ok ? 'saved' : 'error')
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
    selectedCelestialBodyIdRef.current = null
    rendererRef.current?.highlightCelestialBody(null)
    setSelectedStarInfo(buildSelectedStarInfo(star, constellation))
    setDisplayState((current) => openSelectionInfo(current))

    if (constellation) {
      selectedConstellationRef.current = constellation
      refreshConstellationDisplay(constellation, location, date)
    } else {
      selectedConstellationRef.current = null
      rendererRef.current?.hideConstellationLines()
      rendererRef.current?.hideConstellationArt()
      rendererRef.current?.setLabelTargets([])
      setConstellationLabels([])
    }
  }

  // Handles a tap/click on the canvas (Task 5, via attachCameraControls'
  // onTap — see handleCanvasTapRef below). Hit-tests for the nearest star
  // under the pointer and, on a hit, selects it (selectStar above). Tapping
  // empty space deselects.
  function handleCanvasTap(clientX: number, clientY: number): void {
    if (displayState.isImmersiveMode) return

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
    // A search hit can be below the horizon. Since 4次 adds an actual ground
    // dome, moving the camera straight to a negative altitude now mostly shows
    // the ground/empty darkness and reads as a broken jump rather than a
    // useful selection result.
    rendererRef.current?.lookAt(
      horizontal.azimuthDegrees,
      Math.max(horizontal.altitudeDegrees, 2),
    )
    setDisplayState((current) => closeControlMenu(current))
  }

  // Task 6: a search-selected constellation has no single star to show info
  // for, so this shows its line/labels and moves the view to their average
  // direction. Task 7 added constellation trivia to that same info panel
  // (buildSelectedConstellationInfo leaves brightness/color null, which
  // StarInfoOverlay treats as "no star selected" and skips that line).
  // `atLocation` defaults to the current observer location; the constellation
  // list overlay below passes an explicit one when it has just relocated the
  // observer in the same tick (`location` state wouldn't reflect that yet).
  function handleSelectConstellationResult(
    constellation: ConstellationRecord,
    atLocation: ObserverLocation = location,
  ): void {
    selectedCelestialBodyIdRef.current = null
    rendererRef.current?.highlightCelestialBody(null)
    setSelectedStarInfo(buildSelectedConstellationInfo(constellation))
    setDisplayState((current) => openSelectionInfo(closeControlMenu(current)))
    selectedConstellationRef.current = constellation
    const lookDirection = refreshConstellationDisplay(
      constellation,
      atLocation,
      date,
    )
    if (lookDirection) {
      rendererRef.current?.lookAt(
        lookDirection.azimuthDegrees,
        lookDirection.altitudeDegrees,
      )
      requestAnimationFrame(() => {
        const renderer = rendererRef.current
        if (!renderer) return
        ;(
          window as Window & { __constellationAnchorDebug?: unknown }
        ).__constellationAnchorDebug = {
          name: constellation.name,
          anchors: computeConstellationStarPositions(
            constellation,
            atLocation,
            date,
          ).map(({ starId, position }) => ({
            starId,
            ...renderer.getScreenProjection(position),
          })),
        }
      })
    }
  }

  /**
   * Formats a location produced by findConstellationZenithLocation for
   * display — it's a computed viewpoint, not a real named place, so unlike
   * handleLocationChange this doesn't run it through findLocationPreset
   * (which would silently mislabel it as the nearest preset, Tokyo by
   * default, since it won't exactly match any preset's coordinates).
   */
  function describeComputedLocation(zenithLocation: ObserverLocation): string {
    const latHemisphere = zenithLocation.latitudeDegrees >= 0 ? '北緯' : '南緯'
    const lonHemisphere = zenithLocation.longitudeDegrees >= 0 ? '東経' : '西経'
    return (
      `${latHemisphere}${Math.abs(zenithLocation.latitudeDegrees).toFixed(1)}° ` +
      `${lonHemisphere}${Math.abs(zenithLocation.longitudeDegrees).toFixed(1)}°`
    )
  }

  // Used by both search results and the menu's direct-selection list.
  // (the latter already lists all 89 catalog records in a plain dropdown —
  // no separate "browse all" UI needed). Picking one that's already visible
  // from here just selects it, same as before. Picking one that isn't (e.g.
  // a summer constellation at a winter date/time) relocates the observer to
  // wherever it's currently at zenith (findConstellationZenithLocation)
  // instead of silently selecting nothing, which is what plain
  // handleSelectConstellationResult would do — refreshConstellationDisplay
  // returns null and nothing gets pointed at.
  function handleSelectConstellationFromList(
    constellation: ConstellationRecord,
  ): void {
    const visibleHere =
      computeConstellationLineSegments(constellation, location, date).length > 0
    if (visibleHere) {
      handleSelectConstellationResult(constellation)
      return
    }

    const zenithLocation = findConstellationZenithLocation(constellation, date)
    if (zenithLocation === null) {
      // No resolvable center (shouldn't happen for real catalog data) —
      // fall back to the normal (no-op-looking) selection rather than doing
      // nothing at all.
      handleSelectConstellationResult(constellation)
      return
    }

    setLocation(zenithLocation)
    setLocationMetadata({
      label: describeComputedLocation(zenithLocation),
      timeZoneId: 'UTC',
    })
    rendererRef.current?.updateStars(generateRealStarData(zenithLocation, date))
    rendererRef.current?.updateCelestialBodies(
      generateCelestialBodyRenderData(zenithLocation, date),
    )
    rendererRef.current?.updateMilkyWay(
      generateMilkyWayBand(zenithLocation, date),
    )
    handleSelectConstellationResult(constellation, zenithLocation)
  }

  // Dev-only capture helper (scripts/capture-all-constellations.mjs): unlike
  // handleSelectConstellationFromList, always relocates to the
  // constellation's zenith regardless of whether it's already partially
  // visible from the current location/date. Partial visibility was silently
  // producing incomplete reference captures — e.g. Andromeda showing only
  // 7 of its 17 line-figure stars because a few segments happened to be
  // above the horizon already, so the "already visible, don't relocate"
  // branch never ran — see docs/features/phase-13-implementation-tasks.md
  // Task 4 for why capture completeness matters for anchor authoring.
  // Exposed on window (like __constellationAnchorDebug) rather than reused
  // in the normal UI flow, since always relocating would be an unwanted
  // surprise for a user just browsing constellations that are mostly, but
  // not entirely, in view.
  function debugSelectConstellationAtZenith(name: string): void {
    const constellation = loadConstellationCatalog().find(
      (record) => record.name === name,
    )
    if (!constellation) return

    const zenithLocation =
      findConstellationZenithLocation(constellation, date) ?? location
    setLocation(zenithLocation)
    setLocationMetadata({
      label: describeComputedLocation(zenithLocation),
      timeZoneId: 'UTC',
    })
    rendererRef.current?.updateStars(generateRealStarData(zenithLocation, date))
    rendererRef.current?.updateCelestialBodies(
      generateCelestialBodyRenderData(zenithLocation, date),
    )
    rendererRef.current?.updateMilkyWay(
      generateMilkyWayBand(zenithLocation, date),
    )
    handleSelectConstellationResult(constellation, zenithLocation)
  }

  useEffect(() => {
    ;(
      window as Window & {
        __debugSelectConstellationAtZenith?: (name: string) => void
      }
    ).__debugSelectConstellationAtZenith = debugSelectConstellationAtZenith
  })

  function handleSelectCelestialBodyResult(
    celestialBody: CelestialBodySearchRecord,
  ): void {
    clearSelection()
    const state = findCelestialBodyState(celestialBody.id, location, date)
    selectedCelestialBodyIdRef.current = celestialBody.id
    rendererRef.current?.highlightCelestialBody(celestialBody.id)
    setSelectedStarInfo(buildSelectedCelestialBodyInfo(state))
    setDisplayState((current) => openSelectionInfo(closeControlMenu(current)))
    if (state.horizontal.altitudeDegrees >= 0) {
      rendererRef.current?.lookAt(
        state.horizontal.azimuthDegrees,
        state.horizontal.altitudeDegrees,
      )
    }
  }

  // Search is for identifying an object, not changing the current view.
  function handleSelectCelestialBodyFromSearch(
    celestialBody: CelestialBodySearchRecord,
  ): void {
    clearSelection()
    const currentState = findCelestialBodyState(
      celestialBody.id,
      location,
      date,
    )
    const searchLocation = zenithObserverLocation(currentState.equatorial, date)
    handleLocationChange(searchLocation)
    setLocationMetadata({
      label: describeComputedLocation(searchLocation),
      timeZoneId: 'Etc/UTC',
    })
    const state = findCelestialBodyState(celestialBody.id, searchLocation, date)
    selectedCelestialBodyIdRef.current = celestialBody.id
    rendererRef.current?.highlightCelestialBody(celestialBody.id)
    setSelectedStarInfo(buildSelectedCelestialBodyInfo(state))
    setDisplayState((current) => openSelectionInfo(current))
    rendererRef.current?.lookAt(
      state.horizontal.azimuthDegrees,
      state.horizontal.altitudeDegrees,
    )
  }

  function handleSelectStarFromSearch(star: HygStarRecord): void {
    const searchLocation = zenithObserverLocation(
      { raHours: star.raHours, decDegrees: star.decDegrees },
      date,
    )
    handleLocationChange(searchLocation)
    setLocationMetadata({
      label: describeComputedLocation(searchLocation),
      timeZoneId: 'Etc/UTC',
    })
    selectStar(star, findConstellationByStarId(star.id))
    rendererRef.current?.lookAt(0, 90)
    setDisplayState((current) => closeControlMenu(current))
  }

  // Constellations whose visible portion sits below this altitude are
  // treated as "just grazing the horizon", matching
  // celestialBodyInfo.ts's describeVisibility bar ("地平線近くに見える"
  // below 5°) rather than a one-off number invented just for this button.
  const MIN_LOOK_ALTITUDE_DEGREES = 5

  // Revives the Task 3/4 dev-only test button as a real feature: jumps to
  // the next well-placed constellation each press, best-placed (highest
  // current altitude) first — see rankConstellationsByAltitude for why this
  // replaced an earlier alphabetical ordering. Wraps around, and continues
  // from whichever constellation is already selected (including one picked
  // via search or a tap) rather than always restarting from the best-placed
  // one.
  function handleNextConstellation(): void {
    const visible = rankConstellationsByAltitude(
      loadConstellationCatalog(),
      location,
      date,
      MIN_LOOK_ALTITUDE_DEGREES,
    )
    if (visible.length === 0) return

    const currentIndex = selectedConstellationRef.current
      ? visible.findIndex(
          (c) => c.name === selectedConstellationRef.current?.name,
        )
      : -1
    const next = visible[(currentIndex + 1) % visible.length]
    handleSelectConstellationResult(next)
  }

  const isChromeHidden = isChromeSuppressed(displayState)

  return (
    <>
      <canvas ref={canvasRef} className="starfield-canvas" />
      {!isChromeHidden && (
        <>
          <CompassOverlay ref={compassRef} />
          <ConstellationLabelsOverlay
            ref={labelsOverlayRef}
            labels={constellationLabels}
          />
          <ControlMenuOverlay
            isOpen={displayState.isControlMenuOpen}
            activeSection={displayState.activeControlMenuSection}
            locationLabel={locationMetadata.label}
            date={date}
            timeZoneId={locationMetadata.timeZoneId}
            onToggleMenu={() =>
              setDisplayState((current) => toggleControlMenu(current))
            }
            onCloseMenu={() =>
              setDisplayState((current) => closeControlMenu(current))
            }
            onToggleSection={(section) =>
              setDisplayState((current) =>
                toggleControlMenuSection(current, section),
              )
            }
            skySection={
              <SkySelectionSection
                date={date}
                location={location}
                timeZoneId={locationMetadata.timeZoneId}
                onDateChange={handleDateChange}
                onLocationChange={handleLocationChange}
              />
            }
            timeSection={
              <TimeControlsSection
                isPlaying={isPlaying}
                onTogglePlaying={() => setIsPlaying((current) => !current)}
                speedMagnitude={speedMagnitude}
                onSpeedChange={setSpeedMagnitude}
                direction={direction}
                onToggleDirection={() =>
                  setDirection((current) => (current === 1 ? -1 : 1))
                }
                onReturnToCurrentTime={() => handleDateChange(new Date())}
              />
            }
            searchSection={
              <SearchSection
                onSelectCelestialBody={handleSelectCelestialBodyFromSearch}
                onSelectConstellation={handleSelectConstellationFromList}
                onSelectStar={handleSelectStarFromSearch}
                onSelectBrowseCelestialBody={handleSelectCelestialBodyResult}
                onSelectBrowseConstellation={handleSelectConstellationFromList}
                onSelectBrowseStar={handleSelectStarResult}
                onSelectNextConstellation={handleNextConstellation}
              />
            }
            displaySection={
              <DisplaySettingsSection
                isProjectorMode={displayState.isProjectorMode}
                onToggleProjectorMode={handleToggleProjectorMode}
                isNightModeUi={displayState.isNightModeUi}
                onToggleNightModeUi={handleToggleNightModeUi}
                isFullscreenSupported={isFullscreenSupported()}
                isFullscreen={isFullscreen}
                onToggleFullscreen={handleToggleFullscreen}
                saveStatus={saveStatus}
                onSave={handleSaveScene}
              />
            }
          />
          <StarInfoOverlay
            info={selectedStarInfo}
            isOpen={displayState.isSelectionInfoOpen}
            onClose={() =>
              setDisplayState((current) => closeSelectionInfo(current))
            }
            onReopen={() =>
              setDisplayState((current) => openSelectionInfo(current))
            }
            onClearSelection={clearSelection}
          />
        </>
      )}
      {displayState.chromeVisibility === 'visible' && (
        <ImmersiveModeToggle
          isImmersive={displayState.isImmersiveMode}
          onToggle={handleToggleImmersiveMode}
        />
      )}
    </>
  )
}
