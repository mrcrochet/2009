import type { z } from 'zod'
import type { MysterySchema } from '@/engine/mystery-schema'

/**
 * THE DEAD CITY — the first mystery, and the one that anchors the season in real history.
 *
 * A scheduling fact drove the whole design. GeoCities really did die in 2009: Yahoo announced
 * the closure on 23 April and the sites were deleted on 26 October. Season 1 runs from 15
 * January to roughly 14 February — so the real event falls entirely *outside* the window the
 * player is standing in. It cannot be watched happening.
 *
 * That turns out to be better than watching it. The player is from 2026 and can Recall that the
 * free hosts die this year, months before anyone in 2009 has been told. What they act on is not
 * news; it is foreknowledge, which is the whole premise of the game.
 *
 * So the layers separate cleanly, exactly as the editorial framework asks:
 *   - the real closure is a **fact**, cited, unmodified, reachable through Recall;
 *   - `geohost.com` is **ours**, and it dies on our schedule, inside the season.
 *
 * The player who paid attention in January knows what is coming to a place nobody is watching.
 */
export const deadCity: z.input<typeof MysterySchema> = {
  id: 'dead-city',
  title: 'The Dead City — a web quarter goes dark, and something in it was pointed at you',

  legal: {
    // The playable mystery — the host, the pages, the eye, the ring — is invented. What is real
    // is only the historical fact underneath it, and that fact is not bent to fit.
    mode: 'fictionalized',
    realPersons: false,
    copiedAssets: false,
    structuralInspiration:
      'the 2009 shutdown of a large free web host, and the volunteer archiving that raced it',
    sources: [
      'https://en.wikipedia.org/wiki/Yahoo!_GeoCities',
      'https://wiki.archiveteam.org/index.php/GeoCities',
    ],
    reviewed: false,
  },

  // Conditioned on divergence: which pages survive depends on what the player chose to keep.
  // Not T3 — this mystery needs no observation of 2026 to run, which is deliberate for the
  // first one. A player should meet the machinery before they meet the relay.
  timelineDependency: 'T2',
  signalCost: 0,

  unlock: {
    all: [
      // Found by browsing, not by a marker. The GIF is on a page about model trains.
      { kind: 'visitedUrl', url: 'geohost.com/Terminal/4417' },
    ],
    any: [
      // Either they recognised the eye from Aion's own site…
      { kind: 'evidence', evidenceId: 'e10' },
      // …or they came back to it after the timeline had already started moving under them.
      { kind: 'temporalShiftAtLeast', value: 2 },
    ],
  },

  setsFlags: ['deadCitySeen'],

  global: {
    // No timeline can hold nine quarters. Someone has to compare notes with a stranger.
    fragmentsRequired: 9,
    resolution:
      'The webring closes. Every player who visits any surviving page finds the same new link in it, pointing at a quarter that was never indexed.',
  },

  leavesOpen:
    'Somebody built a ring of ordinary pages and put the same mark on all of them, years before Aion registered a domain. The pages are about model trains, wedding photographs and a fan club. Nobody has explained what a ring is for.',
}
