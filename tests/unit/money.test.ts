import { describe, expect, it } from 'vitest'
import { assertCents, cents, formatMoney, formatSigned, parseCents } from '@/engine/money'
import { clockString } from '@/engine/clock'
import { LIMITS } from '@/engine/reducer'
import { StoredTimelineSchema } from '@/engine/timeline-schema'
import { toStored } from '@/lib/persistence/types'
import { content, dispatch, fresh } from './helpers'

describe('money', () => {
  it('parses and formats without floating point', () => {
    expect(parseCents('437.82')).toBe(43782)
    expect(parseCents('-500.00')).toBe(-50000)
    expect(parseCents('9.95')).toBe(995)
    expect(formatMoney(43782)).toBe('$437.82')
    expect(formatMoney(71782)).toBe('$717.82')
    expect(formatSigned(-6000)).toBe('-60.00')
    expect(formatSigned(34000)).toBe('+340.00')
    expect(cents(10000)).toBe(1000000)
  })

  it('keeps the whole Day 01 economy in integer cents', () => {
    let state = fresh()
    expect(state.cashCents).toBe(43782)

    state = dispatch(state, {
      type: 'ITEM_PURCHASED',
      itemId: 'tradepost-n90',
      amountCents: 6000,
      label: 'Nokora N90',
    })
    expect(state.cashCents).toBe(37782)

    state = dispatch(state, { type: 'ITEM_LISTED', itemId: 'tradepost-n90' })
    state = dispatch(state, { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 })
    expect(state.cashCents).toBe(71782)
    expect(formatMoney(state.cashCents)).toBe('$717.82')

    state = dispatch(state, {
      type: 'DOMAIN_REGISTERED',
      domain: 'shortclip.com',
      amountCents: 995,
    })
    expect(state.cashCents).toBe(70787)

    for (const entry of state.ledger) assertCents(entry.amount, entry.id)
    assertCents(state.cashCents, 'cash')
    expect(content.economy.quotaCents).toBe(1000000)
  })

  it('never double-buys or double-sells', () => {
    let state = fresh()
    state = dispatch(state, {
      type: 'ITEM_PURCHASED',
      itemId: 'tradepost-n90',
      amountCents: 6000,
      label: 'n90',
    })
    state = dispatch(state, {
      type: 'ITEM_PURCHASED',
      itemId: 'tradepost-n90',
      amountCents: 6000,
      label: 'n90',
    })
    expect(state.cashCents).toBe(37782)

    state = dispatch(state, { type: 'ITEM_LISTED', itemId: 'tradepost-n90' })
    state = dispatch(state, { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 })
    state = dispatch(state, { type: 'ITEM_SOLD', itemId: 'tradepost-n90', amountCents: 34000 })
    expect(state.cashCents).toBe(71782)

    state = dispatch(state, {
      type: 'DOMAIN_REGISTERED',
      domain: 'shortclip.com',
      amountCents: 995,
    })
    state = dispatch(state, {
      type: 'DOMAIN_REGISTERED',
      domain: 'shortclip.com',
      amountCents: 995,
    })
    expect(state.domains).toEqual(['shortclip.com'])
    expect(state.cashCents).toBe(70787)
  })
})

describe('time is the day’s other currency', () => {
  it('every leg of a deal costs the minutes it is authored to cost', () => {
    const opp = content.economy.opportunities.find((o) => o.id === 'tradepost-n90')!
    expect(opp.buyMinutes).toBe(45)
    expect(opp.listMinutes).toBe(120)

    let state = fresh()
    const start = state.minuteOfDay

    state = dispatch(state, {
      type: 'ITEM_PURCHASED',
      itemId: opp.id,
      amountCents: opp.buyCents,
      label: opp.label,
    })
    expect(state.minuteOfDay - start).toBe(opp.buyMinutes)

    state = dispatch(state, { type: 'ITEM_LISTED', itemId: opp.id })
    expect(state.minuteOfDay - start).toBe(opp.buyMinutes + opp.listMinutes)
  })

  it('the losing deal costs more time than the winning one', () => {
    const win = content.economy.opportunities.find((o) => o.id === 'tradepost-n90')!
    const lose = content.economy.opportunities.find((o) => o.id === 'tradepost-parts')!
    expect(lose.buyMinutes + lose.listMinutes).toBeGreaterThan(win.buyMinutes)
    expect(lose.sellCents).toBeLessThan(lose.buyCents)
  })

  it('a purchase the player cannot afford does not happen', () => {
    const broke = { ...fresh(), cashCents: 1000 }
    const after = dispatch(broke, {
      type: 'ITEM_PURCHASED',
      itemId: 'tradepost-n90',
      amountCents: 6000,
      label: 'n90',
    })
    expect(after).toBe(broke)
    expect(after.cashCents).toBe(1000)
  })

  it('cash cannot be driven negative by registering domains', () => {
    let state = { ...fresh(), cashCents: 1500 }
    for (const domain of ['a.com', 'b.com', 'c.com', 'd.com']) {
      state = dispatch(state, { type: 'DOMAIN_REGISTERED', domain, amountCents: 995 })
    }
    expect(state.cashCents).toBeGreaterThanOrEqual(0)
    expect(state.domains).toEqual(['a.com'])
  })
})

describe('the day has an end even for a player who will not stop', () => {
  it('time never runs past 23:41', () => {
    let state = fresh()
    for (let i = 0; i < 400; i += 1) {
      state = dispatch(state, { type: 'RECALL_USED', query: 'bitcoin' })
    }
    expect(state.minuteOfDay).toBe(1421)
    expect(clockString(state.minuteOfDay)).toBe('23:41')
  })

  it('and the arrays it grows stay inside what a save can hold', () => {
    let state = fresh()
    for (let i = 0; i < 200; i += 1) {
      state = dispatch(state, { type: 'RECALL_USED', query: `q${i}` })
      state = dispatch(state, { type: 'TERMINAL_COMMAND_RUN', command: `bogus${i}` })
    }
    expect(state.recalls.length).toBeLessThanOrEqual(LIMITS.recalls)
    expect(state.terminal.lines.length).toBeLessThanOrEqual(LIMITS.terminalLines)
    expect(StoredTimelineSchema.safeParse(toStored(state)).success).toBe(true)
  })

  it('a pasted note is truncated where the schema would have refused it', () => {
    const state = dispatch(fresh(), { type: 'NOTES_CHANGED', value: 'x'.repeat(50_000) })
    expect(state.notes).toHaveLength(LIMITS.notes)
    expect(StoredTimelineSchema.safeParse(toStored(state)).success).toBe(true)
  })
})
