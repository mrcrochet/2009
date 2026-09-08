import type { z } from 'zod'
import type { EvidenceSchema } from '@/engine/content-schema'
import { evidence as day01Evidence } from '@/content/day01/evidence'

type EvidenceInput = z.input<typeof EvidenceSchema>

export const evidence: EvidenceInput[] = [
  {
    id: 'e1',
    source: 'SCAN — SIGNATURE SPECIMEN CARD',
    sourceKind: 'files',
    text: 'Account ····4471 carries two specimen signatures. The second was added 14 January 2009 at 16:40 and is initialled, not signed.',
    tags: ['rask', 'meridian', 'morrison', 'signature'],
    reliability: 'documentary',
  },
  {
    id: 'e2',
    source: 'CORVID MAIL — MERIDIAN SERVICE NOTICE',
    sourceKind: 'mail',
    text: 'SE Morrison closed to the public from 16 January. New-account files moved to NE Sandy Blvd “for the duration”.',
    tags: ['meridian', 'morrison', 'closure'],
    reliability: 'documentary',
  },
  {
    id: 'e3',
    source: 'MERIDIAN SAVINGS — CAREERS',
    sourceKind: 'browser',
    text: 'The new-accounts position at SE Morrison is open immediately. The posting went up on 15 January.',
    tags: ['meridian', 'morrison', 'staff'],
    reliability: 'circumstantial',
  },
  {
    id: 'e4',
    // Named by `economy.accountEvidenceId`, so this is what pinning the balance panel puts in
    // the tray. Today the header is the fact: the statement has grown a second party overnight,
    // and it does not print the name.
    source: 'MERIDIAN SAVINGS',
    sourceKind: 'bank',
    text: 'Statement header reads RASK, O. AND ANOTHER. The second party is on file and is not printed.',
    tags: ['rask', 'meridian', 'signature'],
    reliability: 'documentary',
  },
  {
    id: 'e5',
    source: 'SMS — UNLISTED, 16 JAN',
    sourceKind: 'phone',
    text: '04:07 — “he is not answering me either. do not go to the branch today.”',
    tags: ['marc', 'morrison', 'warning'],
    reliability: 'testimonial',
  },
  {
    id: 'e6',
    source: 'PICTURE MESSAGE — 16 JAN 04:02',
    sourceKind: 'phone',
    text: 'A branch interior, lit, at 04:02: a counter, a queue barrier, and the corner of a cash drawer standing open.',
    tags: ['meridian', 'morrison', 'timing'],
    reliability: 'documentary',
  },
  {
    id: 'e7',
    source: 'TERMINAL — ROUTE.ENC',
    sourceKind: 'terminal',
    text: 'Collection route for 16 January. 06:40 — 1822 SE 39th Ave. Marked COLLECT.',
    tags: ['marc', 'aion', 'route'],
    reliability: 'documentary',
  },
  {
    id: 'e8',
    source: 'CLUSTER — LEA VOSS',
    sourceKind: 'browser',
    text: 'Posted 07:31: “the car is gone. so is the man who was sitting in it. i should be relieved.”',
    tags: ['lea', 'surveillance'],
    reliability: 'testimonial',
  },
  {
    id: 'e9',
    source: 'COLUMBIA REGISTER — OBITUARY',
    sourceKind: 'browser',
    text: 'Julia B. Moran, 41, died 4 December 2008. No service. No survivors listed. Filed by the same house as the Rask notice.',
    tags: ['moran', 'identity', 'aion'],
    reliability: 'documentary',
  },
  {
    id: 'e10',
    source: 'TRADEPOST — PORTLAND / PHONES',
    sourceKind: 'browser',
    text: 'Eleven Nokora N90 handsets posted in the metro since Thursday afternoon. Asking prices have fallen from $340 to $85.',
    tags: ['nokora', 'market'],
    reliability: 'circumstantial',
  },
  {
    id: 'e11',
    source: 'AION GROUP — STATEMENT 02',
    sourceKind: 'mail',
    text: 'Issued 04:03. “Files in recovery: 41. Files closed this quarter: 9.”',
    tags: ['aion', 'quota'],
    reliability: 'documentary',
  },
]

/**
 * What the 15th is still holding up.
 *
 * Qualified ids, because the reducer namespaces a pin by the day it was made on — `1:e3` is the
 * obituary the player read yesterday, and `2:e3` is a job advertisement. The list is short on
 * purpose: a day carries what one of its claims or one of its conversations actually needs, and
 * nothing else. Anything the player pinned yesterday and this day has no use for stays in the
 * tray unspoken, which is what a case file is.
 *
 * The sharp edge, and it is deliberate: a player who never pinned the obituary cannot argue
 * `c10` today. The claim is not withheld — it is unprovable, which is a different feeling and
 * the right one.
 */
const CARRIED = ['e3', 'e4', 'e6', 'e7', 'e9'] as const

export const carriedEvidence: EvidenceInput[] = CARRIED.map((id) => {
  const found = day01Evidence.find((e) => e.id === id)
  if (!found) throw new Error(`day02: day 01 has no evidence "${id}" to carry`)
  return { ...found, id: `1:${id}` }
})
