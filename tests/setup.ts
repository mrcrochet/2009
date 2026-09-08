import '@testing-library/jest-dom/vitest'

if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: { ...globalThis.crypto, randomUUID: () => 'test-uuid-0000-0000-0000-000000000000' },
    configurable: true,
  })
}
