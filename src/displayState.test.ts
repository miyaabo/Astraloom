import { describe, expect, it } from 'vitest'
import {
  canAutoHideChrome,
  closeOverlayPanel,
  closeSelectionInfo,
  createInitialDisplayState,
  enterImmersiveMode,
  exitImmersiveMode,
  isChromeSuppressed,
  openSelectionInfo,
  requestChromeAutoHide,
  revealChrome,
  toggleNightModeUi,
  toggleProjectorMode,
  toggleOverlayPanel,
} from './displayState'

describe('displayState', () => {
  it('starts in standard mode with no open panel or selection info', () => {
    expect(createInitialDisplayState()).toEqual({
      activePanel: null,
      isSelectionInfoOpen: false,
      mode: 'standard',
      chromeVisibility: 'visible',
      isProjectorMode: false,
      isNightModeUi: false,
    })
  })

  it('keeps only one overlay panel open at a time', () => {
    const withDate = toggleOverlayPanel(createInitialDisplayState(), 'date')
    expect(withDate.activePanel).toBe('date')

    const withLocation = toggleOverlayPanel(withDate, 'location')
    expect(withLocation.activePanel).toBe('location')

    const withSettings = toggleOverlayPanel(withLocation, 'settings')
    expect(withSettings.activePanel).toBe('settings')

    const closed = toggleOverlayPanel(withSettings, 'settings')
    expect(closed.activePanel).toBeNull()
  })

  it('closes selection info without losing other display state', () => {
    const state = openSelectionInfo(
      toggleOverlayPanel(createInitialDisplayState(), 'search'),
    )

    expect(closeSelectionInfo(state)).toEqual({
      activePanel: 'search',
      isSelectionInfoOpen: false,
      mode: 'standard',
      chromeVisibility: 'visible',
      isProjectorMode: false,
      isNightModeUi: false,
    })
  })

  it('enters immersive mode by clearing transient panels and text overlays', () => {
    const state = openSelectionInfo(
      toggleOverlayPanel(createInitialDisplayState(), 'search'),
    )

    expect(enterImmersiveMode(state)).toEqual({
      activePanel: null,
      isSelectionInfoOpen: false,
      mode: 'immersive',
      chromeVisibility: 'visible',
      isProjectorMode: false,
      isNightModeUi: false,
    })
  })

  it('treats immersive mode and idle hiding as separate suppression sources', () => {
    const standardHidden = requestChromeAutoHide(createInitialDisplayState())
    expect(standardHidden.chromeVisibility).toBe('hidden')
    expect(isChromeSuppressed(standardHidden)).toBe(true)

    const immersive = enterImmersiveMode(createInitialDisplayState())
    expect(immersive.chromeVisibility).toBe('visible')
    expect(isChromeSuppressed(immersive)).toBe(true)
    expect(exitImmersiveMode(immersive)).toEqual(createInitialDisplayState())
  })

  it('auto-hide is blocked while an overlay panel or selection info is active', () => {
    expect(
      canAutoHideChrome(toggleOverlayPanel(createInitialDisplayState(), 'date')),
    ).toBe(false)
    expect(canAutoHideChrome(openSelectionInfo(createInitialDisplayState()))).toBe(
      false,
    )
    expect(canAutoHideChrome(createInitialDisplayState())).toBe(true)
  })

  it('reopens hidden chrome and can close the active panel explicitly', () => {
    const hidden = requestChromeAutoHide(createInitialDisplayState())
    const visible = revealChrome(hidden)
    expect(visible.chromeVisibility).toBe('visible')

    const withPanel = toggleOverlayPanel(visible, 'search')
    expect(closeOverlayPanel(withPanel).activePanel).toBeNull()
  })

  it('toggles projector mode without affecting panel selection', () => {
    const state = toggleOverlayPanel(createInitialDisplayState(), 'date')
    const enabled = toggleProjectorMode(state)

    expect(enabled).toEqual({
      activePanel: 'date',
      isSelectionInfoOpen: false,
      mode: 'standard',
      chromeVisibility: 'visible',
      isProjectorMode: true,
      isNightModeUi: false,
    })

    expect(toggleProjectorMode(enabled).isProjectorMode).toBe(false)
  })

  it('toggles night mode UI independently from projector mode', () => {
    const state = toggleProjectorMode(createInitialDisplayState())
    const enabled = toggleNightModeUi(state)

    expect(enabled).toEqual({
      activePanel: null,
      isSelectionInfoOpen: false,
      mode: 'standard',
      chromeVisibility: 'visible',
      isProjectorMode: true,
      isNightModeUi: true,
    })

    expect(toggleNightModeUi(enabled).isNightModeUi).toBe(false)
    expect(toggleNightModeUi(enabled).isProjectorMode).toBe(true)
  })
})
