import { describe, expect, it } from 'vitest'
import { cascadePosition, clampPhone, clampWindow } from '@/engine/rules'
import { selectFrontApp, selectFrontTitle } from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

const VIEWPORT = { width: 1280, height: 800 }

describe('window manager', () => {
  it('cascades new windows', () => {
    expect(cascadePosition(0, 640, 410, VIEWPORT)).toEqual({ x: 150, y: 70 })
    expect(cascadePosition(1, 640, 410, VIEWPORT)).toEqual({ x: 184, y: 98 })
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
      { type: 'APP_OPENED', app: 'bank' },
    ])
    expect(selectFrontApp(state)).toBe('bank')
    expect(selectFrontTitle(state, content)).toBe('Meridian Savings')

    state = dispatch(state, { type: 'APP_FOCUSED', app: 'mail' })
    expect(selectFrontApp(state)).toBe('mail')

    state = dispatch(state, { type: 'APP_CLOSED', app: 'mail' })
    expect(state.windows.map((w) => w.app)).toEqual(['bank'])
    expect(selectFrontTitle(state, content)).toBe('Meridian Savings')
  })

  it('re-opening an app focuses it instead of duplicating it', () => {
    const state = run(fresh(), [
      { type: 'APP_OPENED', app: 'mail' },
      { type: 'APP_OPENED', app: 'bank' },
      { type: 'APP_OPENED', app: 'mail' },
    ])
    expect(state.windows).toHaveLength(2)
    expect(selectFrontApp(state)).toBe('mail')
  })

  it('minimising hides a window from the front-most calculation', () => {
    let state = run(fresh(), [
      { type: 'APP_OPENED', app: 'mail' },
      { type: 'APP_OPENED', app: 'bank' },
    ])
    state = dispatch(state, { type: 'APP_MINIMIZED', app: 'bank' })
    expect(selectFrontApp(state)).toBe('mail')
    state = dispatch(state, { type: 'APP_FOCUSED', app: 'bank' })
    expect(state.windows.find((w) => w.app === 'bank')?.minimized).toBe(false)
  })

  it('persists a moved window', () => {
    const state = run(fresh(), [
      { type: 'APP_OPENED', app: 'notes' },
      { type: 'WINDOW_MOVED', app: 'notes', x: 420, y: 300 },
    ])
    expect(state.windows[0]).toMatchObject({ x: 420, y: 300 })
  })
})
