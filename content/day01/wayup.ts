import type { z } from 'zod'
import type { WayUpConfigSchema } from '@/engine/content-schema'

/**
 * The Way Up Machine, in the words of a machine that has no words for it.
 *
 * Everything the relay console says is here rather than in a component, for the same reason
 * every other screen's copy is: the moment one line of this is written in TypeScript, the
 * console starts sounding like software from 2026 describing 2026, and the whole effect of a
 * beige computer straining at something it was never built for is gone.
 *
 * The register is a Unix daemon's. It reports carrier and bytes and refusals. It never says
 * "the future", never says "2026", and never explains itself — because it does not know.
 */
export const wayup: z.input<typeof WayUpConfigSchema> = {
  /*
   * Four questions and six pages, at the outside, and only if the player spends nothing on a
   * mystery — those are priced separately, from S0 to S12, and one of them eats half a day.
   * Reaching forward is not a search engine.
   */
  signalBudget: 24,
  searchCost: 1,
  openCost: 2,

  title: 'qlmux — attached',
  subtitle: 'carrier present · nine registered · one listening',
  queryLabel: 'send:',
  submitLabel: 'TRANSMIT',

  signalTemplate: 'signal {{left}} of {{budget}}',
  capturedTemplate: 'received {{when}} · {{bytes}} bytes · via {{provider}}',

  offlineTitle: 'no carrier',
  offlineBody:
    'The listener is attached and nothing is answering. There is no index on this side of the line — only the address, and an address is not a conversation. Try again when somebody is awake.',

  offlineDial:
    'It will still carry an address, if you give it one whole. Type the host and the path into the same field, and it will dial rather than ask.',

  exhausted:
    'The line is quiet. Whatever budget this machine has for reaching that way, it has spent it today, and it does not explain how it knows.',

  emptyResults: 'Nothing came back. That is not the same as nothing being there.',

  /**
   * A refusal is the console being careful, and the console is right to be. Each is written as
   * something a 2009 daemon would print, and none of them tells the player what they were nearly
   * allowed to do.
   */
  refusals: {
    scheme: 'qlmux: unsupported transport. the line carries documents, nothing else.',
    credentials: 'qlmux: refused — the address carried a name and a password. it will not do that.',
    'private-address': 'qlmux: refused — that address is inside this building.',
    'metadata-endpoint': 'qlmux: refused — that address answers to the machine, not to you.',
    'own-origin': 'qlmux: refused — you are asking the line to fetch the line.',
    'redirect-loop': 'qlmux: the far end keeps handing this back to itself.',
    'too-many-redirects': 'qlmux: too many forwardings. gave up.',
    'content-type': 'qlmux: whatever that is, it is not a document.',
    'too-large': 'qlmux: too large to hold. the buffer on this machine is from 2007.',
    timeout: 'qlmux: no answer in time. the far end is a long way away.',
    unresolvable: 'qlmux: that host does not resolve. it may not exist yet.',
    network: 'qlmux: the other side did not answer.',
  },
  fallbackRefusal: 'qlmux: refused. no reason given, which is itself a reason.',

  /*
   * Signal buys the looking. This is the price of the carrying: one notch of drift for every
   * sentence brought back, and no heat — nobody is watching the line yet.
   */
  keepShift: 1,
  keepHeat: 0,

  docLabel: 'the document, line by line',
  keptHeading: 'BROUGHT BACK',
  keptNote:
    'These are not evidence. Nothing you can show anyone in 2009 begins in a year nobody has reached, and a claim that rests on one is a claim you cannot make. You know it anyway.',
  keptDeed:
    'You wrote down {{count}} things that have not happened, on a machine that is not yours.',

  pinLabel: 'KEEP THIS LINE',
  pinnedLabel: 'kept',

  /*
   * The rest of the console's vocabulary. The rule is the same as everything above it: if the
   * player can read it — or hear it read out — it is written here, in the voice of a process
   * that reports carrier and bytes and has no idea what it is touching.
   */
  closeLabel: 'detach the listener',
  backLabel: 'back to what came back',
  resultsLabel: 'came back:',
  linksLabel: 'this document names further addresses:',
  working: 'sending. the far end is not close.',
  costTemplate: 'opening this costs {{cost}}',
  pinHint: 'mark a line in the document first. this machine will not decide which line matters.',
  rateLimited: 'qlmux: too fast for the line. {{seconds}} seconds before it will carry again.',
}
