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

  pinLabel: 'KEEP THIS LINE',
  pinnedLabel: 'kept',
}
