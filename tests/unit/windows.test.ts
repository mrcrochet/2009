import { describe, expect, it } from 'vitest'
import { cascadePosition, clampPhone, clampWindow } from '@/engine/rules'
import { selectFrontApp, selectFrontTitle } from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

const VIEWPORT = { width: 1280, height: 800 }

describe('window manager', () => {
  it('cascades new windows from the middle of the usable area', () => {
    // 1280 wide, 640 window → centred at 320, biased 60 left of it.
    const first = cascadePosition(0, 640, 410, VIEWPORT)
    expect(first).toEqual({ x: 260, y: 141 })
    // A constant step, because a cascade the player can predict is the point of one.
    expect(cascadePosition(1, 640, 410, VIEWPORT)).toEqual({ x: 294, y: 169 })
  })

  it('uses the screen it is given rather than a fixed corner', () => {
    const wide = { width: 1920, height: 1080 }
    const narrow = { width: 1280, height: 800 }
    expect(cascadePosition(0, 640, 410, wide).x).toBeGreaterThan(
      cascadePosition(0, 640, 410, narrow).x,
    )
    // And the whole stack still sits clear of the menu bar and the dock.
    for (let i = 0; i < 9; i += 1) {
      const pos = cascadePosition(i, 640, 410, wide)
      expect(pos.y).toBeGreaterThanOrEqual(43)
      expect(pos.y + 410).toBeLessThanOrEqual(wide.height)
    }
  })

  it('keeps windows inside a small viewport', () => {
    const small = { width: 700, height: 500 }
    const pos = cascadePosition(4, 720, 472, small)
    expect(pos.x).toBeLessThanOrEqual(small.width - 40)
    expect(pos.y).toBeGreaterThanOrEqual(43)
  })

  it('clamps a dragged window so the titlebar stays grabbable', () => {
    expect(clampWindow(-9999, -9999, 640, 410, VIEWPORT)).toEqual({ x: -520, y: 23 })
    expect(clampWindow(9999, 9999, 640, 410, VIEWPORT)).toEqual({ x: 1160, y: 760 })
    expect(clampWindow(300, 200, 640, 410, VIEWPORT)).toEqual({ x: 300, y: 200 })
  })

  it('clamps the phone the same way', () => {
    const pos = clampPhone(-9999, -9999, 296, 552, VIEWPORT)
    expect(pos).toEqual({ x: -206, y: 23 })
  })

  it('focuses, stacks and closes', () => {
    let state = run(fresh(), [
      { type: 'APP_OPENED', app: 'mail' },
      { type: 'APP_OPENED', app: 'devices' },
    ])
    expect(selectFrontApp(state)).toBe('devices')
    expect(selectFrontTitle(state, content)).toBe('Devices')

    state = dispatch(state, { type: 'APP_FOCUSED', app: 'mail' })
    expect(selectFrontApp(state)).toBe('mail')

    state = dispatch(state, { type: 'APP_CLOSED', app: 'mail' })
    expect(state.windows.map((w) => w.app)).toEqual(['devices'])
    expect(selectFrontTitle(state, content)).toBe('Devices')
  })

  it('re-opening an app focuses it instead of duplicating it', () => {
    const state = run(fresh(), [
      { type: 'APP_OPENED', app: 'mail' },
      { type: 'APP_OPENED', app: 'devices' },
      { type: 'APP_OPENED', app: 'mail' },
    ])
    expect(state.windows).toHaveLength(2)
    expect(selectFrontApp(state)).toBe('mail')
  })

  it('minimising hides a window from the front-most calculation', () => {
    let state = run(fresh(), [
      { type: 'APP_OPENED', app: 'mail' },
      { type: 'APP_OPENED', app: 'devices' },
    ])
    state = dispatch(state, { type: 'APP_MINIMIZED', app: 'devices' })
    expect(selectFrontApp(state)).toBe('mail')
    state = dispatch(state, { type: 'APP_FOCUSED', app: 'devices' })
    expect(state.windows.find((w) => w.app === 'devices')?.minimized).toBe(false)
  })

  it('persists a moved window', () => {
    const state = run(fresh(), [
      { type: 'APP_OPENED', app: 'notes' },
      { type: 'WINDOW_MOVED', app: 'notes', x: 420, y: 300 },
    ])
    expect(state.windows[0]).toMatchObject({ x: 420, y: 300 })
  })
})
