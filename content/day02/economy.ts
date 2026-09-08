import type { z } from 'zod'
import type { EconomySchema } from '@/engine/content-schema'
import { parseCents } from '@/engine/money'

/**
 * Day 01's money was one good deal and one trap, and the trap was a box of junk in Beaverton.
 * Day 02 has a different shape: the trap is the deal that worked yesterday.
 *
 * Somebody liquidated a distributor's stock on Thursday afternoon, so the Portland resale price
 * of an N90 has fallen from $340 to $85 and the man selling one for $150 does not know that yet.
 * A player who learned "phones flip" on the fifteenth has learned the wrong lesson and will pay
 * $95 for it. The page that says so is `tradepost.com/pdx/phones`, and it is two clicks from the
 * mail that arrives at 08:26 telling them their saved search found eleven matches.
 *
 * The real money is a storage lien lot: nearly four hours of a shorter day and $250 on a table
 * before anybody cuts the lock. It is affordable from the worst Day 01 balance ($307.97, having
 * bought both items, sold neither and registered three domains) and it is not affordable
 * comfortably, which is the intended feeling.
 *
 * Ceiling check: $717.82 + $585.00 + $64.00 = $1,366.82 against a $10,000.00 quota. There is no
 * combination of a day's trades that reaches it, on purpose.
 */
export const economy: z.input<typeof EconomySchema> = {
  /**
   * Read only when a timeline is created directly on this day. A timeline that came through the
   * night keeps whatever balance it earned on the fifteenth, and this number is the balance a
   * player who did everything right would have arrived with.
   */
  openingCashCents: parseCents('717.82'),
  quotaCents: parseCents('10000.00'),
  quotaDays: 30,
  bankName: 'MERIDIAN SAVINGS & LOAN',
  // The header grew a second party overnight. It is the first thing the bank app renders and it
  // is the day's opening escalation: nothing was taken, somebody was added.
  accountLabel: 'CHECKING ····4471 — RASK, O. AND ANOTHER',
  accountOpened: 'Available balance · Two signatories on file · Account opened 06 Jan 2009',
  accountEvidenceId: 'e4',
  brokerageNotice:
    'Brokerage account required to place orders. Minimum opening deposit raised to $2,500.00 effective 16 January 2009.',
  brokerageMinimum: 'You have no brokerage account. You may keep a watchlist.',
  domainPriceCents: parseCents('9.95'),
  // Two, not one. A name registered on the second day is registered by somebody the world has
  // already started to notice.
  domainShift: 2,
  opportunities: [
    {
      id: 'lien-unit-214',
      label: 'Unit 214 — contents, storage lien sale',
      buyCents: parseCents('250.00'),
      sellCents: parseCents('585.00'),
      // Eighty minutes to get to Hawthorne and stand in a doorway; three and a half hours to turn
      // nine boxes into money. Almost four hours of a day that is four hours shorter.
      buyMinutes: 80,
      listMinutes: 210,
      settleMs: 2600,
      shiftOnSell: 1,
      buyLedgerLabel: 'CASH WITHDRAWAL — HAWTHORNE SELF STORAGE',
      sellLedgerLabel: 'DEPOSIT — CASH (UNIT CONTENTS, RESOLD)',
      beat: 'trade',
    },
    {
      // The trap, and it is yesterday's win with the numbers reversed. Nothing on the listing is
      // a lie: it is the same model, it is sealed, and the seller genuinely believes it is worth
      // what it was worth on Thursday morning.
      id: 'nokora-again',
      label: 'Nokora N90 — sealed, unopened',
      buyCents: parseCents('150.00'),
      sellCents: parseCents('55.00'),
      buyMinutes: 55,
      listMinutes: 90,
      settleMs: 2200,
      shiftOnSell: 0,
      buyLedgerLabel: 'CASH WITHDRAWAL — ST JOHNS MEET',
      sellLedgerLabel: 'DEPOSIT — CASH (HANDSET, RESOLD)',
      beat: 'trade',
    },
    {
      // The floor. Small, dull, always affordable, and the only thing on the day that a player
      // who lost everything yesterday can still do. Repair shops paid real money for paper.
      id: 'service-manuals',
      label: 'Two boxes of service manuals',
      buyCents: parseCents('22.00'),
      sellCents: parseCents('64.00'),
      buyMinutes: 30,
      listMinutes: 55,
      settleMs: 1800,
      shiftOnSell: 0,
      buyLedgerLabel: 'CASH WITHDRAWAL — MONTAVILLA PICKUP',
      sellLedgerLabel: 'DEPOSIT — CASH (MANUALS, RESOLD)',
      beat: 'trade',
    },
  ],
  quotes: [
    { symbol: 'AAPL', name: 'Apple Inc.', price: '82.99', change: '+0.66', direction: 'up' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '50.56', change: '+0.81', direction: 'up' },
    { symbol: 'GOOG', name: 'Google Inc.', price: '299.67', change: '-6.83', direction: 'down' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: '19.71', change: '+0.47', direction: 'up' },
    { symbol: 'NFLX', name: 'Netflix Inc.', price: '30.14', change: '+0.28', direction: 'up' },
    {
      symbol: 'DJIA',
      name: 'Dow Jones Industrial Average',
      price: '8,281',
      change: '+69',
      direction: 'up',
    },
  ],
  /**
   * Also read only on a fresh start. A continued timeline arrives with the ledger it wrote
   * yesterday, including the rows for whatever it bought and sold.
   */
  openingLedger: [
    {
      id: 'l-15jan-fee',
      date: '15 Jan',
      label: 'SERVICE CHARGE — PAPER STATEMENT',
      amount: parseCents('-2.00'),
    },
    {
      id: 'l-14jan-atm',
      date: '14 Jan',
      label: 'ATM WITHDRAWAL — SE MORRISON',
      amount: parseCents('-500.00'),
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
