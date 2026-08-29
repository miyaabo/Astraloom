import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

// jsdom has no WebGL context, so the real Three.js renderer can't run here;
// browser rendering is covered by the Task 8 Playwright smoke test instead.
vi.mock('./render/StarfieldRenderer', () => ({
  StarfieldRenderer: class {
    resize = vi.fn()
    render = vi.fn()
    start = vi.fn()
    dispose = vi.fn()
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

describe('App', () => {
  it('renders a starfield canvas without crashing', () => {
    const { container } = render(<App />)
    expect(container.querySelector('canvas')).toBeTruthy()
  })
})
