import type { z } from 'zod'
import type { BrowserConfigSchema } from '@/engine/content-schema'

/**
 * A closed 2009 internet. No page here reaches the real network, and the index only knows what
 * exists inside this simulation.
 *
 * It is a *web*: every site has a front page, sites link to each other, and the Corvid directory
 * is the way in when the player does not know what to search for. Pages carry `variants` keyed on
 * temporal shift — the same URL resolves to different text once the player has moved the timeline
 * far enough.
 */
export const browser: z.input<typeof BrowserConfigSchema> = {
  home: 'corvid.com',
  engineName: 'CORVID',
  emptyResults:
    'Your search did not match any documents.\nTry different keywords. Remember: this index only knows what exists now.',
  directoryUrl: 'corvid.com/directory',
  directoryLabel: 'Browse the Corvid Directory',
  notFoundTitle: 'The page cannot be displayed',
  notFoundBody:
    'The site you are looking for could not be found. It may be down. It may not exist yet.\n\nCheck the address, search from the Corvid home page, or browse the directory.',
  bookmarks: [
    { label: 'Corvid', url: 'corvid.com' },
    { label: 'Directory', url: 'corvid.com/directory' },
    { label: 'Meridian', url: 'meridiansavings.com' },
    { label: 'TradePost', url: 'tradepost.com' },
    { label: 'The Register', url: 'columbia-register.com' },
    // Left in this machine's bookmarks by whoever set it up.
    { label: 'aion-group.com', url: 'aion-group.com' },
  ],
  pages: [
    // ---------------------------------------------------------------- Corvid
    {
      url: 'corvid.com/directory',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Corvid Directory', ink: '#1f4e79' },
        { kind: 'sub', text: 'A catalogue of the web, sorted by hand · 14,206 sites listed' },
        { kind: 'rule' },
        { kind: 'subheading', text: 'News & Media', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [
            { label: 'The Columbia Register', url: 'columbia-register.com' },
            { label: 'nullcache', url: 'nullcache.org' },
          ],
        },
        { kind: 'subheading', text: 'Money & Banking', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [
            { label: 'Meridian Savings & Loan', url: 'meridiansavings.com' },
            { label: 'Namewell — domain registration', url: 'namewell.com' },
          ],
        },
        { kind: 'subheading', text: 'Classifieds', ink: '#7a0f0f' },
        { kind: 'nav', items: [{ label: 'TradePost', url: 'tradepost.com' }] },
        { kind: 'subheading', text: 'Community', ink: '#7a0f0f' },
        { kind: 'nav', items: [{ label: 'Cluster', url: 'cluster.com' }] },
        { kind: 'subheading', text: 'Personal Pages', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [{ label: 'GeoHost — free pages for everyone', url: 'geohost.com/Terminal/4417' }],
        },
        { kind: 'subheading', text: 'Business Services', ink: '#7a0f0f' },
        { kind: 'nav', items: [{ label: 'Aion Group', url: 'aion-group.com' }] },
        { kind: 'rule' },
        {
          kind: 'sub',
          text: 'Suggest a site · Add a category · © 2009 Corvid Inc. All rights reserved.',
        },
      ],
      variants: [],
    },

    // ------------------------------------------------------------- geohost
    // A free host in its last year, though nobody here knows that. Three ordinary pages by
    // three unrelated people, and one thing they have in common.
    {
      url: 'geohost.com/Terminal/4417',
      background: '#ffffcc',
      dark: false,
      blocks: [
        { kind: 'heading', text: "~ DON'S N SCALE PAGE ~", ink: '#000080' },
        {
          kind: 'sub',
          text: 'you are visitor 004417 · last updated 11/22/2007 · best viewed 800x600',
        },
        {
          kind: 'p',
          text: 'Welcome to my page about model railroading in N scale. I have been building the Cascade line for eleven years now. The turntable took two winters.\n\nSign my guestbook before you go!',
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '[image not found: aion_eye_03.gif]\n\nThis ring is a member of the QUIET LINE webring.\n[prev] [next] [random] [list all]',
        },
        {
          kind: 'nav',
          items: [
            { label: '[next]', url: 'geohost.com/Meadow/2210' },
            { label: '[list all]', url: 'geohost.com/ring' },
          ],
        },
      ],
      variants: [],
    },
    {
      url: 'geohost.com/Meadow/2210',
      background: '#ffffff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Karen & Doug — August 14th', ink: '#993366' },
        { kind: 'sub', text: 'our wedding page · 61 photos · thanks for visiting!!' },
        {
          kind: 'p',
          text: 'We put these up so the family in Ohio could see them. Doug says the page is too pink. Doug is wrong.',
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '[image not found: aion_eye_03.gif]\n\nQUIET LINE webring member #2 of 9\n[prev] [next] [random] [list all]',
        },
        {
          kind: 'nav',
          items: [
            { label: '[prev]', url: 'geohost.com/Terminal/4417' },
            { label: '[list all]', url: 'geohost.com/ring' },
          ],
        },
      ],
      variants: [],
    },
    {
      url: 'geohost.com/ring',
      background: '#f0f0f0',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'QUIET LINE — member directory', ink: '#000080' },
        { kind: 'sub', text: '9 members · ring maintained by (no contact given)' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '001  Terminal/4417 — model railroading\n002  Meadow/2210 — wedding photographs\n003  (page removed by owner)\n004  (page removed by owner)\n005  (page removed by owner)\n006  (page removed by owner)\n007  (page removed by owner)\n008  (page removed by owner)\n009  (page removed by owner)',
        },
        {
          kind: 'p',
          text: 'To join this ring, place the ring graphic on your page. There is no application. There is no owner listed. The graphic has been served from the same address since 1998.',
        },
        { kind: 'evidence', evidenceId: 'e11' },
      ],
      variants: [],
    },

    // ------------------------------------------------------------- TradePost
    {
      url: 'tradepost.com',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost', ink: '#7a0f0f' },
        { kind: 'sub', text: 'free classified ads · no fees · meet in public · portland metro' },
        { kind: 'rule' },
        { kind: 'subheading', text: 'Portland / Vancouver', ink: '#1f4e79' },
        {
          kind: 'nav',
          items: [
            { label: 'electronics', url: 'tradepost.com/pdx/electronics' },
            { label: 'furniture', url: 'tradepost.com/pdx/furniture' },
            { label: 'jobs', url: 'tradepost.com/pdx/jobs' },
            { label: 'housing', url: 'tradepost.com/pdx/housing' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'TradePost is run by two people and a server in a closet. Do not wire money to anyone. Do not meet at their house. If a deal seems too good, somebody has not looked closely enough.',
        },
      ],
      variants: [],
    },
    {
      url: 'tradepost.com/pdx/electronics',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost — Portland / electronics', ink: '#7a0f0f' },
        { kind: 'sub', text: 'posted today · 4 items · flag as spam' },
        {
          kind: 'nav',
          items: [
            { label: 'all of portland', url: 'tradepost.com' },
            { label: 'furniture', url: 'tradepost.com/pdx/furniture' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'listing',
          title: 'Nokora N90 — unlocked, boxed',
          price: '$60',
          location: 'SE Portland · cash only',
          text: 'Company gave it to my brother, he never used it. No idea what it is worth. Screen is like a little computer. Comes with the charger and a paper manual.',
          action: 'buy',
          itemId: 'tradepost-n90',
        },
        {
          kind: 'listing',
          title: 'Sony CRT television 27"',
          price: '$25',
          location: 'Gresham · you haul',
          text: 'Works. Heavy. Bring two people and a truck.',
          action: 'none',
          itemId: null,
        },
        {
          kind: 'listing',
          title: 'Box of laptop parts — untested',
          price: '$40',
          location: 'Beaverton · cash only',
          text: 'Cleaning out a storage unit. Might be nothing. Might be a whole machine in there. I am not driving it anywhere.',
          action: 'buy',
          itemId: 'tradepost-parts',
        },
        {
          kind: 'listing',
          title: 'Snowboard, 158cm',
          price: '$140',
          location: 'Hillsboro',
          text: 'Ridden two seasons. Bindings included.',
          action: 'none',
          itemId: null,
        },
      ],
      variants: [],
    },
    {
      url: 'tradepost.com/pdx/furniture',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost — Portland / furniture', ink: '#7a0f0f' },
        { kind: 'sub', text: 'posted this week · 2 items' },
        { kind: 'nav', items: [{ label: 'all of portland', url: 'tradepost.com' }] },
        { kind: 'rule' },
        {
          kind: 'listing',
          title: 'Desk, particle board',
          price: '$15',
          location: 'SE Portland',
          text: 'One drawer sticks. Moving out of the apartment on the 20th, must go before then.',
          action: 'none',
          itemId: null,
        },
        {
          kind: 'listing',
          title: 'Filing cabinet, two drawer, locking',
          price: '$30',
          location: 'SE Morrison',
          text: 'Key included. Came from an office that closed in December.',
          action: 'none',
          itemId: null,
        },
      ],
      variants: [],
    },
    {
      url: 'tradepost.com/pdx/jobs',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost — Portland / jobs', ink: '#7a0f0f' },
        { kind: 'sub', text: '3 posts · January 2009' },
        { kind: 'nav', items: [{ label: 'all of portland', url: 'tradepost.com' }] },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'WAREHOUSE, SWING SHIFT — $9.25/hr, no experience. Apply in person.\n\nDATA ENTRY, TEMP — three weeks, $11/hr. Must type 50wpm.\n\nRECOVERY AGENT — discreet. Own vehicle. Flexible hours, generous per-file rate. Inquiries to settlements@aion-group.com.',
        },
        {
          kind: 'p',
          text: 'Showing 3 of 3. Archive: October 2008 — 41 posts.',
        },
      ],
      variants: [],
    },
    {
      url: 'tradepost.com/pdx/housing',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost — Portland / housing', ink: '#7a0f0f' },
        { kind: 'sub', text: '61 posts · 19 marked bank owned' },
        { kind: 'nav', items: [{ label: 'all of portland', url: 'tradepost.com' }] },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'STUDIO, SE — $475/mo, first month free.\nTWO BED, INNER SE — $690/mo, will negotiate.\nHOUSE, ST JOHNS — $1,100/mo. Bank owned. Available immediately.',
        },
      ],
      variants: [],
    },

    // ------------------------------------------------------ Columbia Register
    {
      url: 'columbia-register.com',
      background: '#fbfbf5',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'The Columbia Register', ink: '#1a1a1a' },
        { kind: 'sub', text: 'Portland, Oregon · Thursday, 15 January 2009 · 50 cents' },
        {
          kind: 'nav',
          items: [
            { label: 'Business', url: 'columbia-register.com/business' },
            { label: 'Obituaries', url: 'columbia-register.com/obits' },
            { label: 'Classifieds', url: 'tradepost.com' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'STATE JOBLESS RATE REACHES 9.9 PERCENT — the highest since 1983. The governor called the figure “a floor we have not found yet.”',
        },
        { kind: 'rule' },
        {
          kind: 'link',
          label: 'Portland developer to demo plugin-free video at Ace Hotel',
          url: 'columbia-register.com/business',
          note: 'Business · today',
          opensApp: null,
        },
        {
          kind: 'link',
          label: 'Obituaries — December 2008',
          url: 'columbia-register.com/obits',
          note: 'Archive',
          opensApp: null,
        },
        { kind: 'rule' },
        { kind: 'sub', text: 'Subscribe · Place an ad · Archives back to 1994' },
      ],
      variants: [
        {
          minShift: 2,
          blocks: [
            { kind: 'heading', text: 'The Columbia Register', ink: '#1a1a1a' },
            { kind: 'sub', text: 'Portland, Oregon · Thursday, 15 January 2009 · 50 cents' },
            {
              kind: 'nav',
              items: [
                { label: 'Business', url: 'columbia-register.com/business' },
                { label: 'Obituaries', url: 'columbia-register.com/obits' },
                { label: 'Classifieds', url: 'tradepost.com' },
              ],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'STATE JOBLESS RATE REACHES 9.9 PERCENT — the highest since 1983. The governor called the figure “a floor we have not found yet.”',
            },
            { kind: 'rule' },
            {
              kind: 'link',
              label: 'Local video startup folds before demo; founder unreachable',
              url: 'columbia-register.com/business',
              note: 'Business · corrected 3 hours ago',
              opensApp: null,
            },
            {
              kind: 'link',
              label: 'Obituaries — December 2008',
              url: 'columbia-register.com/obits',
              note: 'Archive',
              opensApp: null,
            },
            { kind: 'rule' },
            { kind: 'sub', text: 'Subscribe · Place an ad · Archives back to 1994' },
          ],
        },
      ],
    },
    {
      url: 'columbia-register.com/obits',
      background: '#fbfbf5',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Obituaries — December 2008', ink: '#1a1a1a' },
        { kind: 'sub', text: 'The Columbia Register · archived index' },
        {
          kind: 'nav',
          items: [
            { label: 'Front page', url: 'columbia-register.com' },
            { label: 'Business', url: 'columbia-register.com/business' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'link',
          label: 'MORAN, Julia B., 41 — 04 December 2008',
          url: null,
          note: 'no page archived',
          opensApp: null,
        },
        {
          kind: 'link',
          label: 'OKONKWO, Adaeze, 38 — 11 December 2008',
          url: null,
          note: 'no page archived',
          opensApp: null,
        },
        {
          kind: 'link',
          label: 'RASK, Owen T., 34 — 19 December 2008',
          url: 'columbia-register.com/obits/rask',
          note: 'full notice',
          opensApp: null,
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Three notices this month were filed by the same funeral home. None list a service, and none list a survivor.',
        },
      ],
      variants: [],
    },
    {
      url: 'columbia-register.com/obits/rask',
      background: '#fbfbf5',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Obituaries — December 2008', ink: '#1a1a1a' },
        { kind: 'sub', text: 'The Columbia Register · archived page' },
        {
          kind: 'nav',
          items: [
            { label: 'Front page', url: 'columbia-register.com' },
            { label: 'All December notices', url: 'columbia-register.com/obits' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'RASK, Owen T., 34, of Portland, died Friday, December 19, 2008, following a short illness. He was a systems technician. He is survived by no immediate family. At his request there will be no service.',
        },
        {
          kind: 'p',
          text: 'Condolences may be left in the guest book below. (Guest book is empty.)',
        },
        { kind: 'evidence', evidenceId: 'e3' },
      ],
      variants: [],
    },
    {
      url: 'columbia-register.com/business',
      background: '#fbfbf5',
      dark: false,
      blocks: [
        {
          kind: 'heading',
          text: 'Portland developer to demo plugin-free video at Ace Hotel',
          ink: '#1a1a1a',
        },
        { kind: 'sub', text: 'The Columbia Register · Business · 15 January 2009' },
        {
          kind: 'nav',
          items: [
            { label: 'Front page', url: 'columbia-register.com' },
            { label: 'Obituaries', url: 'columbia-register.com/obits' },
            { label: 'Classifieds', url: 'tradepost.com' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'A developer working out of an apartment in Southeast Portland says she has built a way to play short video clips in a web page without additional software. Industry observers were skeptical, noting that few users have expressed interest in watching video in a browser window.',
        },
        {
          kind: 'link',
          label: 'The developer keeps a page on Cluster',
          url: 'cluster.com/leavoss',
          note: 'lea.voss',
          opensApp: null,
        },
      ],
      variants: [
        {
          minShift: 2,
          blocks: [
            {
              kind: 'heading',
              text: 'Local video startup folds before demo; founder unreachable',
              ink: '#1a1a1a',
            },
            { kind: 'sub', text: 'The Columbia Register · Business · corrected 3 hours ago' },
            {
              kind: 'nav',
              items: [
                { label: 'Front page', url: 'columbia-register.com' },
                { label: 'Obituaries', url: 'columbia-register.com/obits' },
                { label: 'Classifieds', url: 'tradepost.com' },
              ],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'A local software project that had been scheduled to demonstrate in-browser video this month has been withdrawn. The developer did not respond to messages. An earlier version of this article named a different company and described a different outcome. We regret the error.',
            },
            {
              kind: 'link',
              label: 'The developer keeps a page on Cluster',
              url: 'cluster.com/leavoss',
              note: 'lea.voss',
              opensApp: null,
            },
            { kind: 'p', text: 'You have read this page before. It did not say this.' },
          ],
        },
      ],
    },

    // ---------------------------------------------------------------- Cluster
    {
      url: 'cluster.com',
      background: '#eef2f6',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Cluster', ink: '#2b5f96' },
        { kind: 'sub', text: 'stay in touch with the people you already know · 41 million people' },
        { kind: 'rule' },
        { kind: 'p', text: 'Find someone by name. Real names only — that is what makes it work.' },
        {
          kind: 'link',
          label: 'lea.voss — Portland, OR',
          url: 'cluster.com/leavoss',
          note: '41 friends · updated today',
          opensApp: null,
        },
        {
          kind: 'link',
          label: 'm.deleon — Portland, OR',
          url: 'cluster.com/mdeleon',
          note: '3 friends · updated December',
          opensApp: null,
        },
        { kind: 'rule' },
        { kind: 'sub', text: 'Privacy · Terms · Cluster is free and always will be.' },
      ],
      variants: [],
    },
    {
      url: 'cluster.com/leavoss',
      background: '#eef2f6',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Cluster — lea.voss', ink: '#2b5f96' },
        { kind: 'sub', text: 'Portland, OR · 41 friends · last updated today, 04:12' },
        {
          kind: 'nav',
          items: [
            { label: 'Cluster home', url: 'cluster.com' },
            { label: 'm.deleon', url: 'cluster.com/mdeleon' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '04:12 — someone has been parked outside my building for two nights. same car. i am writing this here so it is written somewhere.',
        },
        {
          kind: 'p',
          text: '11 Jan — demo works in three browsers. it does not work in the one everybody uses.',
        },
        { kind: 'p', text: '02 Jan — new year, same four months of runway.' },
        { kind: 'evidence', evidenceId: 'e9' },
      ],
      variants: [
        {
          // She wrote it down harder, because you told her to.
          whenFlag: 'leaPostedAgain',
          blocks: [
            { kind: 'heading', text: 'Cluster — lea.voss', ink: '#2b5f96' },
            { kind: 'sub', text: 'Portland, OR · 41 friends · last updated today, 09:26' },
            {
              kind: 'nav',
              items: [
                { label: 'Cluster home', url: 'cluster.com' },
                { label: 'm.deleon', url: 'cluster.com/mdeleon' },
              ],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: '09:26 — oregon plate, starts with 4. grey sedan, no front plate. second morning i have seen it in daylight. someone told me to write down more than i want to.',
            },
            {
              kind: 'p',
              text: '04:12 — someone has been parked outside my building for two nights. same car. i am writing this here so it is written somewhere.',
            },
            {
              kind: 'p',
              text: '11 Jan — demo works in three browsers. it does not work in the one everybody uses.',
            },
            { kind: 'evidence', evidenceId: 'e9' },
          ],
        },
        {
          // And here is what advice costs. The post is gone, and with it the only public record
          // that any of this happened — including the piece the player needed.
          whenFlag: 'leaPostRemoved',
          blocks: [
            { kind: 'heading', text: 'Cluster — lea.voss', ink: '#2b5f96' },
            { kind: 'sub', text: 'Portland, OR · 41 friends · last updated today, 09:26' },
            {
              kind: 'nav',
              items: [
                { label: 'Cluster home', url: 'cluster.com' },
                { label: 'm.deleon', url: 'cluster.com/mdeleon' },
              ],
            },
            { kind: 'rule' },
            { kind: 'p', text: '04:12 — (post removed by author)' },
            {
              kind: 'p',
              text: '11 Jan — demo works in three browsers. it does not work in the one everybody uses.',
            },
            { kind: 'p', text: '02 Jan — new year, same four months of runway.' },
            {
              kind: 'p',
              text: 'You read this page before there was nothing on it about a car.',
            },
          ],
        },
      ],
    },
    {
      url: 'cluster.com/mdeleon',
      background: '#eef2f6',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Cluster — m.deleon', ink: '#2b5f96' },
        { kind: 'sub', text: 'Portland, OR · 3 friends · last updated 22 December 2008' },
        {
          kind: 'nav',
          items: [
            { label: 'Cluster home', url: 'cluster.com' },
            { label: 'lea.voss', url: 'cluster.com/leavoss' },
          ],
        },
        { kind: 'rule' },
        { kind: 'p', text: '22 Dec — new job. cant say much about it. pays weekly, cash.' },
        { kind: 'p', text: '02 Dec — anybody know somebody hiring' },
        {
          kind: 'p',
          text: 'Friends: lea.voss · o.rask · (1 private, added 11 Dec)',
        },
      ],
      variants: [],
    },

    // -------------------------------------------------------------- nullcache
    {
      url: 'nullcache.org',
      background: '#0f1216',
      dark: true,
      blocks: [
        { kind: 'heading', text: 'nullcache', ink: '#8fb6d4' },
        { kind: 'sub', text: 'no accounts · no logs · no names · you were never here' },
        { kind: 'rule' },
        {
          kind: 'link',
          label: '› general › “anyone else lose a week?”',
          url: 'nullcache.org/thread/3312',
          note: '12 replies · last post 09 Jan 2009',
          opensApp: null,
        },
        {
          kind: 'link',
          label: '› general › “dumping ground for weird collection letters”',
          url: 'nullcache.org/thread/3290',
          note: '48 replies · last post 13 Jan 2009',
          opensApp: null,
        },
        { kind: 'rule' },
        { kind: 'p', text: 'Board rules: one. Do not use your real name. That is the whole list.' },
      ],
      variants: [],
    },
    {
      url: 'nullcache.org/thread/3312',
      background: '#0f1216',
      dark: true,
      blocks: [
        {
          kind: 'heading',
          text: 'nullcache › general › “anyone else lose a week?”',
          ink: '#8fb6d4',
        },
        { kind: 'sub', text: '12 replies · last post 09 Jan 2009' },
        {
          kind: 'nav',
          items: [
            { label: 'board index', url: 'nullcache.org' },
            { label: 'previous thread', url: 'nullcache.org/thread/3290' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '>> 3312  anon\nwoke up tuesday and it was tuesday but the whole apartment was someone elses. bank card in a name thats not mine and it works. am i insane',
        },
        {
          kind: 'p',
          text: '>> 3319  anon\nhappened to a guy on here in november. he stopped posting. dont use your real name and dont pay them',
        },
        {
          kind: 'p',
          text: '>> 3327  anon\nthirty days is the number they always give. thats all i will say',
        },
      ],
      variants: [],
    },
    {
      url: 'nullcache.org/thread/3290',
      background: '#0f1216',
      dark: true,
      blocks: [
        {
          kind: 'heading',
          text: 'nullcache › general › “dumping ground for weird collection letters”',
          ink: '#8fb6d4',
        },
        { kind: 'sub', text: '48 replies · last post 13 Jan 2009' },
        {
          kind: 'nav',
          items: [
            { label: 'board index', url: 'nullcache.org' },
            { label: 'next thread', url: 'nullcache.org/thread/3312' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '>> 3290  anon\npost the strange ones here. not the normal ones. the ones where the amount is round and the deadline is exactly thirty days',
        },
        {
          kind: 'p',
          text: '>> 3301  anon\nmine said "origin of funds is your problem". no letterhead. no phone number. an address on SE Morrison that is a bank branch',
        },
        {
          kind: 'p',
          text: '>> 3344  anon\nthe morrison address comes up a lot in this thread and nobody wants to say why',
        },
      ],
      variants: [],
    },

    // --------------------------------------------------------------- Meridian
    {
      url: 'meridiansavings.com',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Meridian Savings & Loan', ink: '#1f4e79' },
        { kind: 'sub', text: 'Serving Portland since 1961 · Member FDIC · 4 branches' },
        { kind: 'rule' },
        {
          kind: 'link',
          label: 'Online Banking — sign in',
          url: null,
          note: 'opens the Meridian Savings application on this machine',
          opensApp: 'bank',
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'BRANCHES\n\n1140 SE Morrison St, Portland — Mon–Fri 9:00 a.m. – 5:00 p.m.\n2200 NE Sandy Blvd, Portland — Mon–Fri 9:00 a.m. – 5:00 p.m.\n8814 SW Barbur Blvd, Portland — Mon–Fri 9:00 a.m. – 4:00 p.m.\n404 Main St, Gresham — Mon–Thu 9:00 a.m. – 4:00 p.m.',
        },
        {
          kind: 'p',
          text: 'Accounts may be opened in person at any branch with two forms of identification. Same-day activation available at our SE Morrison location.',
        },
      ],
      variants: [],
    },

    // --------------------------------------------------------------- Namewell
    {
      url: 'namewell.com',
      background: '#fdfdf8',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'NAMEWELL', ink: '#1f4e79' },
        { kind: 'sub', text: 'domain names · hosting · $9.95 a year, no renewal tricks' },
        { kind: 'rule' },
        {
          kind: 'link',
          label: 'Register a domain · check availability · WHOIS lookup',
          url: 'namewell.com/register',
          note: 'instant activation',
          opensApp: null,
        },
        {
          kind: 'p',
          text: 'Nine dollars and ninety-five cents a year. Most of these will never be worth anything. A few of them will be worth more than the company that eventually buys them.',
        },
      ],
      variants: [],
    },
    {
      url: 'namewell.com/register',
      background: '#fdfdf8',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'NAMEWELL — domain registration', ink: '#1f4e79' },
        { kind: 'sub', text: '$9.95 per year · instant activation · WHOIS lookup below' },
        { kind: 'nav', items: [{ label: 'Namewell home', url: 'namewell.com' }] },
        { kind: 'rule' },
        {
          kind: 'listing',
          title: 'shortclip.com',
          price: '$9.95',
          location: 'available',
          text: 'Four syllables, no hyphen. Nobody has asked about this one.',
          action: 'domain',
          itemId: 'shortclip.com',
        },
        {
          kind: 'listing',
          title: 'cloudrent.com',
          price: '$9.95',
          location: 'available',
          text: 'Renting computers by the hour. The listing has sat here since 2006.',
          action: 'domain',
          itemId: 'cloudrent.com',
        },
        {
          kind: 'listing',
          title: 'socialgraph.net',
          price: '$9.95',
          location: 'available',
          text: 'Two words, both of them ordinary. Nobody has looked at this one since it was listed.',
          action: 'domain',
          itemId: 'socialgraph.net',
        },
        { kind: 'rule' },
        { kind: 'subheading', text: 'WHOIS: aion-group.com', ink: '#22262b' },
        {
          kind: 'p',
          text: 'Registered: 11 Dec 2008\nRegistrant: AION GROUP LLC\nAddress: 1140 SE MORRISON ST, PORTLAND OR\nNameservers: ns1.aion-group.com, ns2.aion-group.com',
        },
        {
          kind: 'link',
          label: 'That address is a Meridian Savings branch',
          url: 'meridiansavings.com',
          note: 'branch listing',
          opensApp: null,
        },
        { kind: 'evidence', evidenceId: 'e10' },
      ],
      variants: [],
    },

    // ------------------------------------------------------------- Aion Group
    {
      url: 'aion-group.com',
      background: '#f2f2ee',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'AION GROUP', ink: '#22262b' },
        { kind: 'sub', text: 'Settlements · Recovery · Actuarial' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'This domain is registered and in use. No public information is available.',
        },
        {
          kind: 'p',
          text: 'Correspondence is outbound only. There is no address for replies and no telephone number, and both of those are deliberate.',
        },
      ],
      variants: [],
    },

    // ----------------------------------------------------------- the archive
    {
      url: 'metzdowd.archive/crypto/2009-01',
      background: '#fff',
      dark: false,
      blocks: [
        {
          kind: 'heading',
          text: 'Cryptography mailing list — January 2009 archive',
          ink: '#22262b',
        },
        { kind: 'sub', text: 'plain text · threaded by date · 214 messages' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '[Subject]  Bitcoin v0.1 released\n[Date]     Thu, 08 Jan 2009 14:27:40 -0800\n\nAnnouncing the first release of a new electronic cash system that uses a peer-to-peer network to prevent double-spending. It is completely decentralized with no server or central authority.\n\nThe software is still alpha and experimental. There is no exchange rate because there is no exchange.',
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '>> Re: Bitcoin v0.1 released\nFri, 09 Jan 2009 08:02:14 -0500\n\nHow does this scale if every node keeps every transaction?\n\n>> Re: Bitcoin v0.1 released\nFri, 09 Jan 2009 11:40:55 -0800\n\nNothing without a government behind it has ever held value. This will not either.',
        },
      ],
      variants: [],
    },
  ],
  index: [
    {
      id: 'idx-directory',
      keys: ['directory', 'browse', 'what is out there', 'index', 'sites', 'catalogue', 'catalog'],
      title: 'Corvid Directory — the web, sorted by hand',
      url: 'corvid.com/directory',
      snippet:
        'A catalogue of the web, sorted by hand. 14,206 sites listed across news, money, classifieds and community.',
      go: 'corvid.com/directory',
      variants: [],
    },
    {
      id: 'idx-tradepost',
      keys: [
        'phone',
        'nokora',
        'sell',
        'flip',
        'tradepost',
        'classified',
        'cash',
        'money',
        'electronics',
      ],
      title: 'TradePost — Portland classifieds — electronics',
      url: 'tradepost.com/pdx/electronics',
      snippet:
        'Free classified ads for the Portland metro area. Electronics posted today. Cash only, meet in public.',
      go: 'tradepost.com/pdx/electronics',
      variants: [],
    },
    {
      id: 'idx-jobs',
      keys: ['job', 'jobs', 'work', 'hiring', 'employment', 'recovery agent'],
      title: 'TradePost — Portland / jobs',
      url: 'tradepost.com/pdx/jobs',
      snippet:
        'Three posts this month. Warehouse swing shift, temporary data entry, and one that does not say what it is.',
      go: 'tradepost.com/pdx/jobs',
      variants: [],
    },
    {
      id: 'idx-geohost',
      keys: ['geohost', 'webring', 'quiet line', 'model railroad', 'free pages', 'homepages'],
      title: 'GeoHost — free pages for everyone',
      url: 'geohost.com/Terminal/4417',
      snippet: 'you are visitor 004417 · last updated 11/22/2007 · best viewed 800x600',
      go: 'geohost.com/Terminal/4417',
      variants: [],
    },
    {
      id: 'idx-obit',
      keys: [
        'owen rask',
        'rask',
        'o. rask',
        'who am i',
        'my name',
        'obituary',
        'obituaries',
        'owen',
      ],
      title: 'Obituaries — December 2008 — The Columbia Register',
      url: 'columbia-register.com/obits/rask',
      snippet:
        'RASK, Owen T., 34, of Portland, died Friday, December 19, 2008, following a short illness…',
      go: 'columbia-register.com/obits/rask',
      variants: [],
    },
    {
      id: 'idx-aion',
      keys: ['aion', 'aion group', 'quota', 'settlement', 'settlements'],
      title: 'AION GROUP',
      url: 'aion-group.com',
      snippet: 'Settlements · Recovery · Actuarial. No public information is available.',
      go: 'aion-group.com',
      variants: [],
    },
    {
      id: 'idx-nullcache',
      keys: [
        'thirty days',
        '30 days',
        'woke up',
        'lost week',
        'time travel',
        'not my apartment',
        'nullcache',
      ],
      title: 'nullcache › “anyone else lose a week?”',
      url: 'nullcache.org/thread/3312',
      snippet: 'woke up tuesday and it was tuesday but the whole apartment was someone elses…',
      go: 'nullcache.org/thread/3312',
      variants: [],
    },
    {
      id: 'idx-letters',
      keys: ['collection letter', 'debt', 'creditor', 'morrison', 'se morrison', '1140'],
      title: 'nullcache › “dumping ground for weird collection letters”',
      url: 'nullcache.org/thread/3290',
      snippet: 'the morrison address comes up a lot in this thread and nobody wants to say why…',
      go: 'nullcache.org/thread/3290',
      variants: [],
    },
    {
      id: 'idx-btc',
      keys: ['bitcoin', 'btc', 'e-cash', 'peer to peer cash'],
      title: 'P2P e-cash — mailing list archive',
      url: 'metzdowd.archive/crypto/2009-01',
      snippet:
        'Announcing the first release of a new electronic cash system that uses a peer-to-peer network…',
      go: 'metzdowd.archive/crypto/2009-01',
      variants: [],
    },
    {
      id: 'idx-lea',
      keys: ['lea', 'voss', 'lea voss', 'cluster', 'video', 'startup'],
      title: 'Cluster — lea.voss',
      url: 'cluster.com/leavoss',
      snippet: 'someone has been parked outside my building for two nights. same car…',
      go: 'cluster.com/leavoss',
      variants: [],
    },
    {
      id: 'idx-marc',
      keys: ['marc', 'deleon', 'marc deleon', 'm.deleon'],
      title: 'Cluster — m.deleon',
      url: 'cluster.com/mdeleon',
      snippet: 'new job. cant say much about it. pays weekly, cash.',
      go: 'cluster.com/mdeleon',
      variants: [],
    },
    {
      id: 'idx-meridian',
      keys: ['meridian', 'meridian savings', 'bank', 'branch', 'banking'],
      title: 'Meridian Savings & Loan',
      url: 'meridiansavings.com',
      snippet:
        'Serving Portland since 1961. Member FDIC. Four branches, including 1140 SE Morrison St.',
      go: 'meridiansavings.com',
      variants: [],
    },
    {
      id: 'idx-namewell',
      keys: ['domain', 'domains', 'register', 'whois', 'namewell', 'buy a name'],
      title: 'NAMEWELL — domain registration · $9.95/yr',
      url: 'namewell.com/register',
      snippet: 'Instant activation. WHOIS lookup. Transfer in from any registrar.',
      go: 'namewell.com/register',
      variants: [],
    },
    {
      id: 'idx-business',
      keys: ['news', 'business', 'portland', 'headline', 'register', 'demo', 'newspaper'],
      title: 'Portland developer to demo plugin-free video — The Columbia Register',
      url: 'columbia-register.com/business',
      snippet: 'A developer working out of an apartment in Southeast Portland says she has built…',
      go: 'columbia-register.com/business',
      variants: [
        {
          minShift: 2,
          title: 'Local video startup folds before demo — The Columbia Register',
          snippet:
            'A local software project scheduled to demonstrate this month has been withdrawn…',
        },
      ],
    },
  ],
}
