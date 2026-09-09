import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildSelectionOptions } from './search/selectionCatalog'
import { Starfield } from './Starfield'
import { loadSceneFromStorage } from './save/sceneStorage'

// jsdom has no WebGL context, so the real Three.js renderer can't run here;
// browser rendering is covered by the Task 8 Playwright smoke test instead.
const updateStars = vi.fn()
const updateCelestialBodies = vi.fn()
const highlightCelestialBody = vi.fn()
const lookAt = vi.fn()
const hideConstellationLines = vi.fn()
const setLabelTargets = vi.fn()
const showConstellationLines = vi.fn()
const showConstellationArt = vi.fn()
const hideConstellationArt = vi.fn()
const hitTestStar = vi.fn(() => null)
const applyProjectorMode = vi.fn()
const restoreViewState = vi.fn()
vi.mock('./render/StarfieldRenderer', () => ({
  StarfieldRenderer: class {
    resize = vi.fn()
    render = vi.fn()
    start = vi.fn()
    dispose = vi.fn()
    updateStars = updateStars
    updateCelestialBodies = updateCelestialBodies
    highlightCelestialBody = highlightCelestialBody
    updateMilkyWay = vi.fn()
    lookAt = lookAt
    hideConstellationLines = hideConstellationLines
    setLabelTargets = setLabelTargets
    showConstellationLines = showConstellationLines
    showConstellationArt = showConstellationArt
    hideConstellationArt = hideConstellationArt
    hitTestStar = hitTestStar
    applyProjectorMode = applyProjectorMode
    restoreViewState = restoreViewState
    getViewStateSnapshot = vi.fn(() => ({
      azimuthDegrees: 180,
      altitudeDegrees: 22,
      fovDegrees: 70,
    }))
  },
}))

// jsdom also has no ResizeObserver; Starfield.tsx uses it to track canvas size.
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  },
)

// jsdom doesn't implement scrollTo either; Starfield.tsx calls it on mount to
// nudge mobile browsers into collapsing their address-bar chrome.
window.scrollTo = vi.fn()

function openSkySelection(): void {
  fireEvent.click(screen.getByLabelText('操作メニューを開く'))
  fireEvent.click(screen.getByRole('button', { name: '空を選ぶ' }))
}

function openTimeControls(): void {
  fireEvent.click(screen.getByLabelText('操作メニューを開く'))
  fireEvent.click(screen.getByRole('button', { name: '時間を動かす' }))
}

function openSearch(): void {
  fireEvent.click(screen.getByLabelText('操作メニューを開く'))
  fireEvent.click(screen.getByRole('button', { name: '空を探す' }))
}

function openDisplaySettings(): void {
  fireEvent.click(screen.getByLabelText('操作メニューを開く'))
  fireEvent.click(screen.getByRole('button', { name: '表示・投影' }))
}

