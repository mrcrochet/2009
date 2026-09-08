/**
 * How this machine reads an address.
 *
 * Its own module because three things need to agree on it: the reducer, which records where the
 * player went; the world index, which answers what lives at an address; and the tests. Two
 * spellings of the same page are two pages, and the day a corpus artifact and a browser history
 * entry disagree about trailing slashes is the day a document becomes unreachable.
 */

/**
 * What a 2009 address bar forgave: a scheme, a `www.`, a trailing slash, stray case in the host.
 * The query string is left exactly as typed so percent-encoding survives.
 */
export function normalizeUrl(raw: string): string {
  let url = raw.trim()
  url = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
  url = url.replace(/^www\./i, '')
  const cut = url.search(/[?#]/)
  const path = cut === -1 ? url : url.slice(0, cut)
  const rest = cut === -1 ? '' : url.slice(cut)

  // Only the host is case-insensitive. Lowercasing the path too would make
  // `geohost.com/Terminal/4417` a different page from the one that was authored — and on a real
  // 2009 server it was a different page.
  const slash = path.indexOf('/')
  const host = (slash === -1 ? path : path.slice(0, slash)).toLowerCase()
  const rest0 = slash === -1 ? '' : path.slice(slash)
  return (host + rest0).replace(/\/+$/, '') + rest
}
