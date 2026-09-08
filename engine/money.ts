/**
 * Authoritative money is always integer cents. Floating point never touches a balance.
 */

export type Cents = number

export function cents(whole: number, fraction = 0): Cents {
  return Math.round(whole) * 100 + Math.round(fraction)
}

/** Parse a literal like "437.82" into cents. Used by content authoring only. */
export function parseCents(literal: string): Cents {
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(literal.trim())
  if (!m) throw new Error(`money: cannot parse "${literal}"`)
  const sign = m[1] === '-' ? -1 : 1
  const whole = Number(m[2])
  const frac = Number((m[3] ?? '0').padEnd(2, '0'))
  return sign * (whole * 100 + frac)
}

export function formatMoney(value: Cents): string {
  const negative = value < 0
  const abs = Math.abs(value)
  const body = (abs / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${negative ? '-' : ''}$${body}`
}

/** Signed ledger rendering: "+340.00" / "-60.00". */
export function formatSigned(value: Cents): string {
  const abs = Math.abs(value)
  const body = (abs / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${value < 0 ? '-' : '+'}${body}`
}

export function assertCents(value: number, label: string): asserts value is Cents {
  if (!Number.isInteger(value)) {
    throw new Error(`money: ${label} must be integer cents, got ${value}`)
  }
}
