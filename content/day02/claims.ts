import type { z } from 'zod'
import type { ClaimSchema } from '@/engine/content-schema'

type ClaimInput = z.input<typeof ClaimSchema>

/**
 * Day 02's claims, numbered on from Day 01's.
 *
 * Claim ids are not namespaced by day the way evidence ids are, and a claim the player files
 * stays in `claimLog` for the rest of the timeline. A second `c1` twenty-eight days later would
 * be two different sentences under one name in the same record, so the numbering runs on.
 *
 * `need` may name an earlier day's evidence outright — `'1:e4'` is the account record from the
 * fifteenth. Anything unqualified means today's. Three of the six below cannot be argued out of
 * one day alone, which is the point of the day.
 */
export const claims: ClaimInput[] = [
  {
    id: 'c7',
    text: 'Somebody else signs on the account you are using.',
    need: ['1:e4', 'e1'],
    sound: true,
    accepted:
      'ACCEPTED. Opened on the sixth in the name of a man who died in December, amended on the fourteenth to admit a second hand. Neither of those days was yours, and you are the one holding the card.',
    rejected:
      'INSUFFICIENT. A card with two signatures on it is a card. You need the record of when the account was opened and in whose name, or you are describing a piece of paper.',
  },
  {
    id: 'c8',
    // The unsound one. It is the claim the day has been steering at: a closure and a vacancy,
    // both real, both dated, and neither of them about the player at all. Filing it costs heat
    // and puts a sentence on the record that reads, later, as somebody deciding they are the
    // subject of a bank's Friday.
    text: 'The Morrison branch closed to keep you away from the counter.',
    need: ['e2', 'e3'],
    sound: false,
    accepted:
      'REFUSED. A notice and a job advertisement. Banks shut counters for a hundred reasons and hire for a hundred more, and none of the reasons on either document is you. The claim is filed anyway — under your name.',
    rejected: 'REFUSED. The claim is filed anyway — under your name.',
  },
  {
    id: 'c9',
    text: 'The list on this machine came from Marc Deleon’s computer, and his address is on this morning’s route.',
    need: ['1:e7', 'e7'],
    sound: true,
    accepted:
      'ACCEPTED. The file records where it was copied from and when: deleon-pc, 14 January, 22:14. The route sheet records where somebody was going at 06:40 this morning and what they were going to do there. He took the list. Now he is a line on one.',
    rejected:
      'INSUFFICIENT. A route sheet is an address and a time. You need the thing that says whose machine the list came off, or you are claiming a man is in trouble because a van was on his street.',
  },
  {
    id: 'c10',
    text: 'The name you are using was taken from a list of people nobody would ask after.',
    need: ['1:e3', 'e9'],
    sound: true,
    accepted:
      'ACCEPTED. Fifteen days apart, one funeral home, no service either time, and under survivors both notices print nothing at all. A name is easiest to take from someone who left no one waiting to hear it.',
    rejected:
      'INSUFFICIENT. One notice is a death. You need the second one before the pattern is a pattern.',
  },
  {
    id: 'c11',
    text: 'Somebody was inside the Morrison branch at four this morning.',
    need: ['e6'],
    sound: true,
    accepted:
      'ACCEPTED. Fluorescent light, a counter, a queue barrier, an open drawer, 04:02. Cleaners do not photograph the till, and the picture was sent to your telephone.',
    rejected:
      'INSUFFICIENT. That your telephone rang at four in the morning is not evidence of anything except the hour. You need what arrived with it.',
  },
  {
    id: 'c12',
    text: 'The car outside Lea Voss’s building left in the night.',
    need: ['1:e9', 'e8'],
    sound: true,
    accepted:
      'ACCEPTED. Two posts, thirty-one hours apart, one person, one car. It was there and now it is not. That is the whole of it, and it is not nothing — somebody decided she was finished being watched.',
    rejected:
      'INSUFFICIENT. This morning she says it is gone. You have no record that it was ever there, and hers is the only account either way.',
  },
]
