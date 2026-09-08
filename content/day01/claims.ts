import type { z } from 'zod'
import type { ClaimSchema } from '@/engine/content-schema'

type ClaimInput = z.input<typeof ClaimSchema>

/**
 * `sound: false` claims can never be accepted, however well they are supported. They are filed
 * on the record under the player's name and produce a consequence at day end.
 */
export const claims: ClaimInput[] = [
  {
    id: 'c1',
    text: 'Marc was not at home on the night of the 14th.',
    need: ['e5', 'e6'],
    sound: true,
    accepted: 'ACCEPTED. Two records, one contradiction, no interpretation required. The claim holds.',
    rejected:
      'INSUFFICIENT. You are asserting where he was not. You need something that places him elsewhere at a known time.',
  },
  {
    id: 'c2',
    text: 'Owen Rask is dead and someone else is operating his accounts.',
    need: ['e3', 'e4'],
    sound: true,
    accepted:
      'ACCEPTED. A man who died on 19 December did not open a checking account on 6 January. You are using his name.',
    rejected: 'INSUFFICIENT. A death and an account are not yet the same story. Find both.',
  },
  {
    id: 'c3',
    text: 'The quota notice was written before you woke up.',
    need: ['e2'],
    sound: true,
    accepted: 'ACCEPTED. 03:11. Whoever sent it knew you would be here at 07:32.',
    rejected: 'INSUFFICIENT. You need the header, not the feeling.',
  },
  {
    id: 'c4',
    text: 'Marc works for the Aion Group.',
    need: ['e7', 'e2', 'e8'],
    sound: false,
    accepted: 'REFUSED. Proximity is not employment. The claim is filed anyway — under your name.',
    rejected: 'REFUSED. The claim is filed anyway — under your name.',
  },
  {
    id: 'c5',
    text: 'Lea Voss is being watched because of what she is building.',
    need: ['e9', 'e7'],
    sound: true,
    accepted:
      'ACCEPTED. Her name is on a list you were not supposed to read, and someone is sitting outside her door. She does not know either of these things.',
    rejected: 'INSUFFICIENT. You need her own words and the list that names her.',
  },
  {
    id: 'c6',
    text: 'Aion and the bank that opened your account are the same address.',
    need: ['e10', 'e4'],
    sound: true,
    accepted:
      'ACCEPTED. The creditor and the account are one building on SE Morrison. Someone walked in and made you.',
    rejected: 'INSUFFICIENT. A registrar record alone proves a mailbox, not a relationship.',
  },
]
