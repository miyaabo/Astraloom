import { describe, expect, it } from 'vitest'
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

describe('displayState', () => {
  it('starts with only the unified control menu state', () => {
    expect(createInitialDisplayState()).toEqual({
      isControlMenuOpen: false,
      activeControlMenuSection: null,
      isSelectionInfoOpen: false,
      isImmersiveMode: false,
      chromeVisibility: 'visible',
      isProjectorMode: false,
      isNightModeUi: false,
    })
  })

  it('opens, closes, and keeps at most one menu section expanded', () => {
    const sky = toggleControlMenuSection(createInitialDisplayState(), 'sky')
    const time = toggleControlMenuSection(sky, 'time')

    expect(sky).toMatchObject({
      isControlMenuOpen: true,
      activeControlMenuSection: 'sky',
    })
    expect(time).toMatchObject({
      isControlMenuOpen: true,
      activeControlMenuSection: 'time',
    })
    expect(toggleControlMenuSection(time, 'time')).toMatchObject({
      activeControlMenuSection: null,
    })
    expect(
      closeControlMenu(toggleControlMenu(createInitialDisplayState())),
    ).toEqual(createInitialDisplayState())
  })

  it('does not auto-hide while the menu or selection information is open', () => {
    expect(
      canAutoHideChrome(toggleControlMenu(createInitialDisplayState())),
    ).toBe(false)
    expect(
      canAutoHideChrome(openSelectionInfo(createInitialDisplayState())),
    ).toBe(false)
    expect(canAutoHideChrome(createInitialDisplayState())).toBe(true)
  })

  it('hides and reveals chrome independently from immersive mode', () => {
    const hidden = requestChromeAutoHide(createInitialDisplayState())
    expect(isChromeSuppressed(hidden)).toBe(true)
    expect(revealChrome(hidden).chromeVisibility).toBe('visible')
    expect(
      closeSelectionInfo(openSelectionInfo(createInitialDisplayState())),
    ).toEqual(createInitialDisplayState())
  })

  it('enters immersive mode by clearing transient UI without persisting it', () => {
    const immersive = toggleImmersiveMode(
      toggleControlMenu(createInitialDisplayState()),
    )
    expect(immersive).toMatchObject({
      isImmersiveMode: true,
      isControlMenuOpen: false,
      activeControlMenuSection: null,
      isSelectionInfoOpen: false,
    })
    expect(isChromeSuppressed(immersive)).toBe(true)
    expect(toggleImmersiveMode(immersive).isImmersiveMode).toBe(false)
  })

  it('keeps display settings independent from menu state', () => {
    const enabled = toggleNightModeUi(
      toggleProjectorMode(createInitialDisplayState()),
    )
    expect(enabled).toMatchObject({
      isProjectorMode: true,
      isNightModeUi: true,
    })
  })
})
