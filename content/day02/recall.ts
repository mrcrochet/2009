import type { z } from 'zod'
import type { MemorySchema, RecallConfigSchema } from '@/engine/content-schema'

type MemoryInput = z.input<typeof MemorySchema>

/**
 * The library on the second morning.
 *
 * It is shorter than yesterday's, and that is the day's largest single piece of authoring. Eight
 * of the twenty entries the player could reach on the fifteenth are not here: the software
 * company that stayed flat, the red envelopes, the blue bar, the short public messages, the
 * machine you type a question into, the two companies starting in rooms this size, the metals,
 * and — this is the one that will hurt — video in a page without a plugin, which is the only
 * thing Lea Voss has.
 *
 * Nothing announces the loss. The player asks the same question they asked yesterday and the
 * machine says it may never have known, or they may have spent it, and both of those are true
 * and neither is checkable. That is the whole mechanic, and it costs no code to escalate.
 *
 * What survives has moved. Yesterday Apple was a certainty; today it is a certainty with a
 * caveat attached, and the caveat is not one the player put there.
 */
export const memories: MemoryInput[] = [
  {
    id: 'mem-apple',
    keys: ['apple', 'aapl', 'iphone', 'mac'],
    text: 'Eighty-something dollars, and it goes up by an order of magnitude. You were certain of that yesterday and you are certain of it now, which is not the same as remembering it. The split, the tablet, the order of the two — still nothing.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-google',
    keys: ['google', 'goog', 'search engine', 'youtube'],
    text: 'It is already the answer and it stays the answer. The video site it overpaid for last year turns out to be the cheap part. There was a name change in this somewhere and you no longer have either name in the right order.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-amazon',
    keys: ['amazon', 'amzn', 'aws', 'cloud', 'server rental'],
    text: 'Books now, everything later, and the money is in renting out computers. That part is running today. You are sure of the shape of it and you have stopped being sure you could explain why.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-bitcoin',
    keys: ['bitcoin', 'btc', 'crypto', 'satoshi', 'e-cash'],
    text: 'Eight days old. Worth nothing, traded by almost nobody, and there is no place to buy it even if you wanted to. A number with a great many zeros, a hard drive in a landfill, and no year attached to either.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-ev',
    // No bare `electric` and no `ev`: the first swallows a player asking about electronics and
    // the second matches every query containing "seven", "never" or "evidence".
    keys: ['electric car', 'tesla', 'battery', 'car company'],
    text: 'One of them ends up worth more than every other carmaker put together. It is not public and will not be for years. You still remember the man’s name better than the company’s, and today you are not certain of the man’s.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-crash',
    keys: ['housing', 'mortgage', 'real estate', 'recession', 'market bottom', 'djia', 'dow'],
    text: 'Not over. March is the floor. You are standing in the worst quarter of it and everyone around you thinks the worst quarter was the last one.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-election',
    keys: ['obama', 'president', 'election', 'inauguration', 'white house'],
    text: 'Tuesday. Four days. You remember the cold and the size of the crowd and not one sentence of what was said, which seemed careless of you at the time and seems like something else now.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-superbowl',
    keys: ['super bowl', 'superbowl', 'football', 'steelers', 'cardinals', 'sports', 'betting'],
    text: 'The first of February, sixteen days out. Pittsburgh, on a catch in the corner with under a minute left. You would put money on the catch. The number is the only part that pays and the number is not there.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-pandemic',
    keys: ['covid', 'pandemic', 'virus', 'swine flu', 'h1n1', 'quarantine', 'lockdown'],
    text: 'A small one this spring that frightens people and does less than they fear. A large one eleven years out that stops everything. You remember the second from inside one room and you remember exactly how long.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-freehosts',
    keys: ['geocities', 'free host', 'angelfire', 'tripod', 'web host', 'hosting', 'geohost'],
    text: 'The free hosts die this year. Announced in the spring, switched off in the autumn, seven million pages with it. In the last weeks people copy strangers’ homepages onto their own drives, and it turns out that was the only archive anybody made.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-liens',
    keys: ['storage', 'auction', 'lien', 'storage unit', 'self storage', 'bid'],
    text: 'A room full of somebody’s furniture sold on a bid from the doorway. It is ordinary this year and in a few years there is a television programme about it, which is how you know how ordinary it became. Nothing in the memory tells you what is in any particular unit.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-forgery',
    keys: ['signature', 'forgery', 'identity theft', 'stolen identity', 'specimen'],
    text: 'You know what the words mean. You know how the crime is generally done, in the way anybody who has read a newspaper knows. About this card, this account, this bank and this morning you have nothing at all.',
    confidence: 'NONE',
  },
  {
    id: 'mem-lottery',
    keys: ['lottery', 'powerball', 'jackpot', 'numbers', 'mega millions', 'scratch ticket'],
    text: 'Nothing. Not one number, from any draw, in any year. You watched them the way everyone watches them, which is to say you never once needed to keep them.',
    confidence: 'NONE',
  },
  {
    id: 'mem-aion',
    keys: [
      'aion',
      'quota',
      'rask',
      'owen',
      'meridian',
      'halcyon',
      'marc',
      'deleon',
      'voss',
      'moran',
      'morrison',
    ],
    text: 'Nothing. Not the company, not the bank, not the street, not the two names in the newspaper, not the man who is not answering his telephone. You have no memory of any of this from any year, and the list of things it covers got longer overnight.',
    confidence: 'NONE',
  },
  {
    id: 'mem-self',
    keys: ['2026', 'future', 'myself', 'who am i', 'home'],
    text: 'A room, a screen, a date seventeen years out, and standing up. Yesterday there was also a window in it. Today there is not, and you cannot tell whether the window was ever there or whether you built it on the fifteenth to have something to hold.',
    confidence: 'LOW',
  },
]

/**
 * Harsher on every axis, and the harshness is felt on the first lookup rather than the fifth.
 *
 * `memoryIntegrity` does not refill overnight — that is the premise of the whole mechanic — so a
 * player who spent three retrievals yesterday arrives at 73 and is already under `degradeBelow`.
 * Their first question this morning comes back a step less certain than the same question did on
 * Thursday, before they have paid anything for it.
 *
 * Day 01: 9 per use, floor 24, degrade under 78, fracture under 52, one shift per use.
 */
export const recallConfig: z.input<typeof RecallConfigSchema> = {
  costPerUse: 13,
  integrityFloor: 18,
  degradeBelow: 84,
  fractureBelow: 60,
  driftSuffix: '\n\nThis is not what it said yesterday and you cannot say which part moved.',
  fractureSuffix:
    ' There are two of these now. Both are in your handwriting and neither is crossed out.',
  noMatchText:
    'No recollection. Either you never had this, or you had it yesterday and it is gone, and there is no way from inside your own head to tell those two apart.',
  shiftPerUse: 2,
}
