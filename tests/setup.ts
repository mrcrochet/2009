import '@testing-library/jest-dom/vitest'

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => 'test-uuid-0000-0000-0000-000000000000' },
    configurable: true,
  })
}

/**
 * jsdom implements no media queries at all, so a component that asks whether the player wants
 * less motion throws before it renders. The shim answers "no" — the same default
 * `useReducedMotion` uses on the server — so a test that has not said otherwise sees the full
 * scripted pacing, and a test that cares can stub over it.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (query: string): MediaQueryList =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  })
}
