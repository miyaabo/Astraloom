import type { StarfieldVisualPresetKey } from './stars/starfieldConfig'

export type OverlayPanel = 'date' | 'location' | 'search'

export type DisplayMode = 'standard' | 'immersive'

export type ChromeVisibility = 'visible' | 'hidden'

export interface DisplayState {
  activePanel: OverlayPanel | null
  isSelectionInfoOpen: boolean
  mode: DisplayMode
  chromeVisibility: ChromeVisibility
  visualPreset: StarfieldVisualPresetKey
  isProjectorMode: boolean
}

export function createInitialDisplayState(): DisplayState {
  return {
    activePanel: null,
    isSelectionInfoOpen: false,
    mode: 'standard',
    chromeVisibility: 'visible',
    visualPreset: 'planetarium-like',
    isProjectorMode: false,
  }
}

export function toggleOverlayPanel(
  state: DisplayState,
  panel: OverlayPanel,
): DisplayState {
  return {
    ...state,
    activePanel: state.activePanel === panel ? null : panel,
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

export function setVisualPreset(
  state: DisplayState,
  visualPreset: StarfieldVisualPresetKey,
): DisplayState {
  if (state.visualPreset === visualPreset) return state
  return {
    ...state,
    visualPreset,
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

export function toggleImmersiveMode(state: DisplayState): DisplayState {
  return state.mode === 'immersive'
    ? exitImmersiveMode(state)
    : enterImmersiveMode(state)
}

export function canAutoHideChrome(state: DisplayState): boolean {
  return state.activePanel === null && !state.isSelectionInfoOpen
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
