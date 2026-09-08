import type { z } from 'zod'
import type { DayContentSchema } from '@/engine/content-schema'
import { apps, dock } from '@/content/apps'
import { evidence, carriedEvidence } from './evidence'
import { claims } from './claims'
import { memories, recallConfig } from './recall'
import { mail, unknownMail } from './emails'
import { threads } from './chats'
import { browser } from './browser'
import { files } from './files'
import { terminal } from './terminal'
import { economy } from './economy'
import { phone } from './phone'

/**
 * The first thing the day says.
 *
 * The night starts the machine, so these lines are read on every route into the sixteenth. The
 * seventh of them is the day's premise: somebody was signed in as Owen at 04:03 this morning,
 * from an address on this network that is not this machine, and the console mentions it in
 * passing because a console does not know what it is telling you.
 */
export const boot = [
  'HALCYON 4.1  (build 4.1.882)',
  '',
  'Memory check ........ 2048 MB OK',
  'Volume “HALCYON HD” ... mounted',
  'Volume “ext” ......... mounted (no eject record)',
  'Network interface en0 ... 10.0.1.14',
  'Last login: Fri Jan 16 04:03:11 on ttys001 from 10.0.1.9',
  '',
  'Restoring session for user: orask',
  '',
  'Loading desktop …',
]

/**
 * Friday 16 January 2009.
 *
 * The escalation is arithmetic and prose, not machinery. The day is 713 minutes long against Day
 * 01's 972: the player wakes at 09:47 having lost four hours to a session they did not have, and
 * the lights go out at 21:40 instead of 23:41. Recall costs 13 instead of 9 and degrades below 84
 * instead of 78, and because coherence does not refill overnight, anybody who asked three
 * questions yesterday is already under that line before they ask their first today. The recall
 * library itself is six entries shorter than Thursday's, and nothing announces which six.
 */
export const day02: z.input<typeof DayContentSchema> = {
  day: 2,
  dateISO: '2009-01-16',
  // 09:47. Four hours of a shorter day are gone before it starts, and the file on the desktop
  // says so in the second line.
  wakeMinute: 9 * 60 + 47,
  // 21:40, not 23:41. Two hours less at the other end as well.
  endMinute: 21 * 60 + 40,
  location: 'Portland, Oregon',
  identity: 'Owen T. Rask',
  osName: 'HALCYON 4.1',
  boot,
  bootIntervalMs: 170,
  bootHoldMs: 700,
  messengerOpensAtMs: 1100,
  desktopIconAtMs: 2600,
  // A second longer than Thursday. Everybody is slower to answer today.
  chatReplyDelayMs: 1400,
  apps,
  dock,
  evidence,
  carriedEvidence,
  claims,
  memories,
  recall: recallConfig,
  mail,
  unknownMail,
  threads,
  browser,
  files,
  terminal,
  economy,
  phone,
  dayEnd: {
    timestamp: '16 JANUARY 2009 · 21:40',
    /**
     * `domains`, `watchlist` and `recalls` are lifetime, so this card reads back two days for
     * those and one for the trading. The templates are written as an account rather than as a
     * diary for exactly that reason: "you bought" would be a lie about a domain registered on
     * Thursday, and the same line as a ledger row is true on any day it is printed.
     */
    deeds: {
      sold: '{{label}} — bought for {{buy}}, sold for {{sell}}.',
      lost: '{{label}} — bought for {{buy}}, let go for {{sell}}.',
      holding: '{{label}} — still in your hands, unsold.',
      domain: '{{domain}} — registered to you, a year paid in advance, in a name you did not earn.',
      watchlist: '{{names}} — written down on a machine that is not yours.',
      recalls: '{{spent}} — spent, so far, finding out what you already knew.',
      earlier:
        'Everything you were carrying before this morning: {{count}} of them, {{net}} on the trade.',
      recallsOne: 'One memory',
      recallsMany: '{{count}} memories',
      flagged: [
        {
          whenFlag: 'decrypted',
          text: 'A file that was not addressed to you has been opened. It stays opened, and the volume it came off is still mounted.',
        },
        {
          whenFlag: 'decryptReported',
          text: 'A file reported you for trying keys. The counter did not reset overnight and it will not reset tomorrow.',
        },
        {
          whenFlag: 'leaToldAboutMarc',
          text: 'You told Lea Voss that Marc Deleon’s address was on a collection route, and she went and wrote it where people can read it.',
        },
        {
          whenFlag: 'leaPostedAgain',
          text: 'The plate she wrote down on Thursday because you asked her to is still on a public page this evening.',
        },
        {
          whenFlag: 'leaPostRemoved',
          text: 'The post she took down on Thursday because you asked her to is still down. Four neighbours spent this morning arguing about whether they remember it.',
        },
        {
          whenFlag: 'stayedAway',
          text: 'You told M you would keep away from Morrison. There is no record anywhere of a promise, only of who made one.',
        },
        {
          whenFlag: 'wentToward',
          text: 'You told M you would go to Morrison on Monday. He did not answer, and he said in advance that he would not.',
        },
      ],
    },
    title: 'DAY 02\nCOMPLETE',
    watchedLine:
      'Somebody watched the last six hours of this. The session that opened at 04:03 has still not closed.',
    shiftedLine: 'A page you read this morning no longer says what it said this morning.',
    // Day 01's card sold the game. This one is behind that boundary: the player has already paid
    // and already saved, so the block reads as a machine telling them where they are.
    saveHeadline: 'Day 03 is available.',
    saveBody:
      'This timeline is saved. Nothing on it is undone overnight — not the balance, not the coherence, not the claims with your name on them, and not the four hours.',
    primaryCta: 'CONTINUE YOUR TIMELINE',
    secondaryCta: 'Sign in on another machine',
    priceLine: 'Day 02 of 30 · $10,000.00 outstanding · 28 days · Portland, Oregon',
    // Longer than Thursday's 3,400ms. `pace()` collapses it under prefers-reduced-motion.
    surveillanceDelayMs: 4200,
  },
  /**
   * `brief` and `voss` come from the file and the thread that carry them; `trade` is on all three
   * opportunities, so any completed sale opens the gate. Day 01 credited only the good trade —
   * this day asks the player to move the balance and does not say which way, and losing $95 on a
   * telephone is moving it.
   *
   * `recall` and `claim` are fired by the engine.
   */
  requiredBeats: ['brief', 'voss', 'recall', 'trade', 'claim'],
}
