import type { z } from 'zod'
import type { EconomySchema } from '@/engine/content-schema'
import { parseCents } from '@/engine/money'

export const economy: z.input<typeof EconomySchema> = {
  openingCashCents: parseCents('437.82'),
  quotaCents: parseCents('10000.00'),
  quotaDays: 30,
  bankName: 'MERIDIAN SAVINGS & LOAN',
  accountLabel: 'CHECKING ····4471 — RASK, O.',
  accountOpened: 'Available balance · Account opened 06 Jan 2009',
  brokerageNotice:
    'Brokerage account required to place orders. Minimum opening deposit: $2,000.00.',
  brokerageMinimum: 'You have no brokerage account.',
  domainPriceCents: parseCents('9.95'),
  domainShift: 1,
  opportunities: [
    {
      id: 'tradepost-n90',
      label: 'Nokora N90 — unlocked, boxed',
      buyCents: parseCents('60.00'),
      sellCents: parseCents('340.00'),
      buyMinutes: 45,
      listMinutes: 120,
      settleMs: 2200,
      shiftOnSell: 1,
      buyLedgerLabel: 'CASH WITHDRAWAL — TRADEPOST MEET',
      sellLedgerLabel: 'DEPOSIT — CASH (RESALE)',
      beat: 'money',
    },
    {
      // TradePost's own front page wrote the moral: if a deal seems too good, it is because
      // someone does not know what they have. Sometimes that person is you. Future knowledge
      // does not cover a cardboard box in Beaverton — and this one costs two and a half hours
      // of a finite day as well as the money.
      id: 'tradepost-parts',
      label: 'Box of laptop parts — untested',
      buyCents: parseCents('40.00'),
      sellCents: parseCents('15.00'),
      buyMinutes: 95,
      listMinutes: 60,
      settleMs: 2200,
      shiftOnSell: 0,
      buyLedgerLabel: 'CASH WITHDRAWAL — BEAVERTON MEET',
      sellLedgerLabel: 'DEPOSIT — CASH (PARTS, SALVAGE)',
      beat: null,
    },
  ],
  quotes: [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '82.33', change: '-1.74', direction: 'down' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '49.75', change: '+0.38', direction: 'up' },
    { symbol: 'GOOG', name: 'Google Inc.', price: '306.50', change: '-4.10', direction: 'down' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: '19.24', change: '-0.51', direction: 'down' },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: '29.86', change: '+0.44', direction: 'up' },
    {
      symbol: 'DJIA',
      name: 'Dow Jones Industrial Average',
      price: '8,212',
      change: '-248',
      direction: 'down',
    },
  ],
  openingLedger: [
    {
      id: 'l-14jan-atm',
      date: '14 Jan',
      label: 'ATM WITHDRAWAL — SE MORRISON',
      amount: parseCents('-500.00'),
      evidenceId: 'e8',
    },
    { id: 'l-12jan-dep', date: '12 Jan', label: 'DEPOSIT — CASH', amount: parseCents('900.00') },
    {
      id: 'l-09jan-pre',
      date: '09 Jan',
      label: 'MERIDIAN WIRELESS — PREPAID',
      amount: parseCents('-37.18'),
    },
    {
      id: 'l-06jan-open',
      date: '06 Jan',
      label: 'ACCOUNT OPENED — INITIAL DEPOSIT',
      amount: parseCents('75.00'),
    },
  ],
}
