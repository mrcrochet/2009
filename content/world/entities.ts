import type { z } from 'zod'
import type { WorldEntitySchema } from '@/engine/world/schema'

type EntityInput = z.input<typeof WorldEntitySchema>

/**
 * Everyone and everything the world contains, whether or not the story needs them.
 *
 * Most of these people have nothing to do with Aion. Doreen is selling a kiln. Wesley is in a
 * band nobody has heard of. Don has been building the same model railway for eleven years. They
 * are not filler — they are the reason the one wrong thing lands. A world where every name leads
 * back to the antagonist is transparently artificial within twenty minutes.
 */
export const entities: EntityInput[] = [
  // ------------------------------------------------------------------- cast
  {
    id: 'person.owen-rask',
    type: 'person',
    canonicalName: 'Owen T. Rask',
    aliases: ['Rask', 'O. Rask', 'orask', 'o.rask'],
    metadata: {
      Occupation: 'Systems technician',
      Died: '19 December 2008',
      Notice: 'Columbia Register, December 2008',
    },
  },
  {
    id: 'person.marc-deleon',
    type: 'person',
    canonicalName: 'Marc Deleon',
    aliases: ['Deleon', 'm.deleon', 'Marc', 'saabman81'],
    metadata: {
      Address: '1822 SE 39th Ave, Portland',
      Telephone: '503-555-0148',
      Email: 'm.deleon@fastwebmail.net',
    },
  },
  {
    id: 'person.lea-voss',
    type: 'person',
    canonicalName: 'Lea Voss',
    aliases: ['Voss', 'lea.voss', 'Lea', 'L. Voss'],
    metadata: {
      Telephone: '503-555-0072',
      Occupation: 'Software developer, self-employed',
      Address: '2118 SE Ankeny St, apartment 4',
    },
  },
  {
    id: 'person.m',
    type: 'person',
    canonicalName: 'M',
    aliases: ['unknown_'],
    metadata: { Telephone: 'none listed', Note: 'No surname is recorded anywhere.' },
  },
  {
    id: 'person.julia-moran',
    type: 'person',
    canonicalName: 'Julia B. Moran',
    aliases: ['Moran', 'J. Moran'],
    metadata: { Died: '04 December 2008', Age: '41' },
  },
  {
    id: 'person.adaeze-okonkwo',
    type: 'person',
    canonicalName: 'Adaeze Okonkwo',
    aliases: ['Okonkwo', 'A. Okonkwo'],
    metadata: { Died: '11 December 2008', Age: '38' },
  },

  // ------------------------------------------------------- ordinary Portland
  {
    id: 'person.don-ackerley',
    type: 'person',
    canonicalName: 'Don Ackerley',
    aliases: ['Don', 'ackerley', 'D. Ackerley'],
    metadata: {
      Occupation: 'Retired, forty-one years on the railroad',
      Interest: 'N scale model railroading',
      Page: 'geohost.com/Terminal/4417',
    },
  },
  {
    id: 'person.karen-mabry',
    type: 'person',
    canonicalName: 'Karen Mabry',
    aliases: ['Karen', 'K. Mabry'],
    metadata: { Married: '14 August 2007', Page: 'geohost.com/Meadow/2210' },
  },
  {
    id: 'person.doug-mabry',
    type: 'person',
    canonicalName: 'Doug Mabry',
    aliases: ['Doug'],
    metadata: { Occupation: 'HVAC installer' },
  },
  {
    id: 'person.doreen-halloway',
    type: 'person',
    canonicalName: 'Doreen Halloway',
    aliases: ['Doreen', 'D. Halloway'],
    metadata: {
      Occupation: 'Potter',
      Address: 'SE Woodstock Blvd',
      Telephone: '503-555-0193',
    },
  },
  {
    id: 'person.wesley-pike',
    type: 'person',
    canonicalName: 'Wesley Pike',
    aliases: ['Wes', 'wespike', 'W. Pike'],
    metadata: { Occupation: 'Student, Portland State', Age: '20' },
  },
  {
    id: 'person.priya-raghunathan',
    type: 'person',
    canonicalName: 'Priya Raghunathan',
    aliases: ['Priya', 'P. Raghunathan'],
    metadata: { Occupation: 'Veterinary technician', Telephone: '503-555-0166' },
  },
  {
    id: 'person.gwen-sorrel',
    type: 'person',
    canonicalName: 'Gwen Sorrel',
    aliases: ['Gwen', 'G. Sorrel'],
    metadata: {
      Occupation: 'Office manager, until December',
      Telephone: '503-555-0129',
    },
  },
  {
    id: 'person.hal-ottoway',
    type: 'person',
    canonicalName: 'Hal Ottoway',
    aliases: ['Hal'],
    metadata: { Address: 'Gresham' },
  },
  {
    id: 'person.nora-kemp',
    type: 'person',
    canonicalName: 'Nora Kemp',
    aliases: ['Nora'],
    metadata: { Address: 'Beaverton', Note: 'Clearing out a storage unit.' },
  },
  {
    id: 'person.ted-bramble',
    type: 'person',
    canonicalName: 'Ted Bramble',
    aliases: ['Ted'],
    metadata: { Address: 'Hillsboro' },
  },
  {
    id: 'person.raymond-cott',
    type: 'person',
    canonicalName: 'Raymond Cott',
    aliases: ['Ray', 'R. Cott', 'raycott'],
    metadata: {
      Occupation: 'Counter clerk, Portland Auto Parts',
      Note: 'Answers the parts forum more than anyone else in Oregon.',
    },
  },
  {
    id: 'person.eileen-vasquez',
    type: 'person',
    canonicalName: 'Eileen Vasquez',
    aliases: ['Eileen', 'E. Vasquez'],
    metadata: { Occupation: 'Branch teller, Meridian Savings — SE Morrison' },
  },
  {
    id: 'person.stefan-orbe',
    type: 'person',
    canonicalName: 'Stefan Orbe',
    aliases: ['Orbe', 'S. Orbe'],
    metadata: {
      Occupation: 'Registered agent',
      Note: 'Named on filings for eleven Oregon companies since 2006.',
    },
  },

  // ------------------------------------------------------------ organisations
  {
    id: 'org.aion-group',
    type: 'organization',
    canonicalName: 'Aion Group LLC',
    aliases: ['Aion Group', 'Aion', 'AION GROUP LLC'],
    metadata: {
      Registered: '11 December 2008',
      Address: '1140 SE Morrison St, Portland OR',
      Contact: 'settlements@aion-group.com',
    },
  },
  {
    id: 'org.meridian-savings',
    type: 'organization',
    canonicalName: 'Meridian Savings & Loan',
    aliases: ['Meridian Savings', 'Meridian S&L', 'Meridian'],
    metadata: { Founded: '1961', Branches: '4', Note: 'Member FDIC' },
  },
  {
    id: 'org.meridian-wireless',
    type: 'organization',
    canonicalName: 'Meridian Wireless',
    aliases: ['Meridian Wireless'],
    metadata: { Note: 'Prepaid and contract. Same holding company as the bank.' },
  },
  {
    id: 'org.portland-auto-parts',
    type: 'organization',
    canonicalName: 'Portland Auto Parts',
    aliases: ['Portland Auto Parts', 'PAP'],
    metadata: { Address: '3400 SE Powell Blvd', Telephone: '503-555-0110' },
  },
  {
    id: 'org.columbia-register',
    type: 'organization',
    canonicalName: 'The Columbia Register',
    aliases: ['Columbia Register', 'the Register'],
    metadata: { Founded: '1894', Circulation: 'Portland metro' },
  },
  {
    id: 'org.blackbird-hosting',
    type: 'organization',
    canonicalName: 'Blackbird Hosting',
    aliases: ['Blackbird', 'Blackbird Hosting Co.'],
    metadata: {
      Note: 'Serves the Quiet Line ring graphic. No contact page since 2004.',
    },
  },
  {
    id: 'org.arcadia-ventures',
    type: 'organization',
    canonicalName: 'Arcadia Ventures',
    aliases: ['Arcadia'],
    metadata: { Note: 'Two partners. Passed on eleven of twelve Portland pitches in 2008.' },
  },
  {
    id: 'org.fenner-line',
    type: 'organization',
    canonicalName: 'The Fenner Line',
    aliases: ['Fenner Line', 'Fenner'],
    metadata: { Note: 'Four-piece. One demo, self-recorded, 2008.' },
  },
  {
    id: 'org.cascade-ceramics',
    type: 'organization',
    canonicalName: 'Cascade Ceramics Guild',
    aliases: ['Cascade Ceramics'],
    metadata: { Founded: '1978', Note: 'Meets second Tuesdays.' },
  },
  {
    id: 'org.hollis-funeral',
    type: 'organization',
    canonicalName: 'Hollis & Vane Funeral Directors',
    aliases: ['Hollis & Vane', 'Hollis and Vane'],
    metadata: { Address: '910 NE Fremont St', Note: 'Family firm, three generations.' },
  },
  {
    id: 'org.tradepost',
    type: 'organization',
    canonicalName: 'TradePost',
    aliases: ['TradePost'],
    metadata: { Note: 'Run by two people and a server in a closet.' },
  },

  // ------------------------------------------------------------------ places
  {
    id: 'place.1140-se-morrison',
    type: 'place',
    canonicalName: '1140 SE Morrison St',
    aliases: ['1140 SE Morrison', 'SE Morrison branch'],
    metadata: {
      Occupants: 'Meridian Savings & Loan (ground floor)',
      Note: 'Also the registrant address of record for at least one company.',
    },
  },
  {
    id: 'place.1822-se-39th',
    type: 'place',
    canonicalName: '1822 SE 39th Ave',
    aliases: ['1822 SE 39th'],
    metadata: { Occupant: 'Deleon, M.', Type: 'Duplex, upper unit' },
  },
  {
    id: 'place.sw-3rd-ash-garage',
    type: 'place',
    canonicalName: 'SW 3rd & Ash parking structure',
    aliases: ['SW 3rd & Ash', 'the parking structure'],
    metadata: { Levels: '6', Note: 'Nearest cell: PDX-CENTRAL-04' },
  },
  {
    id: 'place.2118-se-ankeny',
    type: 'place',
    canonicalName: '2118 SE Ankeny St',
    aliases: ['2118 SE Ankeny'],
    metadata: { Occupant: 'Voss, L. — apartment 4' },
  },

  // ---------------------------------------------------------------- vehicles
  {
    id: 'vehicle.saab-900-black',
    type: 'vehicle',
    canonicalName: 'Black Saab 900',
    aliases: ['Saab 900', 'the Saab', 'black Saab'],
    metadata: { Year: '1991', Plate: 'partial — 2 8 ?', State: 'Oregon' },
  },
  {
    id: 'vehicle.grey-sedan',
    type: 'vehicle',
    canonicalName: 'Grey sedan, no front plate',
    aliases: ['grey sedan', 'the grey car'],
    metadata: {
      Plate: 'Oregon, begins with 4',
      Note: 'Seen outside 2118 SE Ankeny on three consecutive nights. Not the Saab.',
    },
  },

  // ---------------------------------------------------------------- handles
  {
    id: 'handle.saabman81',
    type: 'handle',
    canonicalName: 'saabman81',
    aliases: ['saabman', 'saabman81'],
    metadata: { Board: 'Cascade Import Owners', Joined: 'March 2006' },
  },
  {
    id: 'handle.wespike',
    type: 'handle',
    canonicalName: 'wespike',
    aliases: ['wespike'],
    metadata: { Board: 'geohost guestbooks, mostly' },
  },
  {
    id: 'handle.raycott',
    type: 'handle',
    canonicalName: 'raycott',
    aliases: ['raycott'],
    metadata: { Board: 'Cascade Import Owners', Posts: '2,411' },
  },

  // ---------------------------------------------------------------- domains
  {
    id: 'domain.aion-group',
    type: 'domain',
    canonicalName: 'aion-group.com',
    aliases: ['aion-group.com'],
    metadata: { Registered: '11 December 2008', Nameservers: 'ns1/ns2.aion-group.com' },
  },
  {
    id: 'domain.geohost',
    type: 'domain',
    canonicalName: 'geohost.com',
    aliases: ['geohost.com', 'GeoHost'],
    metadata: { Note: 'Free pages. Nine of them carry the same graphic.' },
  },
  {
    id: 'domain.blackbird',
    type: 'domain',
    canonicalName: 'blackbird-hosting.net',
    aliases: ['blackbird-hosting.net'],
    metadata: { Registered: '02 February 1998', Note: 'Serves img.blackbird-hosting.net' },
  },

  // ---------------------------------------------------------------- devices
  {
    id: 'device.nokora-n90',
    type: 'device',
    canonicalName: 'Nokora N90 (serial XJ18172)',
    aliases: ['XJ18172', 'Nokora N90', 'N90'],
    metadata: {
      Carrier: 'Meridian Wireless, prepaid',
      Note: 'Camera writes its serial into every frame it takes.',
    },
  },
  {
    id: 'account.meridian-4471',
    type: 'account',
    canonicalName: 'Meridian checking ····4471',
    aliases: ['4471', '····4471'],
    metadata: { Opened: '06 January 2009', Branch: 'SE Morrison', Holder: 'RASK, O.' },
  },
]
