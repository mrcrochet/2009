import type { z } from 'zod'
import type { MemorySchema, RecallConfigSchema } from '@/engine/content-schema'

type MemoryInput = z.input<typeof MemorySchema>

/**
 * A closed, authored memory library. Recall resolves against this and nothing else — it never
 * generates a historical outcome that is not written here.
 */
export const memories: MemoryInput[] = [
  {
    id: 'mem-apple',
    keys: ['apple', 'aapl', 'iphone', 'jobs', 'mac'],
    text: 'Apple is at eighty-something dollars this month. You are certain it goes up by an order of magnitude. You cannot remember whether the split came before or after the first tablet.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-bitcoin',
    keys: ['bitcoin', 'btc', 'crypto', 'satoshi', 'e-cash'],
    text: 'A currency with no issuer. It exists already — nine days old, worth nothing, traded by almost no one. You remember a number that ends in a lot of zeros and a story about a hard drive in a landfill.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-netflix',
    keys: ['netflix', 'nflx', 'streaming', 'dvd', 'red envelope'],
    text: 'They mail red envelopes right now. They stop. Streaming is the whole company later. The year they stopped mailing is not in your memory.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-ev',
    keys: ['electric', 'tesla', 'car', 'ev', 'battery'],
    text: 'One electric-car company becomes worth more than every other carmaker combined. It is not public yet. You remember the name of the man better than the name of the company.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-amazon',
    keys: ['amazon', 'amzn', 'aws', 'cloud', 'server rental'],
    text: 'Books now, everything later, and the profitable part is renting out computers. That part is already running and almost nobody has noticed.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-social',
    keys: ['facebook', 'social', 'myspace', 'twitter', 'social network'],
    text: 'The one with the blue bar wins. The one you are on right now does not. There is a lawsuit about who wrote it.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-crash',
    keys: ['housing', 'mortgage', 'real estate', 'crash', 'recession', 'market bottom'],
    text: 'It is not over. March is the floor. You are inside the worst quarter of it right now.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-video',
    keys: ['video', 'shortclip', 'plugin', 'flash', 'html5'],
    text: 'Video in a page without a plugin becomes ordinary. It takes about four years and the people who get there first are not the people who built it first.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-aion',
    keys: ['aion', 'quota', 'rask', 'owen', 'meridian', 'halcyon'],
    text: 'Nothing. You have no memory of any of this from any year. That is what frightens you.',
    confidence: 'NONE',
  },
  {
    id: 'mem-self',
    keys: ['2026', 'future', 'me', 'myself', 'who am i', 'home'],
    text: 'You remember a room, a screen, a date twenty-six years out, and the sensation of standing up. Nothing before it.',
    confidence: 'LOW',
  },
]

export const recallConfig: z.input<typeof RecallConfigSchema> = {
  costPerUse: 9,
  integrityFloor: 24,
  degradeBelow: 78,
  fractureBelow: 52,
  driftSuffix: '\n\nSomething about this has moved since you last checked it.',
  fractureSuffix: ' You are holding two incompatible versions of this and both feel like yours.',
  noMatchText: 'No recollection. You may never have known this, or you may have spent it.',
  shiftPerUse: 1,
}
