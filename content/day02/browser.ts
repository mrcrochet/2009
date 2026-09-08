import type { z } from 'zod'
import type { BrowserConfigSchema } from '@/engine/content-schema'

/**
 * The 2009 web, one day later.
 *
 * Every address below is new. That is not a stylistic choice: `content/index.ts` projects every
 * authored day into one world graph, and two artifacts at one address means the index keeps the
 * first and drops the second in silence. A day cannot re-serve a page an earlier day owns. So the
 * hosts are the same hosts — the web did not change overnight — and the pages are the pages those
 * hosts put up on Friday: a service notice, a job advertisement, an obituary that was not
 * archived yesterday and is today, a classifieds section the player had no reason to open.
 *
 * The addresses the player learned on the fifteenth still resolve. They come back as the
 * documents they were rather than as designed pages, which is what a page you read yesterday is.
 *
 * The bookmarks bar has the same six labels it had on Thursday and none of the same targets. The
 * file on the desktop says the bookmarks were tidied at 04:14 and that nothing was removed, and
 * both halves of that are true.
 */
export const browser: z.input<typeof BrowserConfigSchema> = {
  home: 'corvid.com',
  engineName: 'CORVID',
  emptyResults:
    'Your search did not match any documents.\nTry different keywords. Remember: this index only knows what exists now.',
  directoryUrl: 'corvid.com/directory/new',
  directoryLabel: 'Browse what Corvid added this week',
  notFoundTitle: 'The page cannot be displayed',
  notFoundBody:
    'The site you are looking for could not be found. It may be down. It may not exist yet.\n\nCheck the address, search from the Corvid home page, or browse the directory.',
  bookmarks: [
    { label: 'Corvid', url: 'corvid.com' },
    { label: 'Directory', url: 'corvid.com/directory/new' },
    { label: 'Meridian', url: 'meridiansavings.com/notices' },
    { label: 'TradePost', url: 'tradepost.com/pdx/phones' },
    { label: 'The Register', url: 'columbia-register.com/today' },
    { label: 'aion-group.com', url: 'aion-group.com/settlements' },
  ],
  pages: [
    // ---------------------------------------------------------------- Corvid
    {
      url: 'corvid.com/directory/new',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Corvid Directory — added this week', ink: '#1f4e79' },
        {
          kind: 'sub',
          text: 'Sorted by hand · 61 sites added since Monday · 14,267 sites listed in total',
        },
        { kind: 'rule' },
        { kind: 'subheading', text: 'News & Media', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [
            { label: 'The Columbia Register — today', url: 'columbia-register.com/today' },
            { label: 'nullcache — general board', url: 'nullcache.org/thread/3358' },
          ],
        },
        { kind: 'subheading', text: 'Money & Banking', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [
            { label: 'Meridian Savings & Loan — notices', url: 'meridiansavings.com/notices' },
            { label: 'Namewell — aftermarket names', url: 'namewell.com/aftermarket' },
          ],
        },
        { kind: 'subheading', text: 'Legal & Public Notice', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [{ label: 'LIENLIST — Oregon sale notices', url: 'lienlist.com' }],
        },
        { kind: 'subheading', text: 'Classifieds', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [{ label: 'TradePost — Portland / phones', url: 'tradepost.com/pdx/phones' }],
        },
        { kind: 'subheading', text: 'Community', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [{ label: 'Cluster', url: 'cluster.com/leavoss/the-car-is-gone' }],
        },
        { kind: 'subheading', text: 'Personal Pages', ink: '#7a0f0f' },
        {
          kind: 'nav',
          items: [{ label: 'GeoHost — free pages for everyone', url: 'geohost.com/Meadow/3390' }],
        },
        { kind: 'subheading', text: 'Business Services', ink: '#7a0f0f' },
        { kind: 'nav', items: [{ label: 'Aion Group', url: 'aion-group.com/settlements' }] },
        { kind: 'rule' },
        {
          kind: 'sub',
          text: 'A site is added here when a person reads it and decides it is a site. There is a form. There is a wait. © 2009 Corvid Inc.',
        },
      ],
      variants: [],
    },

    // --------------------------------------------------------------- Meridian
    {
      url: 'meridiansavings.com/notices',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Meridian Savings & Loan — Notices', ink: '#1f4e79' },
        { kind: 'sub', text: 'Serving Portland since 1961 · Member FDIC · updated 16 Jan 2009' },
        {
          kind: 'nav',
          items: [
            { label: 'Signature verification', url: 'meridiansavings.com/verification' },
            { label: 'Careers', url: 'meridiansavings.com/careers' },
          ],
        },
        { kind: 'rule' },
        { kind: 'subheading', text: '16 JANUARY — SE MORRISON BRANCH', ink: '#7a0f0f' },
        {
          kind: 'p',
          text: 'Our branch at 1140 SE Morrison St is closed to the public from Friday 16 January for scheduled systems work. Teller services and safe deposit access are available at 2200 NE Sandy Blvd. New-account files have been moved to Sandy Blvd for the duration.\n\nThe ATM at SE Morrison remains in service. We expect to reopen the lobby on Monday.',
        },
        { kind: 'rule' },
        { kind: 'subheading', text: '09 JANUARY — HOURS', ink: '#7a0f0f' },
        {
          kind: 'p',
          text: 'Our Gresham branch will close at 4:00 p.m. on Thursdays until further notice. This is a staffing decision and not a reflection on the branch or the town.',
        },
        { kind: 'rule' },
        {
          kind: 'link',
          label: 'Online Banking — sign in',
          url: null,
          note: 'opens the Meridian Savings application on this machine',
          opensApp: 'bank',
        },
      ],
      variants: [],
    },
    {
      url: 'meridiansavings.com/verification',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'About signature verification', ink: '#1f4e79' },
        { kind: 'sub', text: 'Customer information · Meridian Savings & Loan · January 2009' },
        {
          kind: 'nav',
          items: [{ label: 'All notices', url: 'meridiansavings.com/notices' }],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Every account at Meridian carries a specimen signature card. The card is made when the account is opened, it is held at the branch of opening, and it does not leave the branch. If you have not seen yours since the day you signed it, that is because it is doing its job.',
        },
        {
          kind: 'p',
          text: 'A card may carry more than one specimen. A second signatory may be added at the counter by the account holder, in person, with identification, at any time. The addition is dated and initialled by the teller who witnesses it. It does not require your consent to be recorded, only your presence.',
        },
        {
          kind: 'p',
          text: 'Meridian does not publish signature card contents and will not confirm them by telephone. Customers who wish to see their card may ask for it at the counter of the branch where the account was opened.',
        },
        {
          kind: 'p',
          text: 'This information sheet was last revised in March 2004. Some procedures described here are handled differently since the systems change of November 2008.',
        },
      ],
      variants: [],
    },
    {
      url: 'meridiansavings.com/careers',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Careers at Meridian', ink: '#1f4e79' },
        { kind: 'sub', text: '2 positions · updated 15 January 2009' },
        {
          kind: 'nav',
          items: [{ label: 'All notices', url: 'meridiansavings.com/notices' }],
        },
        { kind: 'rule' },
        {
          kind: 'subheading',
          text: 'NEW ACCOUNTS REPRESENTATIVE — SE MORRISON',
          ink: '#22262b',
        },
        {
          kind: 'p',
          text: 'Full time. Available immediately. Counter experience preferred; we will train the right person. Duties include account opening, identification checks and specimen signature intake.\n\nPosted 15 January 2009. This position is vacant now, not from a future date.',
        },
        { kind: 'rule' },
        { kind: 'subheading', text: 'PART TIME TELLER — GRESHAM', ink: '#22262b' },
        {
          kind: 'p',
          text: 'Twenty hours. Available 1 March 2009. Applications from within the branch network are preferred.',
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Meridian has not advertised a Morrison counter position since June 2007. Applications by post only; we are not taking them at the branch this week.',
        },
        { kind: 'evidence', evidenceId: 'e3' },
      ],
      variants: [],
    },

    // -------------------------------------------------------------- TradePost
    {
      url: 'tradepost.com/pdx/phones',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost — Portland / phones', ink: '#7a0f0f' },
        { kind: 'sub', text: 'posted in the last 24 hours · 14 items · flag as spam' },
        {
          kind: 'nav',
          items: [
            { label: 'general for sale', url: 'tradepost.com/pdx/general' },
            { label: 'wanted', url: 'tradepost.com/pdx/wanted' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Eleven Nokora N90 handsets have been posted in the Portland metro since Thursday afternoon. A distributor in Clackamas went under on Tuesday and its stock went out through three separate people, none of whom seem to have spoken to each other about price.\n\nOn Thursday morning a boxed N90 was worth about $340 to somebody in a hurry. This morning the lowest asking price on this page is $85 and nothing has sold since ten o’clock.',
        },
        { kind: 'evidence', evidenceId: 'e10' },
        { kind: 'rule' },
        {
          kind: 'listing',
          title: 'Nokora N90 — sealed, unopened',
          price: '$150',
          location: 'St Johns · cash only',
          text: 'Still in the shrink wrap. My brother-in-law had two of these and I checked what they go for last week. Firm at 150, I know what I have.',
          action: 'buy',
          itemId: 'nokora-again',
        },
        {
          kind: 'listing',
          title: 'Nokora N90 — boxed, charger, manual',
          price: '$85',
          location: 'Beaverton',
          text: 'Third day up. Will take less. Will take considerably less.',
          action: 'none',
          itemId: null,
        },
        {
          kind: 'listing',
          title: 'Motorola flip, prepaid, 200 minutes on it',
          price: '$20',
          location: 'SE Portland',
          text: 'Works fine. I have a different one now.',
          action: 'none',
          itemId: null,
        },
        {
          kind: 'listing',
          title: 'Car charger, fits most',
          price: '$4',
          location: 'Hillsboro',
          text: 'Four dollars. I am not driving to you for four dollars.',
          action: 'none',
          itemId: null,
        },
      ],
      variants: [
        {
          // Far enough along that the world has started closing the loop on the player. The page
          // says nothing that was not already true; it simply notices something.
          minShift: 3,
          blocks: [
            { kind: 'heading', text: 'TradePost — Portland / phones', ink: '#7a0f0f' },
            { kind: 'sub', text: 'posted in the last 24 hours · 14 items · flag as spam' },
            {
              kind: 'nav',
              items: [
                { label: 'general for sale', url: 'tradepost.com/pdx/general' },
                { label: 'wanted', url: 'tradepost.com/pdx/wanted' },
              ],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'Eleven Nokora N90 handsets have been posted in the Portland metro since Thursday afternoon. A distributor in Clackamas went under on Tuesday and its stock went out through three separate people, none of whom seem to have spoken to each other about price.\n\nOn Thursday morning a boxed N90 was worth about $340 to somebody in a hurry. This morning the lowest asking price on this page is $85 and nothing has sold since ten o’clock.',
            },
            {
              kind: 'p',
              text: 'One of the eleven is word for word the advertisement that was on the electronics page yesterday. Same three sentences, same missing apostrophe, different seller, different part of town.',
            },
            { kind: 'evidence', evidenceId: 'e10' },
            { kind: 'rule' },
            {
              kind: 'listing',
              title: 'Nokora N90 — sealed, unopened',
              price: '$150',
              location: 'St Johns · cash only',
              text: 'Still in the shrink wrap. My brother-in-law had two of these and I checked what they go for last week. Firm at 150, I know what I have.',
              action: 'buy',
              itemId: 'nokora-again',
            },
            {
              kind: 'listing',
              title: 'Nokora N90 — company gave it to my brother, he never used it',
              price: '$95',
              location: 'Lents · cash only',
              text: 'No idea what it is worth. Screen is like a little computer. Comes with the charger and a paper manual.',
              action: 'none',
              itemId: null,
            },
            {
              kind: 'listing',
              title: 'Motorola flip, prepaid, 200 minutes on it',
              price: '$20',
              location: 'SE Portland',
              text: 'Works fine. I have a different one now.',
              action: 'none',
              itemId: null,
            },
          ],
        },
      ],
    },
    {
      url: 'tradepost.com/pdx/general',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost — Portland / general for sale', ink: '#7a0f0f' },
        { kind: 'sub', text: 'posted today · 6 items' },
        {
          kind: 'nav',
          items: [
            { label: 'phones', url: 'tradepost.com/pdx/phones' },
            { label: 'wanted', url: 'tradepost.com/pdx/wanted' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'listing',
          title: 'Two boxes of service manuals',
          price: '$22',
          location: 'Montavilla · pickup only',
          text: 'Nokora, Ericsson, Motorola. Paper, in binders, with the fold-out boards. My uncle ran a repair counter until December and these were in the back. Somebody wants these. It is not me.',
          action: 'buy',
          itemId: 'service-manuals',
        },
        {
          kind: 'listing',
          title: 'Chest freezer, works',
          price: '$60',
          location: 'St Johns',
          text: 'Bought it for a half a cow. There is no longer a half a cow.',
          action: 'none',
          itemId: null,
        },
        {
          kind: 'listing',
          title: 'Snow shovel, aluminium',
          price: '$8',
          location: 'NE Portland',
          text: 'Two weeks late and I know it.',
          action: 'none',
          itemId: null,
        },
        {
          kind: 'listing',
          title: 'Wedding dress, size 8, never altered',
          price: '$150 obo',
          location: 'Gresham',
          text: 'Please do not ask.',
          action: 'none',
          itemId: null,
        },
        {
          kind: 'listing',
          title: 'Aquarium, 40 gallon, stand included',
          price: '$45',
          location: 'Beaverton',
          text: 'Fish not included. Fish are at my mother’s.',
          action: 'none',
          itemId: null,
        },
      ],
      variants: [],
    },
    {
      url: 'tradepost.com/pdx/wanted',
      background: '#fff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'TradePost — Portland / wanted', ink: '#7a0f0f' },
        { kind: 'sub', text: '5 posts · January 2009' },
        {
          kind: 'nav',
          items: [
            { label: 'phones', url: 'tradepost.com/pdx/phones' },
            { label: 'general for sale', url: 'tradepost.com/pdx/general' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'WANTED: SERVICE MANUALS, ANY MAKE — paper only, no photocopies. I run a bench in Milwaukie and the factory stopped printing them. Will pay fair and will pay today.\n\nWANTED: SNOW TYRES 195/65 — I am aware. I am aware.\n\nWANTED: SOMEBODY TO SIT WITH MY FATHER TUESDAYS — not a job, a favour with money attached. St Johns.\n\nWANTED: OFFICE FURNITURE, WHOLE SUITE — closing a practice, buying another one. Cash, and I will haul it myself.',
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'WANTED: ANY PAPERWORK FROM THE OLD CASCADE DISTRIBUTORS WAREHOUSE IN CLACKAMAS — invoices, packing slips, stock sheets, anything with a date on it. I am not a creditor and I am not press. Reply here, I will not give a number.',
        },
        {
          kind: 'p',
          text: 'Showing 5 of 5. This section is not indexed by search engines at the request of several posters.',
        },
      ],
      variants: [],
    },

    // ------------------------------------------------------ Columbia Register
    {
      url: 'columbia-register.com/today',
      background: '#fbfbf5',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'The Columbia Register', ink: '#1a1a1a' },
        { kind: 'sub', text: 'Portland, Oregon · Friday, 16 January 2009 · 50 cents' },
        {
          kind: 'nav',
          items: [
            { label: 'City', url: 'columbia-register.com/city/liens' },
            { label: 'Obituaries', url: 'columbia-register.com/obits/moran' },
            { label: 'Classifieds', url: 'tradepost.com/pdx/general' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'JOBLESS CLAIMS RISE AGAIN — the state took 3,100 new claims in the week to Saturday, the highest weekly figure since the series began. An economist at the university described the number as “not yet the top of anything”.',
        },
        { kind: 'rule' },
        {
          kind: 'link',
          label: 'Storage lien sales resume after the snow; auctioneers report record turnout',
          url: 'columbia-register.com/city/liens',
          note: 'City · today',
          opensApp: null,
        },
        {
          kind: 'link',
          label: 'Obituaries — December 2008 — MORAN, Julia B.',
          url: 'columbia-register.com/obits/moran',
          note: 'Archive · notice added 15 January',
          opensApp: null,
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'ALSO TODAY — A cat named Ferdinand, missing from Hawthorne since the first week of the snow, has been returned to a woman on 41st who had given up describing him to people. The shelter had him listed as grey. He is not grey.',
        },
        { kind: 'rule' },
        { kind: 'sub', text: 'Subscribe · Place an ad · Archives back to 1994' },
      ],
      variants: [
        {
          minShift: 4,
          blocks: [
            { kind: 'heading', text: 'The Columbia Register', ink: '#1a1a1a' },
            { kind: 'sub', text: 'Portland, Oregon · Friday, 16 January 2009 · 50 cents' },
            {
              kind: 'nav',
              items: [
                { label: 'City', url: 'columbia-register.com/city/liens' },
                { label: 'Obituaries', url: 'columbia-register.com/obits/moran' },
                { label: 'Classifieds', url: 'tradepost.com/pdx/general' },
              ],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'JOBLESS CLAIMS RISE AGAIN — the state took 3,100 new claims in the week to Saturday, the highest weekly figure since the series began. An economist at the university described the number as “not yet the top of anything”.',
            },
            { kind: 'rule' },
            {
              kind: 'link',
              label: 'Fire at Hawthorne storage facility; sale suspended, no injuries reported',
              url: 'columbia-register.com/city/liens',
              note: 'City · updated 40 minutes ago',
              opensApp: null,
            },
            {
              kind: 'link',
              label: 'Obituaries — December 2008 — MORAN, Julia B.',
              url: 'columbia-register.com/obits/moran',
              note: 'Archive · notice added 15 January',
              opensApp: null,
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'ALSO TODAY — A cat named Ferdinand, missing from Hawthorne since the first week of the snow, has been returned to a woman on 41st who had given up describing him to people. The shelter had him listed as grey. He is not grey.',
            },
            { kind: 'rule' },
            { kind: 'p', text: 'You read this page earlier. The first item was not about a fire.' },
          ],
        },
      ],
    },
    {
      url: 'columbia-register.com/city/liens',
      background: '#fbfbf5',
      dark: false,
      blocks: [
        {
          kind: 'heading',
          text: 'Storage lien sales resume after the snow',
          ink: '#1a1a1a',
        },
        { kind: 'sub', text: 'The Columbia Register · City · 16 January 2009' },
        {
          kind: 'nav',
          items: [
            { label: 'Front page', url: 'columbia-register.com/today' },
            { label: 'Obituaries', url: 'columbia-register.com/obits/moran' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Two weeks of cancelled sales have left Multnomah County auctioneers with a backlog of about ninety units, and the first of them go under the hammer this morning. A lien sale is what happens when a storage unit goes unpaid for three months: the operator publishes a notice, waits, and then sells whatever is behind the door to whoever will stand in the cold and bid on it.',
        },
        {
          kind: 'p',
          text: 'Turnout has roughly doubled since October. One auctioneer working the Hawthorne and Foster sales said he now sees the same eleven faces at every sale and that four of them are people who lost a business last year. “They are not treasure hunters,” he said. “They are doing inventory on other people’s bad months.”',
        },
        {
          kind: 'p',
          text: 'Bidders may look through the open door and may not enter, touch or open anything. Payment is cash at the door. The unit must be emptied the same day, including whatever the bidder did not want, which in practice is most of it.',
        },
        {
          kind: 'link',
          label: 'Today’s Multnomah County sale notices',
          url: 'lienlist.com/or/multnomah/2009-01-16',
          note: 'lienlist.com',
          opensApp: null,
        },
      ],
      variants: [],
    },
    {
      // Yesterday this notice was listed on the December index and marked "no page archived".
      // It is archived now. Nobody announced that; the index simply has one fewer dead link.
      url: 'columbia-register.com/obits/moran',
      background: '#fbfbf5',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Obituaries — December 2008', ink: '#1a1a1a' },
        { kind: 'sub', text: 'The Columbia Register · archived page · notice added 15 Jan 2009' },
        {
          kind: 'nav',
          items: [
            { label: 'Front page', url: 'columbia-register.com/today' },
            { label: 'City', url: 'columbia-register.com/city/liens' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'MORAN, Julia B., 41, of Portland, died Thursday, December 4, 2008, at home. She was a bookkeeper. She is survived by no immediate family. At her request there will be no service.',
        },
        {
          kind: 'p',
          text: 'Condolences may be left in the guest book below. (Guest book is empty.)',
        },
        {
          kind: 'p',
          text: 'Archivist’s note: this notice was received in December and held. It was entered into the archive on 15 January 2009. The delay is not unusual for notices filed without a family contact.',
        },
        { kind: 'evidence', evidenceId: 'e9' },
      ],
      variants: [],
    },

    // ---------------------------------------------------------------- Cluster
    {
      url: 'cluster.com/leavoss/the-car-is-gone',
      background: '#eef2f6',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Cluster — lea.voss', ink: '#2b5f96' },
        { kind: 'sub', text: 'Portland, OR · 41 friends · posted today, 07:31' },
        {
          kind: 'nav',
          items: [{ label: 'SE Portland — the grey car', url: 'cluster.com/pdx/se/the-grey-car' }],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '07:31 — the car is gone. so is the man who was sitting in it. i should be relieved. i have been standing at the window for an hour working out why i am not.',
        },
        {
          kind: 'p',
          text: '07:44 — three people have asked me if i am ok and i do not know how to answer that without sounding like i want it back',
        },
        { kind: 'evidence', evidenceId: 'e8' },
      ],
      variants: [
        {
          // The player put a name and an address into her hands. She did what she said she would.
          whenFlag: 'leaToldAboutMarc',
          blocks: [
            { kind: 'heading', text: 'Cluster — lea.voss', ink: '#2b5f96' },
            { kind: 'sub', text: 'Portland, OR · 41 friends · updated today, 11:02' },
            {
              kind: 'nav',
              items: [
                { label: 'SE Portland — the grey car', url: 'cluster.com/pdx/se/the-grey-car' },
              ],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: '11:02 — marc deleon, 1822 se 39th. somebody came for him at twenty to seven this morning and it was on a printed sheet the night before. i am putting it here because i was told and because i do not want to be the only person who knows.',
            },
            {
              kind: 'p',
              text: '07:31 — the car is gone. so is the man who was sitting in it. i should be relieved. i have been standing at the window for an hour working out why i am not.',
            },
            { kind: 'evidence', evidenceId: 'e8' },
          ],
        },
        {
          // Far enough along and there is nothing here at all. Whatever she wrote this morning is
          // not on the page any more, and neither is the thing the player needed from it.
          minShift: 6,
          blocks: [
            { kind: 'heading', text: 'Cluster — lea.voss', ink: '#2b5f96' },
            { kind: 'sub', text: 'Portland, OR · this page is no longer available' },
            {
              kind: 'nav',
              items: [
                { label: 'SE Portland — the grey car', url: 'cluster.com/pdx/se/the-grey-car' },
              ],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'This page is no longer available. It may have been removed by its author or by Cluster.',
            },
            {
              kind: 'p',
              text: 'You read this page this morning. There was a post on it and you can still remember most of the words, which is not the same as having them.',
            },
          ],
        },
      ],
    },
    {
      url: 'cluster.com/pdx/se/the-grey-car',
      background: '#eef2f6',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Cluster — SE Portland', ink: '#2b5f96' },
        { kind: 'sub', text: 'neighbourhood group · 1,204 members · 6 replies' },
        {
          kind: 'nav',
          items: [{ label: 'lea.voss', url: 'cluster.com/leavoss/the-car-is-gone' }],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'j.abara — 08:12\nDid anyone else have a grey sedan parked on their block all week? Ours was on 38th between Belmont and Yamhill, two nights running, and this morning it is not.',
        },
        {
          kind: 'p',
          text: 'r.mikkelsen — 08:40\nSomebody posted about one on Thursday. I went to look for it just now and I cannot find the post. Possibly I imagined the post. It has been that kind of fortnight.',
        },
        {
          kind: 'p',
          text: 'j.abara — 09:15\nI am not going to pretend this is sinister. Half the block is behind on something. A car that sits for two nights is usually a man who does not want to knock on the door yet.',
        },
        {
          kind: 'p',
          text: 't.ngo — 09:51\nIt is a repo. It is always a repo. In October there were three on my street in a week and one of them was mine.',
        },
      ],
      variants: [
        {
          // A decision the player made on Thursday, still standing on Friday. She posted the
          // plate; the neighbours have it, and one of them has a second sighting.
          whenFlag: 'leaPostedAgain',
          blocks: [
            { kind: 'heading', text: 'Cluster — SE Portland', ink: '#2b5f96' },
            { kind: 'sub', text: 'neighbourhood group · 1,204 members · 9 replies' },
            {
              kind: 'nav',
              items: [{ label: 'lea.voss', url: 'cluster.com/leavoss/the-car-is-gone' }],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'j.abara — 08:12\nDid anyone else have a grey sedan parked on their block all week? Ours was on 38th between Belmont and Yamhill, two nights running, and this morning it is not.',
            },
            {
              kind: 'p',
              text: 'r.mikkelsen — 08:40\nOregon plate starting with 4, no front plate. Somebody put that up on Thursday morning and I copied it into a notebook because I am the sort of person who does that. Grey four-door, sits with the engine off.',
            },
            {
              kind: 'p',
              text: 'k.sowande — 09:06\nThat is the same car that was outside the laundromat on Division on the 12th. Same missing front plate. I remember because I walked past it twice and the second time the man in it was reading a printed sheet.',
            },
            {
              kind: 'p',
              text: 't.ngo — 09:51\nIt is a repo. It is always a repo. Although repo men do not usually sit for two nights and they do not usually read.',
            },
          ],
        },
        {
          // The other Thursday decision. She took it down, and the only trace of what happened
          // to her this week is four neighbours arguing about whether they remember it.
          whenFlag: 'leaPostRemoved',
          blocks: [
            { kind: 'heading', text: 'Cluster — SE Portland', ink: '#2b5f96' },
            { kind: 'sub', text: 'neighbourhood group · 1,204 members · 7 replies' },
            {
              kind: 'nav',
              items: [{ label: 'lea.voss', url: 'cluster.com/leavoss/the-car-is-gone' }],
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'j.abara — 08:12\nDid anyone else have a grey sedan parked on their block all week? Ours was on 38th between Belmont and Yamhill, two nights running, and this morning it is not.',
            },
            {
              kind: 'p',
              text: 'r.mikkelsen — 08:40\nThere was a post about this on Thursday. I am certain there was. It is not there now and searching for it gives me a page that says the post does not exist, which is a different thing from saying it never did.',
            },
            {
              kind: 'p',
              text: 'k.sowande — 09:06\nShe took it down. That is what you do when you are frightened and somebody sensible tells you that writing it down makes you easier to find. I am not saying they were wrong.',
            },
            {
              kind: 'p',
              text: 't.ngo — 09:51\nIt is a repo. It is always a repo. Can we let the woman have her Friday.',
            },
          ],
        },
      ],
    },

    // -------------------------------------------------------------- nullcache
    {
      url: 'nullcache.org/thread/3358',
      background: '#0f1216',
      dark: true,
      blocks: [
        {
          kind: 'heading',
          text: 'nullcache › general › “check your signature card”',
          ink: '#8fb6d4',
        },
        { kind: 'sub', text: '31 replies · last post 16 Jan 2009, 06:55' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: '>> 3358  anon\nask your bank for the specimen card on your account. not the statement. the card. mine has two signatures on it and i have only ever been to that branch once',
        },
        {
          kind: 'p',
          text: '>> 3361  anon\nthey will not show it to you over the phone and they will not show it to you at a branch that is not the branch of opening. i know this because i tried both on wednesday',
        },
        {
          kind: 'p',
          text: '>> 3369  anon\nmine was amended four days before the letter came. four days. i have the date because i asked for it in writing before i understood what i was asking for',
        },
        {
          kind: 'p',
          text: '>> 3374  anon\nnine of us in this thread now with the same shape. round amount, thirty days, an address that is a bank branch, and a second name on the card that nobody will read out',
        },
        {
          kind: 'p',
          text: '>> 3381  anon\nthe one who started the last thread about this has not posted since the 9th. i am not saying anything by that. i am saying it because somebody should say it out loud',
        },
      ],
      variants: [],
    },

    // --------------------------------------------------------------- Namewell
    {
      url: 'namewell.com/aftermarket',
      background: '#fdfdf8',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'NAMEWELL — aftermarket & lapsed names', ink: '#1f4e79' },
        { kind: 'sub', text: '$9.95 per year · instant activation · lapsed names released daily' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'These names were registered by somebody once and are not registered by anybody now. Most of them lapsed because a renewal notice went to an address that no longer takes post. We do not know which ones, and neither does anybody else.',
        },
        {
          kind: 'listing',
          title: 'aion-group.net',
          price: '$9.95',
          location: 'available',
          text: 'Never registered. The .com has been held since 11 December 2008 and the .org and .net were never taken, which is unusual for a company that files paperwork.',
          action: 'domain',
          itemId: 'aion-group.net',
        },
        {
          kind: 'listing',
          title: 'owentrask.com',
          price: '$9.95',
          location: 'available',
          text: 'Never registered. Two syllables, one person. Nobody has queried this name in the eleven years we have kept a log of queries.',
          action: 'domain',
          itemId: 'owentrask.com',
        },
        {
          kind: 'listing',
          title: 'quietline.org',
          price: '$9.95',
          location: 'lapsed 04 January 2009',
          text: 'Held from 1998 to this month by a registrant with no name on file and a postal address that is a mail drop in Salem. Renewal notice returned undelivered.',
          action: 'domain',
          itemId: 'quietline.org',
        },
        {
          kind: 'listing',
          title: 'nscalecascade.com',
          price: '$9.95',
          location: 'available',
          text: 'A model railway club in Gresham asked about this in 2003 and did not come back. There is a man on a free host who has been building the same layout for eleven years and has never owned a name.',
          action: 'domain',
          itemId: 'nscalecascade.com',
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Nine dollars and ninety-five cents a year. A name is a year of somebody being able to find you, which is worth having and is also the entire risk.',
        },
      ],
      variants: [
        {
          minShift: 2,
          blocks: [
            { kind: 'heading', text: 'NAMEWELL — aftermarket & lapsed names', ink: '#1f4e79' },
            {
              kind: 'sub',
              text: '$9.95 per year · instant activation · lapsed names released daily',
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'These names were registered by somebody once and are not registered by anybody now. Most of them lapsed because a renewal notice went to an address that no longer takes post. We do not know which ones, and neither does anybody else.',
            },
            {
              kind: 'p',
              text: 'aion-group.net — no longer available. Registered 16 Jan 2009, 04:11. Registrant details are not public.',
            },
            {
              kind: 'listing',
              title: 'owentrask.com',
              price: '$9.95',
              location: 'available',
              text: 'Never registered. Two syllables, one person. Nobody has queried this name in the eleven years we have kept a log of queries.',
              action: 'domain',
              itemId: 'owentrask.com',
            },
            {
              kind: 'listing',
              title: 'quietline.org',
              price: '$9.95',
              location: 'lapsed 04 January 2009',
              text: 'Held from 1998 to this month by a registrant with no name on file and a postal address that is a mail drop in Salem. Renewal notice returned undelivered.',
              action: 'domain',
              itemId: 'quietline.org',
            },
            {
              kind: 'listing',
              title: 'nscalecascade.com',
              price: '$9.95',
              location: 'available',
              text: 'A model railway club in Gresham asked about this in 2003 and did not come back. There is a man on a free host who has been building the same layout for eleven years and has never owned a name.',
              action: 'domain',
              itemId: 'nscalecascade.com',
            },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'Nine dollars and ninety-five cents a year. A name is a year of somebody being able to find you, which is worth having and is also the entire risk.',
            },
          ],
        },
      ],
    },

    // --------------------------------------------------------------- LIENLIST
    {
      url: 'lienlist.com',
      background: '#f6f6f0',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'LIENLIST', ink: '#3f5d3f' },
        { kind: 'sub', text: 'Public sale notices · Oregon · updated every weekday morning' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Oregon law requires a storage operator to publish a notice before selling the contents of a unit for unpaid rent. The notices go in a newspaper of general circulation, which nobody reads, and since 2004 they have also gone here.',
        },
        {
          kind: 'nav',
          items: [
            { label: 'Multnomah County — today', url: 'lienlist.com/or/multnomah/2009-01-16' },
          ],
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'We publish the notice, the unit number and the name on the rental agreement, because that is what the statute requires. We do not publish what is in the unit. Nobody knows what is in the unit. That is the whole business.',
        },
      ],
      variants: [],
    },
    {
      url: 'lienlist.com/or/multnomah/2009-01-16',
      background: '#f6f6f0',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Multnomah County — sales of 16 January 2009', ink: '#3f5d3f' },
        { kind: 'sub', text: '11 notices · lock cut at the advertised hour · cash at the door' },
        { kind: 'nav', items: [{ label: 'LIENLIST home', url: 'lienlist.com' }] },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'HAWTHORNE SELF STORAGE, 4110 SE HAWTHORNE BLVD — 11:00 a.m.\n  Unit 108 — agreement in the name of R. PELL — household\n  Unit 214 — agreement in the name of J. MORAN — nine boxes, one filing cabinet\n  Unit 305 — agreement in the name of A. VUONG — commercial, restaurant\n\nFOSTER ROAD MINI STORAGE, 6820 SE FOSTER RD — 1:00 p.m.\n  Unit 41 — agreement in the name of D. CASTLE — household\n  Unit 62 — agreement in the name of (no name recorded) — unknown',
        },
        { kind: 'rule' },
        {
          kind: 'listing',
          title: 'Unit 214 — contents, storage lien sale',
          price: '$250',
          location: 'Hawthorne Self Storage · 11:00 a.m. · cash at the door',
          text: 'Nine boxes and a two-drawer filing cabinet, visible from the doorway, door up since December. Agreement in the name of J. Moran, three months unpaid, no forwarding address on file. Bidders may look and may not enter. Whatever you do not want, you clear the same day.',
          action: 'buy',
          itemId: 'lien-unit-214',
        },
        {
          kind: 'p',
          text: 'A notice appears here for four weeks before a sale. Unit 214 has been listed since 19 December and nobody has claimed it, which is ordinary, and which is also the last thing that will ever be published about somebody.',
        },
      ],
      variants: [],
    },

    // ------------------------------------------------------------- Aion Group
    {
      // There was nothing at this address yesterday. There is now.
      url: 'aion-group.com/settlements',
      background: '#f2f2ee',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'AION GROUP — SETTLEMENTS', ink: '#22262b' },
        { kind: 'sub', text: 'Statement of account · this page is generated, not maintained' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'FILE:            RASK, O.\nSTATUS:          ACTIVE\nOBLIGATION:      $10,000.00\nRECEIVED:        $0.00\nTERM:            30 days from waking\nDAY:             02\n\nFILES IN RECOVERY:        41\nFILES CLOSED THIS QUARTER: 9',
        },
        {
          kind: 'p',
          text: 'This page displays the state of one file. It has no form, no address for replies and no telephone number, and all three of those are deliberate.',
        },
        {
          kind: 'p',
          text: 'Recovery is not a synonym for collection. A file in recovery is a file on which work is being done. A file that has been closed is not a file on which anybody was paid.',
        },
      ],
      variants: [
        {
          minShift: 5,
          blocks: [
            { kind: 'heading', text: 'AION GROUP — SETTLEMENTS', ink: '#22262b' },
            { kind: 'sub', text: 'Statement of account · this page is generated, not maintained' },
            { kind: 'rule' },
            {
              kind: 'p',
              text: 'FILE:            RASK, O.\nSTATUS:          ACTIVE\nOBLIGATION:      $10,000.00\nRECEIVED:        $0.00\nTERM:            30 days from waking\nDAY:             02\n\nFILES IN RECOVERY:        40\nFILES CLOSED THIS QUARTER: 10',
            },
            {
              kind: 'p',
              text: 'This page displays the state of one file. It has no form, no address for replies and no telephone number, and all three of those are deliberate.',
            },
            {
              kind: 'p',
              text: 'Recovery is not a synonym for collection. A file in recovery is a file on which work is being done. A file that has been closed is not a file on which anybody was paid.',
            },
            {
              kind: 'p',
              text: 'The two numbers at the foot of this page were forty-one and nine when you read it. Nothing else on the page has changed.',
            },
          ],
        },
      ],
    },

    // --------------------------------------------------------------- GeoHost
    {
      url: 'geohost.com/Meadow/3390',
      background: '#e8f0e8',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'MY FATHER’S WORKSHOP — a list', ink: '#556b2f' },
        {
          kind: 'sub',
          text: 'you are visitor 000212 · last updated 01/14/2009 · this page has no counter graphic because I could not make it work',
        },
        {
          kind: 'p',
          text: 'My father died in November and the house has to go in the spring, so I am photographing the workshop and putting it here rather than throwing it in a skip. He kept everything and he labelled everything, in pencil, on masking tape, and I have decided the labels are the point.',
        },
        {
          kind: 'p',
          text: 'Bench planes (7). Two are his father’s. A jointer that is too heavy for me to lift and that I am not selling.\n\nDrill index, complete, in the tin, sizes in his handwriting.\n\nThree coffee cans of screws sorted by length and one coffee can of screws he gave up on.\n\nA box marked KEEP that contains a bus timetable from 1974 and nothing else.',
        },
        {
          kind: 'p',
          text: 'I have started going to the storage sales because he had a unit as well and I did not know about it until December, and I did not have the three months. Somebody else will open that door. I would like it to be somebody who reads the labels.',
        },
        {
          kind: 'link',
          label: 'The sale notices I have been reading',
          url: 'lienlist.com',
          note: 'lienlist.com',
          opensApp: null,
        },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Sign my guestbook. Or do not. I have had four visitors and three of them were me.',
        },
      ],
      variants: [],
    },
  ],
  index: [
    {
      id: 'idx-directory',
      keys: ['directory', 'browse', 'index', 'sites', 'catalogue', 'catalog', 'new sites'],
      title: 'Corvid Directory — added this week',
      url: 'corvid.com/directory/new',
      snippet:
        'Sixty-one sites added since Monday, sorted by hand. News, money, public notice, classifieds, community.',
      go: 'corvid.com/directory/new',
      variants: [],
    },
    {
      id: 'idx-notices',
      keys: ['meridian', 'branch', 'closed', 'morrison', 'se morrison', 'bank', 'banking', '1140'],
      title: 'Meridian Savings & Loan — Notices',
      url: 'meridiansavings.com/notices',
      snippet:
        'Our branch at 1140 SE Morrison St is closed to the public from Friday 16 January for scheduled systems work…',
      go: 'meridiansavings.com/notices',
      variants: [],
    },
    {
      id: 'idx-verification',
      keys: [
        'signature',
        'signature card',
        'specimen',
        'second signatory',
        'signatory',
        'verification',
      ],
      title: 'About signature verification — Meridian Savings',
      url: 'meridiansavings.com/verification',
      snippet:
        'A card may carry more than one specimen. A second signatory may be added at the counter, in person, with identification…',
      go: 'meridiansavings.com/verification',
      variants: [],
    },
    {
      id: 'idx-careers',
      keys: ['careers', 'job', 'jobs', 'hiring', 'vacancy', 'new accounts', 'teller'],
      title: 'Careers at Meridian — 2 positions',
      url: 'meridiansavings.com/careers',
      snippet:
        'NEW ACCOUNTS REPRESENTATIVE — SE MORRISON. Full time. Available immediately. Posted 15 January 2009.',
      go: 'meridiansavings.com/careers',
      variants: [],
    },
    {
      id: 'idx-phones',
      keys: ['nokora', 'phone', 'handset', 'n90', 'flip', 'sell a phone'],
      title: 'TradePost — Portland / phones',
      url: 'tradepost.com/pdx/phones',
      snippet:
        'Fourteen items posted in the last 24 hours. Eleven of them are the same handset and nothing has sold since ten o’clock.',
      go: 'tradepost.com/pdx/phones',
      variants: [
        {
          minShift: 3,
          title: 'TradePost — Portland / phones — 11 identical listings',
          snippet:
            'One of the eleven is word for word an advertisement that was on the electronics page yesterday…',
        },
      ],
    },
    {
      id: 'idx-general',
      keys: ['for sale', 'classified', 'tradepost', 'manuals', 'service manuals', 'freezer'],
      title: 'TradePost — Portland / general for sale',
      url: 'tradepost.com/pdx/general',
      snippet:
        'Six items posted today. Service manuals, a chest freezer, a snow shovel two weeks late.',
      go: 'tradepost.com/pdx/general',
      variants: [],
    },
    {
      id: 'idx-wanted',
      keys: ['wanted', 'buying', 'will pay', 'cascade distributors', 'clackamas', 'warehouse'],
      title: 'TradePost — Portland / wanted',
      url: 'tradepost.com/pdx/wanted',
      snippet:
        'WANTED: ANY PAPERWORK FROM THE OLD CASCADE DISTRIBUTORS WAREHOUSE IN CLACKAMAS. I am not a creditor and I am not press.',
      go: 'tradepost.com/pdx/wanted',
      variants: [],
    },
    {
      id: 'idx-register',
      keys: ['news', 'newspaper', 'register', 'portland', 'headline', 'jobless', 'today'],
      title: 'The Columbia Register — Friday, 16 January 2009',
      url: 'columbia-register.com/today',
      snippet:
        'JOBLESS CLAIMS RISE AGAIN — the state took 3,100 new claims in the week to Saturday, the highest weekly figure since the series began.',
      go: 'columbia-register.com/today',
      variants: [
        {
          minShift: 4,
          title: 'The Columbia Register — Friday, 16 January 2009 — updated',
          snippet: 'Fire at Hawthorne storage facility; sale suspended, no injuries reported…',
        },
      ],
    },
    {
      id: 'idx-liens',
      keys: ['storage', 'lien', 'auction', 'storage unit', 'self storage', 'sale notice'],
      title: 'Storage lien sales resume after the snow — The Columbia Register',
      url: 'columbia-register.com/city/liens',
      snippet:
        'Two weeks of cancelled sales have left Multnomah County auctioneers with a backlog of about ninety units…',
      go: 'columbia-register.com/city/liens',
      variants: [],
    },
    {
      id: 'idx-moran',
      keys: ['moran', 'julia moran', 'obituary', 'obituaries', 'bookkeeper', 'december'],
      title: 'Obituaries — December 2008 — MORAN, Julia B. — The Columbia Register',
      url: 'columbia-register.com/obits/moran',
      snippet:
        'MORAN, Julia B., 41, of Portland, died Thursday, December 4, 2008, at home. She was a bookkeeper. She is survived by no immediate family…',
      go: 'columbia-register.com/obits/moran',
      variants: [],
    },
    {
      id: 'idx-lea',
      keys: ['lea', 'voss', 'lea voss', 'cluster', 'the car', 'grey car', 'sedan'],
      title: 'Cluster — lea.voss',
      url: 'cluster.com/leavoss/the-car-is-gone',
      snippet: 'the car is gone. so is the man who was sitting in it. i should be relieved…',
      go: 'cluster.com/leavoss/the-car-is-gone',
      variants: [],
    },
    {
      id: 'idx-neighbours',
      keys: ['neighbourhood', 'neighborhood', '38th', 'belmont', 'repo', 'se portland'],
      title: 'Cluster — SE Portland — the grey car',
      url: 'cluster.com/pdx/se/the-grey-car',
      snippet:
        'Did anyone else have a grey sedan parked on their block all week? Two nights running, and this morning it is not.',
      go: 'cluster.com/pdx/se/the-grey-car',
      variants: [],
    },
    {
      id: 'idx-nullcache',
      keys: ['nullcache', 'thirty days', '30 days', 'collection letter', 'creditor', 'two names'],
      title: 'nullcache › “check your signature card”',
      url: 'nullcache.org/thread/3358',
      snippet:
        'ask your bank for the specimen card on your account. not the statement. the card. mine has two signatures on it…',
      go: 'nullcache.org/thread/3358',
      variants: [],
    },
    {
      id: 'idx-namewell',
      keys: ['domain', 'domains', 'namewell', 'whois', 'register a name', 'lapsed'],
      title: 'NAMEWELL — aftermarket & lapsed names · $9.95/yr',
      url: 'namewell.com/aftermarket',
      snippet:
        'Names registered by somebody once and by nobody now. Most lapsed because a renewal notice went to an address that no longer takes post.',
      go: 'namewell.com/aftermarket',
      variants: [],
    },
    {
      id: 'idx-lienlist',
      keys: ['lienlist', 'unit 214', 'hawthorne', 'public notice', 'bid', 'cash at the door'],
      title: 'LIENLIST — Multnomah County, 16 January 2009',
      url: 'lienlist.com/or/multnomah/2009-01-16',
      snippet:
        'Eleven notices. Hawthorne Self Storage, 11:00 a.m. Unit 214 — agreement in the name of J. MORAN — nine boxes, one filing cabinet.',
      go: 'lienlist.com/or/multnomah/2009-01-16',
      variants: [],
    },
    {
      id: 'idx-aion',
      keys: ['aion', 'aion group', 'quota', 'settlement', 'settlements', 'recovery', 'file'],
      title: 'AION GROUP — SETTLEMENTS',
      url: 'aion-group.com/settlements',
      snippet: 'FILE: RASK, O. · STATUS: ACTIVE · FILES IN RECOVERY: 41 · FILES CLOSED: 9',
      go: 'aion-group.com/settlements',
      variants: [
        {
          minShift: 5,
          title: 'AION GROUP — SETTLEMENTS',
          snippet: 'FILE: RASK, O. · STATUS: ACTIVE · FILES IN RECOVERY: 40 · FILES CLOSED: 10',
        },
      ],
    },
    {
      id: 'idx-geohost',
      keys: ['geohost', 'workshop', 'tools', 'free pages', 'homepages', 'estate'],
      title: 'MY FATHER’S WORKSHOP — a list',
      url: 'geohost.com/Meadow/3390',
      snippet:
        'He kept everything and he labelled everything, in pencil, on masking tape, and I have decided the labels are the point.',
      go: 'geohost.com/Meadow/3390',
      variants: [],
    },
    {
      // Indexed, and it does not resolve. The search knows the address existed on Thursday; the
      // page behind it is a day old and this is not that day's machine.
      id: 'idx-clackamas',
      keys: ['cascade distributors', 'distributor', 'liquidation', 'went under', 'stock'],
      title: 'Cascade Distributors Inc. — notice of dissolution',
      url: 'or-registry.state.or.us/entity/0994417',
      snippet:
        'Administratively dissolved 13 January 2009. Registered agent resigned 02 January 2009. No successor filed.',
      go: null,
      variants: [],
    },
  ],
}
