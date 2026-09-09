export type OverlayPanel = 'date' | 'location' | 'search' | 'settings'

/** Sections of the unified control menu introduced by Issue #15. */
export type ControlMenuSection = 'sky' | 'time' | 'search' | 'display'

export type DisplayMode = 'standard' | 'immersive'

export type ChromeVisibility = 'visible' | 'hidden'

export interface DisplayState {
  /**
   * Temporary compatibility state for the pre-#15 individual overlays.
   * Task 7 removes this once every entry point has moved into the control menu.
   */
  activePanel: OverlayPanel | null
  isControlMenuOpen: boolean
  /** At most one section can be expanded in the control menu. */
  activeControlMenuSection: ControlMenuSection | null
  isSelectionInfoOpen: boolean
  mode: DisplayMode
  chromeVisibility: ChromeVisibility
  isProjectorMode: boolean
  isNightModeUi: boolean
}

export function createInitialDisplayState(): DisplayState {
  return {
    activePanel: null,
    isControlMenuOpen: false,
    activeControlMenuSection: null,
    isSelectionInfoOpen: false,
    mode: 'standard',
    chromeVisibility: 'visible',
    isProjectorMode: false,
    isNightModeUi: false,
  }
}

export function openControlMenu(state: DisplayState): DisplayState {
  return {
    ...state,
    activePanel: null,
    isControlMenuOpen: true,
    chromeVisibility: 'visible',
  }
}

export function closeControlMenu(state: DisplayState): DisplayState {
  if (!state.isControlMenuOpen && state.activeControlMenuSection === null) {
    return state
  }
  return {
    ...state,
    isControlMenuOpen: false,
    activeControlMenuSection: null,
  }
}

export function toggleControlMenu(state: DisplayState): DisplayState {
  return state.isControlMenuOpen
    ? closeControlMenu(state)
    : openControlMenu(state)
}

/** Opens one section, replacing any section that was already expanded. */
export function toggleControlMenuSection(
  state: DisplayState,
  section: ControlMenuSection,
): DisplayState {
  const opened = openControlMenu(state)
  return {
    ...opened,
    activeControlMenuSection:
      state.isControlMenuOpen && state.activeControlMenuSection === section
        ? null
        : section,
  }
}

export function toggleOverlayPanel(
  state: DisplayState,
  panel: OverlayPanel,
): DisplayState {
  return {
    ...state,
    activePanel: state.activePanel === panel ? null : panel,
    isControlMenuOpen: false,
    activeControlMenuSection: null,
    chromeVisibility: 'visible',
  }
}

export function closeOverlayPanel(state: DisplayState): DisplayState {
  if (state.activePanel === null) return state
  return {
    ...state,
    activePanel: null,
  }
}

export function openSelectionInfo(state: DisplayState): DisplayState {
  if (state.isSelectionInfoOpen && state.chromeVisibility === 'visible') {
    return state
  }
  return {
    ...state,
    isControlMenuOpen: false,
    activeControlMenuSection: null,
    isSelectionInfoOpen: true,
    chromeVisibility: 'visible',
  }
}

export function closeSelectionInfo(state: DisplayState): DisplayState {
  if (!state.isSelectionInfoOpen) return state
  return {
    ...state,
    isSelectionInfoOpen: false,
  }
}

export function enterImmersiveMode(state: DisplayState): DisplayState {
  return {
    ...state,
    mode: 'immersive',
    activePanel: null,
    isControlMenuOpen: false,
    activeControlMenuSection: null,
    isSelectionInfoOpen: false,
    chromeVisibility: 'visible',
  }
}

export function exitImmersiveMode(state: DisplayState): DisplayState {
  if (state.mode === 'standard') return state
  return {
    ...state,
    mode: 'standard',
    chromeVisibility: 'visible',
  }
}

export function toggleProjectorMode(state: DisplayState): DisplayState {
  return {
    ...state,
    isProjectorMode: !state.isProjectorMode,
    chromeVisibility: 'visible',
  }
}

export function toggleNightModeUi(state: DisplayState): DisplayState {
  return {
    ...state,
    isNightModeUi: !state.isNightModeUi,
    chromeVisibility: 'visible',
  }
}

export function toggleImmersiveMode(state: DisplayState): DisplayState {
  return state.mode === 'immersive'
    ? exitImmersiveMode(state)
    : enterImmersiveMode(state)
}

export function canAutoHideChrome(state: DisplayState): boolean {
  return (
    state.activePanel === null &&
    !state.isControlMenuOpen &&
    state.activeControlMenuSection === null &&
    !state.isSelectionInfoOpen
  )
}

export function requestChromeAutoHide(state: DisplayState): DisplayState {
  if (!canAutoHideChrome(state) || state.chromeVisibility === 'hidden') {
    return state
  }
  return {
    ...state,
    chromeVisibility: 'hidden',
  }
}

export function revealChrome(state: DisplayState): DisplayState {
  if (state.chromeVisibility === 'visible') return state
  return {
    ...state,
    chromeVisibility: 'visible',
  }
}

export function isChromeSuppressed(state: DisplayState): boolean {
  return state.mode === 'immersive' || state.chromeVisibility === 'hidden'
}
