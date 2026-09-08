import type { z } from 'zod'
import type { MailMessageSchema, UnknownMailSchema } from '@/engine/content-schema'

type MailInput = z.input<typeof MailMessageSchema>

export const mail: MailInput[] = [
  {
    id: 'm1',
    from: 'AION GROUP — SETTLEMENTS',
    subject: 'Quota 01 — statement of obligation',
    time: '03:11',
    meta: 'From settlements@aion-group.com · to o.rask@corvidmail.com · Thu 15 Jan 2009, 03:11',
    body: [
      'Obligation on record: $10,000.00.',
      'Term: thirty (30) calendar days from waking.',
      'Instrument of payment is your discretion. Origin of funds is your problem.',
      'No further correspondence will be sent. There will be no reminder and no extension.',
      '— Settlements',
    ],
    evidenceId: 'e2',
  },
  {
    id: 'm2',
    from: 'Meridian Savings & Loan',
    subject: 'Your new account is ready',
    time: '06 Jan',
    meta: 'From no-reply@meridiansavings.com · Tue 06 Jan 2009, 09:14',
    body: [
      'Welcome, Mr. Rask.',
      'Your checking account ····4471 was opened on 06 January 2009 at our SE Morrison branch. Your available balance is $437.82.',
      'Please retain this message for your records.',
    ],
    evidenceId: 'e4',
  },
  {
    id: 'm3',
    from: 'Marc Deleon',
    subject: 'sat night',
    time: 'Wed',
    meta: 'From m.deleon@fastwebmail.net · Wed 14 Jan 2009, 23:51',
    body: [
      'stayed in all evening, watched the game. call me tomorrow, i have something that pays.',
      '—m',
    ],
    evidenceId: null,
  },
]

/** Arrives at the top of the inbox when the day ends. */
export const unknownMail: z.input<typeof UnknownMailSchema> = {
  id: 'm0',
  from: 'UNKNOWN',
  subject: '(no subject)',
  time: '23:39',
  meta: 'From — · Thu 15 Jan 2009, 23:39 · sender could not be resolved',
  opening: 'You shouldn’t have opened that file.',
  withClaim:
    'And you should be more careful what you put your name to. “{{claim}}” is now on record as yours.',
  withoutClaim: 'We read the quiet ones too.',
  heatLines: [
    {
      minHeat: 40,
      text: 'You were loud today. The file reported at 09:14. Twenty-nine days left, and you are already easy to find.',
    },
    { minHeat: 20, text: 'The encrypted file reported you. We were going to tell you tomorrow.' },
  ],
  notesLine: 'You wrote {{count}} characters into an unsaved document. It was not unsaved.',
  watchlistLine: 'You wrote down {{count}} names today. We have the list.',
}
