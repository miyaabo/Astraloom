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
const hitTestStar = vi.fn(() => null)
const applyVisualPreset = vi.fn()
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
    hitTestStar = hitTestStar
    applyVisualPreset = applyVisualPreset
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

describe('Starfield', () => {
  beforeEach(() => {
    window.localStorage.clear()
    lookAt.mockClear()
    updateCelestialBodies.mockClear()
    highlightCelestialBody.mockClear()
    hideConstellationLines.mockClear()
    setLabelTargets.mockClear()
    showConstellationLines.mockClear()
    hitTestStar.mockReset()
    hitTestStar.mockReturnValue(null)
    applyVisualPreset.mockClear()
    applyProjectorMode.mockClear()
    restoreViewState.mockClear()
  })

  it('keeps the date/time overlay collapsed to a toggle button by default', () => {
    render(<Starfield />)
    expect(screen.getByLabelText('日時を変更')).toBeTruthy()
    expect(screen.queryByLabelText('日時')).toBeNull()
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
      (option) => option.type === 'star' && option.label === 'Altair (アルタイル)',
    )
    expect(altairOption?.type).toBe('star')
    fireEvent.change(select, { target: { value: altairOption!.value } })
    expect(screen.getByText(/Altair/, { selector: 'strong' })).toBeTruthy()
    expect(highlightCelestialBody).toHaveBeenLastCalledWith(null)
  })

  it('recomputes star placement when the date/time is changed via the overlay', () => {
    render(<Starfield />)
    updateStars.mockClear()

    fireEvent.click(screen.getByLabelText('日時を変更'))
    // Regex, not exact match: the label also carries the observer location's
    // time zone (e.g. "日時 (Asia/Tokyo)") since Task 7.
    fireEvent.change(screen.getByLabelText(/^日時 \(/), {
      target: { value: '2026-01-01T00:00' },
    })

    expect(updateStars).toHaveBeenCalledTimes(1)
    expect(updateCelestialBodies).toHaveBeenCalledTimes(1)
    expect(screen.queryByLabelText(/^日時 \(/)).toBeNull()
  })

  it('keeps the location overlay collapsed to a toggle button by default', () => {
    render(<Starfield />)
    expect(screen.getByLabelText('場所を変更')).toBeTruthy()
    expect(screen.queryByLabelText('場所')).toBeNull()
  })

  it('recomputes star placement when the location is changed via the overlay', () => {
    render(<Starfield />)
    updateStars.mockClear()

    fireEvent.click(screen.getByLabelText('場所を変更'))
    fireEvent.change(screen.getByLabelText('場所'), {
      target: { value: 'ロンドン' },
    })

    expect(updateStars).toHaveBeenCalledTimes(1)
    expect(updateCelestialBodies).toHaveBeenCalledTimes(1)
  })

  it('keeps search navigation above the horizon when a matched star is currently below it', () => {
    render(<Starfield />)
    fireEvent.click(screen.getByLabelText('星・星座を検索'))
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Sirius' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sirius (シリウス)' }))

    expect(lookAt).toHaveBeenCalled()
    expect(lookAt.mock.calls.at(-1)?.[1]).toBeGreaterThanOrEqual(2)
  })

  it('moves the camera to a searched celestial body and clears prior star selection UI', () => {
    render(<Starfield />)

    fireEvent.click(screen.getByLabelText('星・星座を検索'))
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Sirius' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Sirius (シリウス)' }))
    expect(screen.getByLabelText('選択情報を閉じる')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('星・星座を検索'))
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Moon' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Moon (月)' }))

    expect(lookAt).toHaveBeenCalled()
    expect(highlightCelestialBody).toHaveBeenLastCalledWith('moon')
    expect(lookAt.mock.calls.at(-1)?.[1]).toBeGreaterThanOrEqual(2)
    expect(screen.getByLabelText('選択情報を閉じる')).toBeTruthy()
    expect(screen.getByText('種別: 月')).toBeTruthy()
    expect(screen.getByText(/見え方:/)).toBeTruthy()
  })

  it('keeps the constellation selection after closing the description, until explicitly cleared', () => {
    render(<Starfield />)

    fireEvent.click(screen.getByLabelText('星・星座を検索'))
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
    expect(screen.getByLabelText('星・星座を検索')).toBeTruthy()
    expect(screen.getByLabelText('再生を開始')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('鑑賞モードに切替'))

    expect(screen.getByLabelText('通常表示に戻る')).toBeTruthy()
    expect(screen.queryByLabelText('星・星座を検索')).toBeNull()
    expect(screen.queryByLabelText('再生を開始')).toBeNull()

    fireEvent.click(screen.getByLabelText('通常表示に戻る'))

    expect(screen.getByLabelText('鑑賞モードに切替')).toBeTruthy()
    expect(screen.getByLabelText('星・星座を検索')).toBeTruthy()
    expect(screen.getByLabelText('再生を開始')).toBeTruthy()
  })

  it('keeps the active selection when entering immersive mode, while hiding its UI', () => {
    render(<Starfield />)

    fireEvent.click(screen.getByLabelText('星・星座を検索'))
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

  it('does not auto-hide the chrome after inactivity in standard mode', () => {
    vi.useFakeTimers()
    render(<Starfield />)

    expect(screen.getByLabelText('星・星座を検索')).toBeTruthy()
    expect(screen.getByLabelText('鑑賞モードに切替')).toBeTruthy()
    expect(screen.getByLabelText('表現プリセット')).toBeTruthy()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByLabelText('星・星座を検索')).toBeTruthy()
    expect(screen.getByLabelText('鑑賞モードに切替')).toBeTruthy()
    expect(screen.getByLabelText('表現プリセット')).toBeTruthy()
    vi.useRealTimers()
  })

  it('switches the visual preset through the overlay selector', () => {
    render(<Starfield />)
    const presetSelect = screen.getByLabelText('表現プリセット') as HTMLSelectElement

    expect(presetSelect.value).toBe('planetarium-like')

    fireEvent.change(presetSelect, {
      target: { value: 'gentle-contrast' },
    })

    expect(presetSelect.value).toBe('gentle-contrast')
    expect(applyVisualPreset).toHaveBeenLastCalledWith('gentle-contrast')
  })

  it('toggles projector adjustments independently from the visual preset', () => {
    render(<Starfield />)

    expect(screen.getByLabelText('プロジェクター補正を有効化')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('プロジェクター補正を有効化'))

    expect(applyProjectorMode).toHaveBeenLastCalledWith(true)
    expect(screen.getByLabelText('プロジェクター補正を解除')).toBeTruthy()
    expect(screen.getByLabelText('表現プリセット')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('プロジェクター補正を解除'))
    expect(applyProjectorMode).toHaveBeenLastCalledWith(false)
  })

  it('saves the current scene into local storage from the save button', () => {
    render(<Starfield />)

    fireEvent.change(screen.getByLabelText('表現プリセット'), {
      target: { value: 'gentle-contrast' },
    })
    fireEvent.click(screen.getByLabelText('プロジェクター補正を有効化'))
    fireEvent.click(screen.getByLabelText('現在のシーンを保存'))

    expect(screen.getByText('保存済み')).toBeTruthy()
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
        visualPreset: 'gentle-contrast',
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
    fireEvent.click(screen.getByLabelText('星・星座を検索'))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByLabelText('星座名・星名・主要天体で検索')).toBeTruthy()
    vi.useRealTimers()
  })

  it('keeps standard chrome visible after closing selection info', () => {
    vi.useFakeTimers()
    render(<Starfield />)

    fireEvent.click(screen.getByLabelText('星・星座を検索'))
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
    expect(screen.getByLabelText('星・星座を検索')).toBeTruthy()
    vi.useRealTimers()
  })

  it('updates celestial body info when the date changes while it stays selected', () => {
    render(<Starfield />)

    fireEvent.click(screen.getByLabelText('星・星座を検索'))
    fireEvent.change(screen.getByLabelText('星座名・星名・主要天体で検索'), {
      target: { value: 'Moon' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Moon (月)' }))

    expect(screen.getByText(/ほぼ満ちている|よく見えている|半分前後|細めに見える/)).toBeTruthy()

    fireEvent.click(screen.getByLabelText('日時を変更'))
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
            visualPreset: 'gentle-contrast',
            isProjectorMode: true,
          },
        },
      }),
    )

    render(<Starfield />)

    expect(restoreViewState).toHaveBeenCalledWith(210, 12, 55)
    expect(applyVisualPreset).toHaveBeenCalledWith('gentle-contrast')
    expect(applyProjectorMode).toHaveBeenCalledWith(true)
    expect(screen.getByLabelText('通常表示に戻る')).toBeTruthy()
    expect(screen.queryByLabelText('星・星座を検索')).toBeNull()
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
            visualPreset: 'gentle-contrast',
            isProjectorMode: false,
          },
        },
      }),
    )

    render(<Starfield />)
    fireEvent.click(screen.getByLabelText('現在のシーンを保存'))

    expect(loadSceneFromStorage(window.localStorage)?.scene.location).toMatchObject({
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
      fireEvent.click(screen.getByLabelText('再生を開始'))
      flushFrame(1000)
      fireEvent.click(screen.getByLabelText('再生を停止'))

      expect(queued.size).toBe(0)
    })

    it('toggles between forward and reverse playback direction', () => {
      render(<Starfield />)
      expect(screen.getByLabelText('巻き戻し再生に切替')).toBeTruthy()

      fireEvent.click(screen.getByLabelText('巻き戻し再生に切替'))
      expect(screen.getByLabelText('順方向再生に切替')).toBeTruthy()
    })
  })
})
