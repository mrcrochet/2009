import type { z } from 'zod'
import type { MailMessageSchema, UnknownMailSchema } from '@/engine/content-schema'

type MailInput = z.input<typeof MailMessageSchema>

/**
 * `mail[0]` is what the machine is showing when the player arrives — the night event opens it and
 * marks it read whether or not they ever click anything. It is the statement, because the
 * statement is the thing that was waiting.
 */
export const mail: MailInput[] = [
  {
    id: 'm1',
    from: 'AION GROUP — SETTLEMENTS',
    subject: 'Statement 02 — no action required',
    time: '04:03',
    meta: 'From settlements@aion-group.com · to o.rask@corvidmail.com · Fri 16 Jan 2009, 04:03',
    body: [
      'Obligation on record: $10,000.00. Received to date: $0.00.',
      'Day: 02 of 30.',
      'Files in recovery: 41. Files closed this quarter: 9.',
      'This statement is issued for your records. No action is required and no reply is possible.',
      'You were told there would be no further correspondence. A statement is not correspondence.',
      '— Settlements',
    ],
    evidenceId: 'e11',
  },
  {
    id: 'm2',
    from: 'Marc Deleon',
    subject: '(no subject)',
    time: '05:51',
    meta: 'From m.deleon@fastwebmail.net · Fri 16 Jan 2009, 05:51 · sent from a mobile device',
    body: ['dont come to the house'],
    evidenceId: null,
  },
  {
    id: 'm3',
    from: 'Meridian Savings & Loan',
    subject: 'Service notice — SE Morrison branch',
    time: '06:12',
    meta: 'From no-reply@meridiansavings.com · Fri 16 Jan 2009, 06:12',
    body: [
      'Our SE Morrison branch is closed to the public from Friday 16 January for scheduled systems work.',
      'Teller services and safe deposit access are available at 2200 NE Sandy Blvd. New-account files have been moved to Sandy Blvd for the duration.',
      'The ATM at SE Morrison remains in service.',
      'We apologise for the inconvenience. This notice was generated automatically and has not been reviewed by branch staff.',
    ],
    evidenceId: 'e2',
  },
  {
    id: 'm4',
    from: 'Lea Voss',
    subject: 'sorry about the hour',
    time: '07:38',
    meta: 'From l.voss@corvidmail.com · Fri 16 Jan 2009, 07:38',
    body: [
      'i put something on cluster at half seven and then sat here for an hour deciding whether to write to you as well.',
      'the car is gone. i have looked four times. i keep thinking i should feel better about it than i do.',
      'marc gave you my screen name and then stopped answering his own. if you know why, i would rather hear it from you than work it out on my own at three in the morning.',
      'there is also a job going, if you still need one. it is not a nice job. i will tell you about it if you ask.',
    ],
    evidenceId: null,
  },
  {
    id: 'm5',
    from: 'TradePost (automated)',
    subject: '11 new items match your saved search: nokora',
    time: '08:26',
    meta: 'From alerts@tradepost.com · Fri 16 Jan 2009, 08:26 · you may unsubscribe at any time',
    body: [
      'Eleven items posted in Portland / Vancouver since your last visit match: nokora',
      'Lowest asking price: $85. Highest asking price: $340.',
      'TradePost does not verify listings. Meet in public. Do not wire money.',
      'You are receiving this because a search was saved on this account. TradePost does not store who saved it.',
    ],
    evidenceId: null,
  },
]

/** Arrives at the top of the inbox when the day ends. */
export const unknownMail: z.input<typeof UnknownMailSchema> = {
  id: 'm0',
  from: 'UNKNOWN',
  subject: '(no subject)',
  time: '21:38',
  meta: 'From — · Fri 16 Jan 2009, 21:38 · sender could not be resolved',
  opening: 'You went looking for the second signature. We wondered how long that would take.',
  withClaim:
    'Two days, two things you have put your name to. “{{claim}}” is the newer one, and it will be read by people who were not there.',
  withoutClaim:
    'You have filed nothing, again. It reads as caution from where you are sitting and as something else from here.',
  /**
   * Heat is carried across the night, so a player arriving from a loud Thursday is already inside
   * the first band before they have done anything on Friday. The thresholds are set above Day
   * 01's on purpose: the same behaviour twice is what earns the top line.
   */
  heatLines: [
    {
      minHeat: 80,
      text: 'Two days. You have tried keys that were not yours, put your name to things you cannot support, and written down the people you are interested in. Twenty-eight days left and you are no longer difficult to find. You are a short list of one.',
    },
    {
      minHeat: 50,
      text: 'You were loud again today. Nothing you did on the fifteenth has been forgotten and nothing you did on the sixteenth was quieter.',
    },
    {
      minHeat: 25,
      text: 'The file has your name on it twice now. Once because we put it there and once because you did.',
    },
  ],
  notesLine:
    'You wrote {{count}} characters into an unsaved document. We do not read the words. We do not need to; you were the one who thought it was worth writing down.',
  watchlistLine:
    'There are {{count}} names on your watchlist. It is a list of things you expect to be worth something later, kept on a machine you did not buy, in a name you did not earn.',
}
