import { describe, expect, it } from 'vitest'
import { assertCents, cents, formatMoney, formatSigned, parseCents } from '@/engine/money'
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
