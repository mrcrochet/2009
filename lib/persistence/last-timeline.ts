/**
 * The id of the most recently played timeline. Deliberately its own module with no IndexedDB
 * import, so the marketing landing can offer "resume" without pulling the storage layer into a
 * route that never opens a database.
 */
const LAST_KEY = 'two009:last-timeline'

export function lastTimelineId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(LAST_KEY)
  } catch {
    return null
  }
}

export function rememberTimelineId(id: string): void {
  try {
    window.localStorage.setItem(LAST_KEY, id)
  } catch {
    /* a private window may refuse; the save itself already succeeded */
  }
}
