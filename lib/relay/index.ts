export { assertSafeUrl, isBlockedAddress, parseAddress, safeFetch, RELAY_LIMITS } from './security'
export { getProvider, isRelayConfigured, type RelayProvider } from './provider'
export {
  contentHashOf,
  recallSnapshot,
  rememberSnapshot,
  snapshotFrom,
  snapshotIdFor,
  toBlocks,
} from './cache'
export {
  RelayRefused,
  type RelayBlock,
  type RelayDocument,
  type RelayLink,
  type RelayRefusal,
  type RelayResult,
  type RelaySearchResponse,
  type RelaySnapshot,
} from './types'

// The fictional-overlay boundary. Exported here so nothing has to reach past the barrel to
// find the thing that refuses an invented page about the real world.
export {
  createOverlay,
  mergeSearchResults,
  OverlayRefused,
  type FictionalOverlay,
  type OverlayDraft,
} from './overlay'
export { UNIVERSE, OWNED_DOMAINS, findEntity, type UniverseEntity } from './universe'
