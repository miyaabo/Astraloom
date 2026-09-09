/** Sections of the unified control menu introduced by Issue #15. */
export type ControlMenuSection = 'sky' | 'time' | 'search' | 'display'

export type ChromeVisibility = 'visible' | 'hidden'

export interface DisplayState {
  isControlMenuOpen: boolean
  /** At most one section can be expanded in the control menu. */
  activeControlMenuSection: ControlMenuSection | null
  isSelectionInfoOpen: boolean
  /** Temporary, non-persisted viewing state controlled by the standalone button. */
  isImmersiveMode: boolean
  chromeVisibility: ChromeVisibility
  isProjectorMode: boolean
  isNightModeUi: boolean
}

export function createInitialDisplayState(): DisplayState {
  return {
    isControlMenuOpen: false,
    activeControlMenuSection: null,
    isSelectionInfoOpen: false,
    isImmersiveMode: false,
    chromeVisibility: 'visible',
    isProjectorMode: false,
    isNightModeUi: false,
  }
}

export function openControlMenu(state: DisplayState): DisplayState {
  return {
    ...state,
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

export function openSelectionInfo(state: DisplayState): DisplayState {
  if (state.isSelectionInfoOpen && state.chromeVisibility === 'visible') {
    return state
  }
  return {
    ...state,
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

export function toggleImmersiveMode(state: DisplayState): DisplayState {
  const isImmersiveMode = !state.isImmersiveMode
  return {
    ...state,
    isImmersiveMode,
    isControlMenuOpen: false,
    activeControlMenuSection: null,
    isSelectionInfoOpen: false,
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

export function canAutoHideChrome(state: DisplayState): boolean {
  return (
    !state.isImmersiveMode &&
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
  return state.isImmersiveMode || state.chromeVisibility === 'hidden'
}