describe('Starfield', () => {
  beforeEach(() => {
    window.localStorage.clear()
    lookAt.mockClear()
    updateCelestialBodies.mockClear()
    highlightCelestialBody.mockClear()
    hideConstellationLines.mockClear()
    setLabelTargets.mockClear()
    showConstellationLines.mockClear()
    showConstellationArt.mockClear()
    hideConstellationArt.mockClear()
    hitTestStar.mockReset()
    hitTestStar.mockReturnValue(null)
    applyProjectorMode.mockClear()
    restoreViewState.mockClear()
  })

  it('shows date and location controls only in the sky selection section', () => {
    render(<Starfield />)
    expect(screen.queryByLabelText('日時を変更')).toBeNull()
    expect(screen.queryByLabelText('日時')).toBeNull()
    expect(screen.queryByLabelText('場所')).toBeNull()

    openSkySelection()
    expect(screen.getByLabelText(/^日時 \(/)).toBeTruthy()
    expect(screen.getByLabelText('場所')).toBeTruthy()
  })

  it('opens the unified control menu and keeps one section expanded at a time', () => {
    render(<Starfield />)

    fireEvent.click(screen.getByLabelText('操作メニューを開く'))
    expect(screen.getByLabelText('操作メニュー')).toBeTruthy()
    expect(screen.getByText('現在の空')).toBeTruthy()

    const time = screen.getByRole('button', { name: '時間を動かす' })
    const display = screen.getByRole('button', { name: '表示・投影' })
    fireEvent.click(time)
    expect(time.getAttribute('aria-expanded')).toBe('true')

    fireEvent.click(display)
    expect(time.getAttribute('aria-expanded')).toBe('false')
    expect(display.getAttribute('aria-expanded')).toBe('true')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByLabelText('操作メニュー')).toBeNull()
  })

  it('lets the user jump to a celestial body, constellation, or star from the dropdown', () => {
    render(<Starfield />)
    const select = screen.getByLabelText('天体・星・星座を選択')

    fireEvent.change(select, { target: { value: 'celestial-moon' } })
    expect(highlightCelestialBody).toHaveBeenLastCalledWith('moon')
    expect(screen.getByText('Moon (月)', { selector: 'strong' })).toBeTruthy()

    fireEvent.change(select, { target: { value: 'constellation-Aquila' } })
    expect(highlightCelestialBody).toHaveBeenLastCalledWith(null)
    expect(
      screen.getByText('Aquila (わし座)', { selector: 'strong' }),
    ).toBeTruthy()

    const altairOption = buildSelectionOptions().find(
      (option) =>
        option.type === 'star' && option.label === 'Altair (アルタイル)',
    )
    expect(altairOption?.type).toBe('star')
    fireEvent.change(select, { target: { value: altairOption!.value } })
    expect(screen.getByText(/Altair/, { selector: 'strong' })).toBeTruthy()
    expect(highlightCelestialBody).toHaveBeenLastCalledWith(null)
  })

  it('relocates the observer when picking a constellation invisible from Tokyo right now', () => {
    render(<Starfield />)

    // 2026-09-03 21:00 JST: Leo sits well below Tokyo's horizon (~-35°
    // altitude — opposite side of the sky from the sun this time of year).
    openSkySelection()
    fireEvent.change(screen.getByLabelText(/^日時 \(/), {
      target: { value: '2026-09-03T21:00' },
    })
    updateStars.mockClear()
    showConstellationLines.mockClear()
    lookAt.mockClear()

    fireEvent.change(screen.getByLabelText('天体・星・星座を選択'), {
      target: { value: 'constellation-Leo' },
    })

    // A relocation redraws the whole scene at the new location, not just
    // the constellation itself.
    expect(updateStars).toHaveBeenCalled()
    const relocatedTo = updateStars.mock.calls.at(-1)?.[0]
    expect(relocatedTo.latitudeDegrees).not.toBeCloseTo(35.6762, 1) // no longer Tokyo

    // ...and Leo is now actually shown, not silently dropped for having
    // nothing above the horizon.
    const shownSegments = showConstellationLines.mock.calls.at(-1)?.[0]
    expect(shownSegments.length).toBeGreaterThan(0)
    const lookedAtAltitude = lookAt.mock.calls.at(-1)?.[1]
    expect(lookedAtAltitude).toBeGreaterThan(80) // relocated to right under it
  })

  it('does not relocate when the picked constellation is already visible', () => {
    render(<Starfield />)

    // Same instant as above, but Aquila is well up over Tokyo then (part of
    // the Summer Triangle).
    openSkySelection()
    fireEvent.change(screen.getByLabelText(/^日時 \(/), {
      target: { value: '2026-09-03T21:00' },
    })
    updateStars.mockClear()

    fireEvent.change(screen.getByLabelText('天体・星・星座を選択'), {
      target: { value: 'constellation-Aquila' },
    })

    expect(updateStars).not.toHaveBeenCalled()
  })

  it('recomputes star placement when the date/time is changed in sky selection', () => {
    render(<Starfield />)
    updateStars.mockClear()

    openSkySelection()
    // Regex, not exact match: the label also carries the observer location's
    // time zone (e.g. "日時 (Asia/Tokyo)") since Task 7.
    fireEvent.change(screen.getByLabelText(/^日時 \(/), {
      target: { value: '2026-01-01T00:00' },
    })

    expect(updateStars).toHaveBeenCalledTimes(1)
    expect(updateCelestialBodies).toHaveBeenCalledTimes(1)
    expect(screen.getByLabelText(/^日時 \(/)).toBeTruthy()
    expect(screen.getByLabelText('操作メニュー')).toBeTruthy()
  })

  it('recomputes star placement when the location is changed in sky selection', () => {
    render(<Starfield />)
    updateStars.mockClear()

    openSkySelection()
    fireEvent.change(screen.getByLabelText('場所'), {
      target: { value: 'ロンドン' },
    })

    expect(updateStars).toHaveBeenCalledTimes(1)
    expect(updateCelestialBodies).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/ロンドン ·/)).toBeTruthy()
    expect(screen.getByLabelText('日時 (Europe/London)')).toBeTruthy()
    expect(screen.getByLabelText('操作メニュー')).toBeTruthy()
  })

  it('relocates and moves the view to a searched star', () => {
    render(<Starfield />)
    openSearch()
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Sirius' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sirius (シリウス)' }))

    expect(lookAt).toHaveBeenLastCalledWith(0, 90)
    expect(screen.getByLabelText('操作メニュー')).toBeTruthy()
    expect(
      screen.getByRole('button', { name: '空を探す' }).getAttribute(
        'aria-expanded',
      ),
    ).toBe('true')
  })

  it('relocates and moves the view to a searched celestial body', () => {
    render(<Starfield />)

    openSearch()
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Sirius' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sirius (シリウス)' }))
    expect(screen.getByLabelText('選択情報を閉じる')).toBeTruthy()

    openSearch()
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Moon' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Moon (月)' }))

    expect(highlightCelestialBody).toHaveBeenLastCalledWith('moon')
    expect(lookAt.mock.calls.at(-1)?.[1]).toBeGreaterThan(80)
    expect(screen.getByLabelText('選択情報を閉じる')).toBeTruthy()
    expect(screen.getByText('種別: 月')).toBeTruthy()
    expect(screen.getByText(/見え方:/)).toBeTruthy()
  })

  it('keeps the constellation selection after closing the description, until explicitly cleared', () => {
    render(<Starfield />)

    openSearch()
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Aquila' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aquila (わし座)' }))

    expect(screen.getByLabelText('選択情報を閉じる')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('選択情報を閉じる'))

    expect(screen.queryByLabelText('選択情報を閉じる')).toBeNull()
    expect(screen.getByLabelText('選択情報を開く')).toBeTruthy()

    showConstellationLines.mockClear()
    fireEvent.click(screen.getByLabelText('選択情報を開く'))
    expect(screen.getByLabelText('選択情報を閉じる')).toBeTruthy()
    expect(showConstellationLines).not.toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText('選択を解除する'))
    expect(hideConstellationLines).toHaveBeenCalled()
    expect(setLabelTargets).toHaveBeenCalledWith([])
  })

  it('toggles immersive mode and hides the main overlays until restored', () => {
    render(<Starfield />)

    expect(screen.getByLabelText('鑑賞モードに切替')).toBeTruthy()
    expect(screen.getByLabelText('操作メニューを開く')).toBeTruthy()
    expect(screen.queryByLabelText('再生を開始')).toBeNull()

    fireEvent.click(screen.getByLabelText('鑑賞モードに切替'))

    expect(screen.getByLabelText('通常表示に戻る')).toBeTruthy()
    expect(screen.queryByLabelText('操作メニューを開く')).toBeNull()

    fireEvent.click(screen.getByLabelText('通常表示に戻る'))

    expect(screen.getByLabelText('鑑賞モードに切替')).toBeTruthy()
    expect(screen.getByLabelText('操作メニューを開く')).toBeTruthy()
    expect(screen.queryByLabelText('再生を開始')).toBeNull()
  })

  it('keeps the active selection when entering immersive mode, while hiding its UI', () => {
    render(<Starfield />)

    openSearch()
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Aquila' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Aquila (わし座)' }))

    showConstellationLines.mockClear()
    hideConstellationLines.mockClear()
    setLabelTargets.mockClear()

    fireEvent.click(screen.getByLabelText('鑑賞モードに切替'))

    expect(hideConstellationLines).not.toHaveBeenCalled()
    expect(setLabelTargets).not.toHaveBeenCalledWith([])
    expect(screen.queryByLabelText('選択情報を閉じる')).toBeNull()

    fireEvent.click(screen.getByLabelText('通常表示に戻る'))
    expect(screen.getByLabelText('選択情報を開く')).toBeTruthy()
    expect(showConstellationLines).not.toHaveBeenCalled()
  })

  it('auto-hides the chrome after five seconds of inactivity in standard mode', () => {
    vi.useFakeTimers()
    render(<Starfield />)

    expect(screen.getByLabelText('操作メニューを開く')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByLabelText('操作メニューを開く')).toBeNull()
    vi.useRealTimers()
  })

  it('shows display settings only in the display section', () => {
    render(<Starfield />)

    expect(screen.queryByLabelText('プロジェクター補正を有効化')).toBeNull()
    openDisplaySettings()

    expect(screen.getByLabelText('プロジェクター補正を有効化')).toBeTruthy()
    expect(screen.getByLabelText('夜間モードを有効化')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '表示・投影' }))

    expect(screen.queryByLabelText('プロジェクター補正を有効化')).toBeNull()
    expect(screen.getByLabelText('操作メニュー')).toBeTruthy()
  })

  it('closes the menu through its dedicated close button', () => {
    render(<Starfield />)
    fireEvent.click(screen.getByLabelText('操作メニューを開く'))

    fireEvent.click(screen.getByLabelText('パネルを閉じる'))

    expect(screen.queryByLabelText('操作メニュー')).toBeNull()
  })

  it('closes display settings when another menu section is opened', () => {
    render(<Starfield />)

    openDisplaySettings()
    expect(screen.getByLabelText('プロジェクター補正を有効化')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: '空を探す' }))

    expect(screen.queryByLabelText('プロジェクター補正を有効化')).toBeNull()
  })

  it('toggles projector adjustments through the display section', () => {
    render(<Starfield />)
    openDisplaySettings()

    expect(screen.getByLabelText('プロジェクター補正を有効化')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('プロジェクター補正を有効化'))

    expect(applyProjectorMode).toHaveBeenLastCalledWith(true)
    expect(screen.getByLabelText('プロジェクター補正を解除')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('プロジェクター補正を解除'))
    expect(applyProjectorMode).toHaveBeenLastCalledWith(false)
  })

  it('toggles night mode UI through the display section', () => {
    render(<Starfield />)
    openDisplaySettings()
    applyProjectorMode.mockClear()

    expect(screen.getByLabelText('夜間モードを有効化')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('夜間モードを有効化'))

    expect(screen.getByLabelText('夜間モードを解除')).toBeTruthy()
    expect(applyProjectorMode).not.toHaveBeenCalled()

    fireEvent.click(screen.getByLabelText('夜間モードを解除'))
    expect(screen.getByLabelText('夜間モードを有効化')).toBeTruthy()
  })

  it('does not show a fullscreen control when the Fullscreen API is unsupported', () => {
    render(<Starfield />)
    openDisplaySettings()

    expect(screen.queryByLabelText('フルスクリーン表示にする')).toBeNull()
  })

  it('toggles fullscreen through the display section when the Fullscreen API is available', () => {
    const requestFullscreen = vi.fn(() => Promise.resolve())
    const exitFullscreen = vi.fn(() => Promise.resolve())
    document.documentElement.requestFullscreen = requestFullscreen
    document.exitFullscreen = exitFullscreen

    try {
      render(<Starfield />)
      openDisplaySettings()

      expect(screen.getByLabelText('フルスクリーン表示にする')).toBeTruthy()
      fireEvent.click(screen.getByLabelText('フルスクリーン表示にする'))
      expect(requestFullscreen).toHaveBeenCalledTimes(1)

      Object.defineProperty(document, 'fullscreenElement', {
        value: document.documentElement,
        configurable: true,
      })
      fireEvent(document, new Event('fullscreenchange'))

      expect(screen.getByLabelText('フルスクリーン表示を終了')).toBeTruthy()
      fireEvent.click(screen.getByLabelText('フルスクリーン表示を終了'))
      expect(exitFullscreen).toHaveBeenCalledTimes(1)
    } finally {
      Object.defineProperty(document, 'fullscreenElement', {
        value: null,
        configurable: true,
      })
      delete (document.documentElement as { requestFullscreen?: unknown })
        .requestFullscreen
      delete (document as { exitFullscreen?: unknown }).exitFullscreen
    }
  })

  it('saves the current scene into local storage from the display section', () => {
    render(<Starfield />)

    openDisplaySettings()
    fireEvent.click(screen.getByLabelText('プロジェクター補正を有効化'))
    fireEvent.click(screen.getByLabelText('現在のシーンを保存'))

    expect(screen.getByText('保存しました')).toBeTruthy()
    expect(loadSceneFromStorage(window.localStorage)?.scene).toMatchObject({
      location: {
        label: '東京',
        timeZoneId: 'Asia/Tokyo',
      },
      playback: {
        speedMagnitude: 50,
        direction: 1,
      },
      view: {
        azimuthDegrees: 180,
        altitudeDegrees: 22,
        fovDegrees: 70,
      },
      display: {
        mode: 'standard',
        isProjectorMode: true,
      },
    })
  })

  it('does not auto-hide the chrome after inactivity in immersive mode', () => {
    vi.useFakeTimers()
    render(<Starfield />)
    fireEvent.click(screen.getByLabelText('鑑賞モードに切替'))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByLabelText('通常表示に戻る')).toBeTruthy()
    vi.useRealTimers()
  })

  it('does not auto-hide standard chrome while an overlay panel is open', () => {
    vi.useFakeTimers()
    render(<Starfield />)
    openSearch()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByLabelText('星座名・星名・主要天体で検索')).toBeTruthy()
    vi.useRealTimers()
  })

  it('keeps standard chrome visible after closing selection info', () => {
    vi.useFakeTimers()
    render(<Starfield />)

    openSearch()
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Sirius' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sirius (シリウス)' }))

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByLabelText('選択情報を閉じる')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('選択情報を閉じる'))
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(screen.getByLabelText('操作メニューを開く')).toBeTruthy()
    vi.useRealTimers()
  })

  it('updates celestial body info when the date changes while it stays selected', () => {
    render(<Starfield />)

    openSearch()
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Moon' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Moon (月)' }))

    expect(
      screen.getByText(/ほぼ満ちている|よく見えている|半分前後|細めに見える/),
    ).toBeTruthy()

    openSkySelection()
    fireEvent.change(screen.getByLabelText(/^日時 \(/), {
      target: { value: '2026-01-01T00:00' },
    })

    expect(updateCelestialBodies).toHaveBeenCalled()
    expect(screen.getByText('Moon (月)', { selector: 'strong' })).toBeTruthy()
    expect(screen.getByText('種別: 月')).toBeTruthy()
  })

  it('restores the last saved scene when the app opens again', () => {
    window.localStorage.setItem(
      'veluna.savedScene.v1',
      JSON.stringify({
        version: 1,
        savedAtIso: '2026-08-31T13:00:00.000Z',
        scene: {
          dateIso: '2026-08-31T12:34:56.000Z',
          location: {
            latitudeDegrees: 40.7128,
            longitudeDegrees: -74.006,
            timeZoneId: 'America/New_York',
            label: 'ニューヨーク',
          },
          playback: {
            speedMagnitude: 300,
            direction: -1,
          },
          view: {
            azimuthDegrees: 210,
            altitudeDegrees: 12,
            fovDegrees: 55,
          },
          display: {
            mode: 'immersive',
            isProjectorMode: true,
          },
        },
      }),
    )

    render(<Starfield />)

    expect(restoreViewState).toHaveBeenCalledWith(210, 12, 55)
    expect(applyProjectorMode).toHaveBeenCalledWith(true)
    expect(screen.getByLabelText('通常表示に戻る')).toBeTruthy()
    expect(screen.queryByLabelText('操作メニューを開く')).toBeNull()
  })

  it('preserves restored location metadata when saving again before changing location', () => {
    window.localStorage.setItem(
      'veluna.savedScene.v1',
      JSON.stringify({
        version: 1,
        savedAtIso: '2026-08-31T13:00:00.000Z',
        scene: {
          dateIso: '2026-08-31T12:34:56.000Z',
          location: {
            latitudeDegrees: 10,
            longitudeDegrees: 20,
            timeZoneId: 'Etc/UTC',
            label: 'カスタム地点',
          },
          playback: {
            speedMagnitude: 300,
            direction: -1,
          },
          view: {
            azimuthDegrees: 210,
            altitudeDegrees: 12,
            fovDegrees: 55,
          },
          display: {
            mode: 'standard',
            isProjectorMode: false,
          },
        },
      }),
    )

    render(<Starfield />)
    openDisplaySettings()
    fireEvent.click(screen.getByLabelText('現在のシーンを保存'))

    expect(
      loadSceneFromStorage(window.localStorage)?.scene.location,
    ).toMatchObject({
      latitudeDegrees: 10,
      longitudeDegrees: 20,
      timeZoneId: 'Etc/UTC',
      label: 'カスタム地点',
    })
  })

  describe('playback (Task 4)', () => {
    // jsdom has no real rAF loop; stub it so the playback clock's frames can
    // be advanced deterministically instead of relying on real timers.
    let queued: Map<number, FrameRequestCallback>
    let nextId: number
    // Saved/restored by hand (rather than vi.stubGlobal + unstubAllGlobals)
    // so we don't also tear down the file-level ResizeObserver stub above.
    const originalRaf = globalThis.requestAnimationFrame
    const originalCaf = globalThis.cancelAnimationFrame

    function flushFrame(nowMs: number): void {
      const callbacks = [...queued.values()]
      queued.clear()
      callbacks.forEach((callback) => callback(nowMs))
    }

    beforeEach(() => {
      queued = new Map()
      nextId = 0
      globalThis.requestAnimationFrame = (callback: FrameRequestCallback) => {
        const id = ++nextId
        queued.set(id, callback)
        return id
      }
      globalThis.cancelAnimationFrame = (id: number) => {
        queued.delete(id)
      }
    })

    afterEach(() => {
      globalThis.requestAnimationFrame = originalRaf
      globalThis.cancelAnimationFrame = originalCaf
    })

    it('does not advance the date until playback starts', () => {
      render(<Starfield />)
      expect(queued.size).toBe(0)
    })

    it('recomputes star placement on each frame while playing', () => {
      render(<Starfield />)
      openTimeControls()
      fireEvent.click(screen.getByLabelText('再生を開始'))
      updateStars.mockClear()

      flushFrame(1000)
      flushFrame(1100)
      expect(updateStars).toHaveBeenCalledTimes(1)

      flushFrame(1200)
      expect(updateStars).toHaveBeenCalledTimes(2)
    })

    it('stops advancing once paused', () => {
      render(<Starfield />)
      openTimeControls()
      fireEvent.click(screen.getByLabelText('再生を開始'))
      flushFrame(1000)
      fireEvent.click(screen.getByLabelText('再生を停止'))

      expect(queued.size).toBe(0)
    })

    it('toggles between forward and reverse playback direction', () => {
      render(<Starfield />)
      openTimeControls()
      expect(screen.getByLabelText('巻き戻し再生に切替')).toBeTruthy()

      fireEvent.click(screen.getByLabelText('巻き戻し再生に切替'))
      expect(screen.getByLabelText('順方向再生に切替')).toBeTruthy()
      expect(screen.getByLabelText('操作メニュー')).toBeTruthy()
    })

    it('updates the playback speed and returns to the current time in the open section', () => {
      render(<Starfield />)
      updateStars.mockClear()
      openTimeControls()

      fireEvent.change(screen.getByLabelText('再生速度'), {
        target: { value: '100' },
      })
      expect(
        (screen.getByLabelText('再生速度') as HTMLSelectElement).value,
      ).toBe('100')

      fireEvent.click(screen.getByRole('button', { name: '現在時刻へ戻す' }))
      expect(updateStars).toHaveBeenCalledTimes(1)
      expect(screen.getByLabelText('操作メニュー')).toBeTruthy()
    })
  })
})
