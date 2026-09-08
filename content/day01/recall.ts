import type { z } from 'zod'
import type { MemorySchema, RecallConfigSchema } from '@/engine/content-schema'

type MemoryInput = z.input<typeof MemorySchema>

/**
 * A closed, authored memory library. Recall resolves against this and nothing else — it never
 * generates a historical outcome that is not written here.
 *
 * Two rules govern what goes in. Future knowledge is texture and temptation, never a cheat
 * sheet: the entries that would pay out are the ones that withhold the number. And a memory the
 * player wants and cannot have is worth more than one they get, so NONE is a real answer.
 */
export const memories: MemoryInput[] = [
  {
    id: 'mem-apple',
    keys: ['apple', 'aapl', 'iphone', 'jobs', 'mac'],
    text: 'Apple is at eighty-something dollars this month. You are certain it goes up by an order of magnitude. You cannot remember whether the split came before or after the first tablet.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-google',
    keys: ['google', 'goog', 'search engine', 'youtube', 'alphabet'],
    text: 'The search company. It is already the answer and it stays the answer. It bought a video site last year for more than anyone thought a video site could be worth, and that turns out to be the cheap part. At some point it changes its name and you cannot remember to what.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-microsoft',
    keys: ['microsoft', 'msft', 'windows', 'office'],
    text: 'Flat for ten years, and everyone here thinks that is the end of the story. The money is not in the operating system. It is in renting out computers, the same as the other one, and they arrive second and do very well anyway.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-amazon',
    keys: ['amazon', 'amzn', 'aws', 'cloud', 'server rental'],
    text: 'Books now, everything later, and the profitable part is renting out computers. That part is already running and almost nobody has noticed.',
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
    id: 'mem-bitcoin',
    keys: ['bitcoin', 'btc', 'crypto', 'satoshi', 'e-cash'],
    text: 'A currency with no issuer. It exists already — seven days old, worth nothing, traded by almost no one. You remember a number that ends in a lot of zeros and a story about a hard drive in a landfill.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-social',
    keys: ['facebook', 'social', 'myspace', 'social network'],
    text: 'The one with the blue bar wins. The one you are on right now does not. There is a lawsuit about who wrote it.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-twitter',
    keys: ['twitter', 'microblog', 'tweet'],
    text: 'Short public messages. No subject line, no reply expected. It is two years old and nobody can explain what it is for. It becomes how news arrives before anyone decides that was a good idea, and then it changes its name to a single letter.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-ai',
    keys: [
      'artificial intelligence',
      'chatgpt',
      'openai',
      'machine learning',
      'neural network',
      'chatbot',
      'language model',
    ],
    text: 'A machine you type a question into and it answers in sentences. There is nothing like it here and nothing close to it for years. It arrives about fourteen years out and it arrives all at once. Afterwards you cannot remember what looking something up used to feel like.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-private',
    keys: ['airbnb', 'uber', 'rideshare', 'venture capital', 'sharing economy'],
    text: 'Two of them start this year, in rooms about the size of this one. One rents out a spare bed. One is a car that comes when you press a button. Neither sells you anything you can buy — not now, not for ten years, and by the time you can, the price has been set by people who were already rich.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-crash',
    keys: [
      'housing',
      'mortgage',
      'real estate',
      'crash',
      'recession',
      'market bottom',
      'djia',
      'dow jones',
      'dow',
    ],
    text: 'It is not over. March is the floor. You are inside the worst quarter of it right now.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-metals',
    keys: ['gold price', 'oil price', 'commodities', 'silver', 'inflation', 'oil'],
    text: 'Gold roughly doubles inside three years, and everyone who told you to buy it was right for the wrong reason. Oil does something stranger first. You do not remember the order, and the order is the part that matters.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-election',
    keys: ['obama', 'president', 'election', 'inauguration', 'white house'],
    text: 'He is sworn in on the twentieth. Five days. You remember the cold, and the size of the crowd, and almost nothing that was said.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-pandemic',
    keys: ['covid', 'pandemic', 'virus', 'swine flu', 'h1n1', 'quarantine', 'lockdown'],
    text: 'Twice. A small one this spring that frightens people and then does not do what they feared. And one eleven years out that stops everything for a year. You remember the second one from inside a room, and you remember exactly how long you were in it.',
    confidence: 'HIGH',
  },
  {
    id: 'mem-superbowl',
    keys: ['super bowl', 'superbowl', 'football', 'steelers', 'cardinals', 'sports', 'betting'],
    text: 'The first of February. Pittsburgh, by a catch in the corner of the end zone with under a minute left. You are certain about the catch. You are not certain about the number, and the number is the only part that would pay.',
    confidence: 'MEDIUM',
  },
  {
    id: 'mem-lottery',
    keys: ['lottery', 'powerball', 'jackpot', 'numbers', 'mega millions', 'scratch ticket'],
    text: 'Nothing. Not one number, from any draw, in any year. You watched them the way everyone watches them, which is to say you never once needed to keep them.',
    confidence: 'NONE',
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
    text: 'You remember a room, a screen, a date seventeen years out, and the sensation of standing up. Nothing before it.',
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
