/** In-world clock. `minuteOfDay` is minutes since local midnight on 15 Jan 2009. */

export const WAKE_MINUTE = 7 * 60 + 32 // 07:32
export const DAY_END_MINUTE = 23 * 60 + 41 // 23:41

export function clockString(minuteOfDay: number): string {
  const m = ((minuteOfDay % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

/** "Thu 15 Jan 07:32" for the HALCYON menu bar. */
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
