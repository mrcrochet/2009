import type { z } from 'zod'
import type { EvidenceSchema } from '@/engine/content-schema'

type EvidenceInput = z.input<typeof EvidenceSchema>

export const evidence: EvidenceInput[] = [
  {
    id: 'e1',
    source: 'READ_ME.TXT — DESKTOP',
    sourceKind: 'files',
    text: '“Quota 01: $10,000.00. 30 days. Do not contact anyone about this file.”',
    tags: ['aion', 'quota', 'instruction'],
    reliability: 'documentary',
  },
  {
    id: 'e2',
    source: 'CORVID MAIL — HEADER',
    sourceKind: 'mail',
    text: 'Aion settlement notice sent 03:11, four hours before you woke up.',
    tags: ['aion', 'timing'],
    reliability: 'documentary',
  },
  {
    id: 'e3',
    source: 'COLUMBIA REGISTER — OBITUARY',
    sourceKind: 'browser',
    text: 'Owen T. Rask, 34, died 19 December 2008.',
    tags: ['rask', 'identity'],
    reliability: 'documentary',
  },
  {
    id: 'e4',
    source: 'MERIDIAN SAVINGS',
    sourceKind: 'bank',
    text: 'Checking ····4471 in the name of Rask, O. — opened 06 January 2009.',
    tags: ['rask', 'identity', 'meridian'],
    reliability: 'documentary',
  },
  {
    id: 'e5',
    source: 'SMS — MARC, 14 JAN',
    sourceKind: 'phone',
    text: '21:58 — “you home? need to drop something off.”',
    tags: ['marc', 'timing'],
    reliability: 'testimonial',
  },
  {
    id: 'e6',
    source: 'PHOTO — 14 JAN 22:08',
    sourceKind: 'phone',
    text: 'Frame taken 22:08 in a parking structure downtown. Marc’s car, and Marc, four miles from 39th Ave.',
    tags: ['marc', 'location', 'timing'],
    reliability: 'documentary',
  },
  {
    id: 'e7',
    source: 'TERMINAL — CIBLES.ENC',
    sourceKind: 'terminal',
    text: 'Target list copied 22:14. Entry: RASK, O. — status ACTIVE.',
    tags: ['aion', 'rask', 'lea', 'list'],
    reliability: 'documentary',
  },
  {
    id: 'e8',
    source: 'MERIDIAN SAVINGS',
    sourceKind: 'bank',
    text: '$500.00 ATM withdrawal, 14 Jan 22:17, SE Morrison branch.',
    tags: ['marc', 'meridian', 'morrison'],
    reliability: 'documentary',
  },
  {
    id: 'e9',
    source: 'CLUSTER — LEA VOSS',
    sourceKind: 'browser',
    text: 'Posted 04:12: “someone has been parked outside my building for two nights.”',
    tags: ['lea', 'surveillance'],
    reliability: 'testimonial',
  },
  {
    id: 'e10',
    source: 'NAMEWELL — WHOIS',
    sourceKind: 'browser',
    text: 'aion-group.com registered 11 Dec 2008. Registrant address is the SE Morrison branch of Meridian Savings.',
    tags: ['aion', 'meridian', 'morrison'],
    reliability: 'documentary',
  },
]
