/**
 * The session clock.
 *
 * `minute` is minutes elapsed since the investigator sat down. The wall time shown in the menu
 * bar is that offset from the hour the case declares it starts at — a case is worked in one
 * sitting, so there is no day to be minutes *into*.
 */

/** The hour a session starts at when a case does not say otherwise. */
export const DEFAULT_START_MINUTE = 19 * 60 + 12 // 19:12
/** How long a session can run before the case closes itself. */
export const DEFAULT_SESSION_MINUTES = 260

export function clockString(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** "Tue 9 Jun 19:12" for the menu bar. */
export function menuBarClock(minuteOfDay: number, dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00Z`)
  const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()]
  const month = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ][d.getUTCMonth()]
  return `${weekday} ${d.getUTCDate()} ${month} ${clockString(minuteOfDay)}`
}
