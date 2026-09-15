import type { z } from 'zod'
import type { MysterySchema } from '@/engine/mystery-schema'

/**
 * THE SESSION MIRROR — the first mystery, and the one that teaches the machinery.
 *
 * A case volume is supposed to be a closed thing: sources in, findings out, nothing else. The
 * process table on the workstation lists one line that is not part of that — a mirror pointed at
 * a peer nobody assigned. It is not a clue about Daniel Mercer. It is a fact about the machine
 * the investigator is sitting at, and the case never mentions it.
 *
 * The layers separate the way the editorial framework asks. What is real is only the shape it
 * borrows: session mirroring is an ordinary forensic and enterprise practice, and it is
 * genuinely ambiguous whether an instance of it is oversight or supervision. Everything
 * else — the peer, the ring of volumes, what is on the other end — is invented.
 *
 * It costs no signal. A player should meet the machinery before they meet the relay.
 */
export const sessionMirror: z.input<typeof MysterySchema> = {
  id: 'session-mirror',
  title: 'The Session Mirror — the workstation is reporting somewhere, and no case said so',

  legal: {
    mode: 'fictionalized',
    realPersons: false,
    copiedAssets: false,
    structuralInspiration:
      'session mirroring and remote supervision on managed forensic workstations, where the same mechanism is used for quality assurance and for monitoring',
    sources: [],
    reviewed: false,
  },

  /**
   * Conditioned on what the investigator did, not on anything they observed off the open web.
   * A player reaches this by being curious about their own machine.
   */
  timelineDependency: 'T2',
  signalCost: 0,

  unlock: {
    all: [
      // Found by running `ps` and wondering, not by a marker. Nothing points at this line.
      { kind: 'beat', beat: 'statement' },
    ],
    any: [
      // Either they got into a device and noticed the workstation logging it…
      { kind: 'deviceUnlocked', deviceId: 'dev-phone' },
      // …or they were loud enough that somebody would have had a reason to look.
      { kind: 'exposureAtLeast', value: 20 },
    ],
  },

  setsFlags: ['mirrorSeen'],

  global: {
    // No single investigation can hold them all. Somebody has to compare notes with a stranger.
    fragmentsRequired: 7,
    resolution:
      'The peer stops answering. Every investigator whose workstation carried the mirror finds the same line gone from the process table, and a file in the case volume that no client submitted.',
  },

  leavesOpen:
    'A case volume is a closed thing and this one is not. Something was reading over the investigator’s shoulder for the whole session, it was doing so before the client walked in, and nothing in the case explains who assigned it.',
}
