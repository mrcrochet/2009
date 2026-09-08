export { assertSafeUrl, isBlockedAddress, parseAddress, safeFetch, WAYUP_LIMITS } from './security'
export { getProvider, isRelayConfigured, type WayUpProvider } from './provider'
export {
  contentHashOf,
  recallSnapshot,
  rememberSnapshot,
  snapshotFrom,
  snapshotIdFor,
  toBlocks,
} from './cache'
export {
  WayUpRefused,
  type WayUpBlock,
  type WayUpDocument,
  type WayUpLink,
  type WayUpRefusal,
  type WayUpResult,
  type WayUpSearchResponse,
  type WayUpSnapshot,
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
