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
  setVisualPreset,
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
      visualPreset: 'planetarium-like',
      isProjectorMode: false,
    })
  })

  it('keeps only one overlay panel open at a time', () => {
    const withDate = toggleOverlayPanel(createInitialDisplayState(), 'date')
    expect(withDate.activePanel).toBe('date')

    const withLocation = toggleOverlayPanel(withDate, 'location')
    expect(withLocation.activePanel).toBe('location')

    const closed = toggleOverlayPanel(withLocation, 'location')
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
      visualPreset: 'planetarium-like',
      isProjectorMode: false,
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
      visualPreset: 'planetarium-like',
      isProjectorMode: false,
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

  it('switches visual presets without affecting other display state', () => {
    const hiddenWithSelection = requestChromeAutoHide(
      openSelectionInfo(createInitialDisplayState()),
    )
    const updated = setVisualPreset(hiddenWithSelection, 'gentle-contrast')

    expect(updated).toEqual({
      activePanel: null,
      isSelectionInfoOpen: true,
      mode: 'standard',
      chromeVisibility: 'visible',
      visualPreset: 'gentle-contrast',
      isProjectorMode: false,
    })
  })

  it('toggles projector mode without affecting panel or preset selection', () => {
    const state = setVisualPreset(
      toggleOverlayPanel(createInitialDisplayState(), 'date'),
      'gentle-contrast',
    )
    const enabled = toggleProjectorMode(state)

    expect(enabled).toEqual({
      activePanel: 'date',
      isSelectionInfoOpen: false,
      mode: 'standard',
      chromeVisibility: 'visible',
      visualPreset: 'gentle-contrast',
      isProjectorMode: true,
    })

    expect(toggleProjectorMode(enabled).isProjectorMode).toBe(false)
  })
})
