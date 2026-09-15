import type { z } from 'zod'
import type { BrowserConfigSchema } from '@/engine/case-schema'

/**
 * A closed internet, and the case's half of it.
 *
 * No page here reaches the real network — the relay is the only thing that does, and it does it
 * through immutable snapshots. It is a *web*: every site has a front page, sites link to each
 * other, and the Orbit directory is the way in when the investigator does not know what to
 * search for. Pages carry `variants` keyed on a flag, so a page can read differently once
 * something has happened.
 */
export const browser: z.input<typeof BrowserConfigSchema> = {
  home: 'orbit.com',
  engineName: 'ORBIT',
  emptyResults:
    'Your search did not match any documents.\nTry different keywords, or browse the directory.',
  directoryUrl: 'orbit.com/directory',
  directoryLabel: 'Browse the Orbit directory',
  notFoundTitle: 'This page could not be reached',
  notFoundBody:
    'The site you are looking for could not be found. It may have been taken down.\n\nCheck the address, search from the Orbit home page, or browse the directory.',
  bookmarks: [
    { label: 'Orbit', url: 'orbit.com' },
    { label: 'Directory', url: 'orbit.com/directory' },
    { label: 'KGW', url: 'kgw-portland.com' },
    { label: 'Marlow', url: 'marlowfoundation.org' },
  ],
  pages: [
    {
      url: 'orbit.com/directory',
      background: '#ffffff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Orbit Directory', ink: '#1a4a7a' },
        { kind: 'sub', text: 'Sorted by hand · 41,882 sites listed' },
        { kind: 'rule' },
        {
          kind: 'nav',
          items: [
            { label: 'News', url: 'kgw-portland.com' },
            { label: 'Nonprofits', url: 'marlowfoundation.org' },
            { label: 'Business', url: 'ridgelinepartners.com/team' },
            { label: 'Local', url: 'pdxbands.com/the-hollow-coast' },
          ],
        },
        { kind: 'p', text: 'Portland · Oregon · 4,112 listings' },
        { kind: 'link', label: 'Fremont Street Parking', url: 'fremontparking.com', note: null },
      ],
    },
    {
      url: 'kgw-portland.com',
      background: '#ffffff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'KGW Portland', ink: '#0d2b52' },
        { kind: 'sub', text: 'Local news · updated continuously' },
        { kind: 'rule' },
        {
          kind: 'link',
          label: 'Family appeals for information on missing Portland man',
          url: 'kgw-portland.com/missing-daniel-mercer',
          note: '16 June',
        },
        {
          kind: 'link',
          label: 'Fremont Street lot to close for resurfacing in July',
          url: 'fremontparking.com',
          note: '14 June',
        },
        { kind: 'p', text: 'Weather · Traffic · Sports · Contact the newsroom' },
      ],
    },
    {
      url: 'kgw-portland.com/missing-daniel-mercer',
      background: '#ffffff',
      dark: false,
      blocks: [
        {
          kind: 'heading',
          text: 'Family appeals for information on missing Portland man',
          ink: '#0d2b52',
        },
        { kind: 'sub', text: 'By Amara Whitfield · 16 June 2026' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'The family of Daniel Mercer, 34, has asked anyone with information to come forward. Mercer was last seen leaving his home in the Alberta district on the evening of 9 June.',
        },
        {
          kind: 'p',
          text: 'Richard Vale, a partner at Ridgeline Partners, where Mercer worked as a financial analyst, said he was "devastated" by the news. Vale told KGW he last saw Mercer at the office on Sunday 7 June and that nothing about him "seemed out of the ordinary".',
        },
        { kind: 'evidence', evidenceId: 'e4' },
        {
          kind: 'p',
          text: 'Portland Police say the investigation is ongoing and that they are not currently treating the disappearance as suspicious.',
        },
        { kind: 'link', label: 'Ridgeline Partners', url: 'ridgelinepartners.com/team', note: null },
      ],
    },
    {
      url: 'ridgelinepartners.com/team',
      background: '#f7f7f4',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Ridgeline Partners', ink: '#2b3a2f' },
        { kind: 'sub', text: 'Private capital · Portland, Oregon' },
        { kind: 'rule' },
        { kind: 'subheading', text: 'Richard Vale — Managing Partner' },
        {
          kind: 'p',
          text: 'Richard founded Ridgeline in 2011. He serves on the boards of several Oregon nonprofits, including the Marlow Foundation.',
        },
        { kind: 'subheading', text: 'Daniel Mercer — Analyst' },
        { kind: 'p', text: 'Profile unavailable.' },
        { kind: 'link', label: 'Marlow Foundation', url: 'marlowfoundation.org', note: null },
      ],
      variants: [
        {
          // Somebody edited this page after the investigator called. Nothing announces it; the
          // sentence about the Marlow board is simply not there any more.
          whenFlag: 'valeNotified',
          blocks: [
            { kind: 'heading', text: 'Ridgeline Partners', ink: '#2b3a2f' },
            { kind: 'sub', text: 'Private capital · Portland, Oregon' },
            { kind: 'rule' },
            { kind: 'subheading', text: 'Richard Vale — Managing Partner' },
            { kind: 'p', text: 'Richard founded Ridgeline in 2011.' },
            { kind: 'subheading', text: 'Daniel Mercer — Analyst' },
            { kind: 'p', text: 'Profile unavailable.' },
          ],
        },
      ],
    },
    {
      url: 'marlowfoundation.org',
      background: '#fbfaf6',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'The Marlow Foundation', ink: '#5a4223' },
        { kind: 'sub', text: 'Supporting Oregon communities since 2009' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'The Marlow Foundation makes grants to arts, education and housing initiatives across the Pacific Northwest.',
        },
        { kind: 'link', label: 'Annual filings', url: 'marlowfoundation.org/filings', note: null },
      ],
    },
    {
      url: 'marlowfoundation.org/filings',
      background: '#fbfaf6',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Annual filings', ink: '#5a4223' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Filings for 2014 through 2025 are available on request from the state registry.',
        },
        {
          kind: 'p',
          text: 'The 2013 filing is not published here. A scanned copy is held in the Oregon nonprofit registry.',
        },
        { kind: 'link', label: 'Oregon nonprofit registry', url: null, note: 'Offline' },
      ],
    },
    {
      url: 'fremontparking.com',
      background: '#ffffff',
      dark: false,
      blocks: [
        { kind: 'heading', text: 'Fremont Street Parking', ink: '#333b44' },
        { kind: 'sub', text: '1140 NE Fremont St · Open 24 hours' },
        { kind: 'rule' },
        {
          kind: 'listing',
          title: 'Monthly permit',
          price: '$145 / month',
          location: '1140 NE Fremont St',
          text: 'Covered spaces available on levels 2 and 3. Card entry, no attendant after 20:00.',
        },
        {
          kind: 'p',
          text: 'Receipts are issued at the barrier on exit and carry the entry time, the exit time and the lane number.',
        },
      ],
    },
    {
      url: 'pdxbands.com/the-hollow-coast',
      background: '#1b1b20',
      dark: true,
      blocks: [
        { kind: 'heading', text: 'The Hollow Coast', ink: '#e8d9a0' },
        { kind: 'sub', text: 'Portland · four-piece · on hiatus' },
        { kind: 'rule' },
        {
          kind: 'p',
          text: 'Thanks to everyone who came out to the Doug Fir on the 30th. We are taking the rest of the year off. The van is for sale.',
        },
        {
          kind: 'listing',
          title: '2004 Ford Econoline',
          price: '$3,200 obo',
          location: 'SE Portland',
          text: 'Runs. 214k miles. Bench seats removed. Smells like a band van.',
        },
      ],
    },
  ],
  index: [
    {
      id: 'i-mercer',
      keys: ['daniel mercer', 'mercer', 'missing'],
      title: 'Family appeals for information on missing Portland man',
      url: 'kgw-portland.com/missing-daniel-mercer',
      snippet: 'Mercer was last seen leaving his home in the Alberta district on the evening of…',
      go: 'kgw-portland.com/missing-daniel-mercer',
    },
    {
      id: 'i-vale',
      keys: ['richard vale', 'vale', 'ridgeline'],
      title: 'Ridgeline Partners — Team',
      url: 'ridgelinepartners.com/team',
      snippet: 'Richard founded Ridgeline in 2011. He serves on the boards of several Oregon…',
      go: 'ridgelinepartners.com/team',
      variants: [
        {
          whenFlag: 'valeNotified',
          title: 'Ridgeline Partners — Team',
          snippet: 'Richard founded Ridgeline in 2011.',
        },
      ],
    },
    {
      id: 'i-marlow',
      keys: ['marlow', 'marlow foundation', 'foundation'],
      title: 'The Marlow Foundation',
      url: 'marlowfoundation.org',
      snippet: 'Supporting Oregon communities since 2009.',
      go: 'marlowfoundation.org',
    },
    {
      id: 'i-filings',
      keys: ['filings', 'marlow 2013', '2013'],
      title: 'Marlow Foundation — Annual filings',
      url: 'marlowfoundation.org/filings',
      snippet: 'The 2013 filing is not published here.',
      go: 'marlowfoundation.org/filings',
    },
    {
      id: 'i-fremont',
      keys: ['fremont', 'parking', 'fremont street'],
      title: 'Fremont Street Parking',
      url: 'fremontparking.com',
      snippet: '1140 NE Fremont St · Open 24 hours · Card entry, no attendant after 20:00.',
      go: 'fremontparking.com',
    },
    {
      id: 'i-kgw',
      keys: ['kgw', 'portland news', 'news'],
      title: 'KGW Portland',
      url: 'kgw-portland.com',
      snippet: 'Local news, updated continuously.',
      go: 'kgw-portland.com',
    },
    {
      id: 'i-hollow',
      keys: ['hollow coast', 'doug fir', 'band'],
      title: 'The Hollow Coast',
      url: 'pdxbands.com/the-hollow-coast',
      snippet: 'We are taking the rest of the year off. The van is for sale.',
      go: 'pdxbands.com/the-hollow-coast',
    },
    {
      id: 'i-registry',
      keys: ['oregon registry', 'nonprofit registry'],
      title: 'Oregon Nonprofit Registry',
      url: 'sos.oregon.gov/nonprofits',
      snippet: 'Search registered nonprofit corporations. Scanned filings 2008–present.',
      // Indexed, but not a page inside this simulation.
      go: null,
    },
  ],
}
