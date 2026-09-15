import type { z } from 'zod'
import type { WorldEntitySchema } from '@/engine/world/schema'

type EntityInput = z.input<typeof WorldEntitySchema>

/**
 * Everything the world contains, independently of the case a player meets it in.
 *
 * `aliases` is what makes a search feel like a world rather than a database: somebody types a
 * handle from a forum and reaches a person.
 */
export const entities: EntityInput[] = [
  {
    id: 'person.daniel-mercer',
    type: 'person',
    canonicalName: 'Daniel Mercer',
    aliases: ['Daniel James Mercer', 'D. Mercer', 'dmercer'],
    metadata: { age: '34', lives: '2214 NE Alberta St, Portland', works: 'Ridgeline Partners' },
  },
  {
    id: 'person.claire-mercer',
    type: 'person',
    canonicalName: 'Claire Mercer',
    aliases: ['C. Mercer'],
    metadata: { relation: 'Sister of Daniel Mercer', works: 'Vernon Elementary' },
  },
  {
    id: 'person.richard-vale',
    type: 'person',
    canonicalName: 'Richard Vale',
    aliases: ['R. Vale', 'Richard A. Vale'],
    metadata: { role: 'Managing Partner, Ridgeline Partners' },
  },
  {
    id: 'person.nadia-okafor',
    type: 'person',
    canonicalName: 'Nadia Okafor',
    // The address is how the corpus reaches her: her name is never typed in the mail she sends.
    aliases: ['N. Okafor', 'nokafor', 'okafor'],
    metadata: { role: 'Analyst, Ridgeline Partners' },
  },
  {
    id: 'person.amara-whitfield',
    type: 'person',
    canonicalName: 'Amara Whitfield',
    aliases: ['A. Whitfield'],
    metadata: { role: 'Reporter, KGW Portland' },
  },
  {
    id: 'person.joel-reyes',
    type: 'person',
    canonicalName: 'Joel Reyes',
    aliases: ['J. Reyes'],
    metadata: { role: 'Treasurer, the Marlow Foundation (2013)' },
  },
  {
    id: 'org.ridgeline',
    type: 'organization',
    canonicalName: 'Ridgeline Partners',
    aliases: ['Ridgeline'],
    metadata: { founded: '2011', city: 'Portland, Oregon' },
  },
  {
    id: 'org.marlow-foundation',
    type: 'organization',
    canonicalName: 'The Marlow Foundation',
    aliases: ['Marlow Foundation', 'Marlow'],
    metadata: { founded: '2009', type: 'Private foundation' },
  },
  {
    id: 'org.kgw',
    type: 'organization',
    canonicalName: 'KGW Portland',
    aliases: ['KGW'],
    metadata: { type: 'Local news' },
  },
  {
    id: 'org.hollow-coast',
    type: 'organization',
    canonicalName: 'The Hollow Coast',
    aliases: ['Hollow Coast'],
    metadata: { type: 'Band', status: 'On hiatus' },
  },
  {
    id: 'place.fremont-lot',
    type: 'place',
    canonicalName: 'Fremont Street Parking',
    aliases: ['Fremont lot', '1140 NE Fremont St'],
    metadata: { hours: 'Open 24 hours', levels: '4' },
  },
  {
    id: 'place.alberta',
    type: 'place',
    canonicalName: '2214 NE Alberta St',
    aliases: ['Alberta St', 'the Alberta house'],
    metadata: { city: 'Portland, Oregon' },
  },
  {
    id: 'person.alice-marlow',
    type: 'person',
    canonicalName: 'Alice Marlow',
    aliases: ['A. Marlow'],
    metadata: { role: 'Chair, the Marlow Foundation' },
  },
  {
    id: 'person.peter-brandt',
    type: 'person',
    canonicalName: 'Peter Brandt',
    aliases: ['P. Brandt', 'brandtp'],
    metadata: { note: 'Tuesday Night Hill Club' },
  },
  {
    id: 'person.sofia-ellery',
    type: 'person',
    canonicalName: 'Sofia Ellery',
    aliases: ['S. Ellery'],
    metadata: { note: 'Runs a ceramics studio on SE Division' },
  },
  {
    id: 'person.marguerite-hoy',
    type: 'person',
    canonicalName: 'Marguerite Hoy',
    aliases: ['M. Hoy'],
    metadata: { note: 'Alberta Street, owner of a grey tabby' },
  },
  {
    id: 'org.cascade-mobile',
    type: 'organization',
    canonicalName: 'Cascade Mobile',
    aliases: ['Cascade'],
    metadata: { type: 'Carrier' },
  },
  {
    id: 'org.vernon-elementary',
    type: 'organization',
    canonicalName: 'Vernon Elementary',
    aliases: ['Vernon'],
    metadata: { type: 'Portland Public Schools' },
  },
  {
    id: 'org.hill-club',
    type: 'organization',
    canonicalName: 'Tuesday Night Hill Club',
    aliases: ['Hill Club'],
    metadata: { type: 'Cycling club' },
  },
  {
    id: 'org.alberta-main-street',
    type: 'organization',
    canonicalName: 'Alberta Main Street',
    aliases: ['Alberta Main St'],
    metadata: { type: 'Business association' },
  },
  {
    id: 'place.doug-fir',
    type: 'place',
    canonicalName: 'Doug Fir Lounge',
    aliases: ['Doug Fir'],
    metadata: { city: 'Portland, Oregon' },
  },
  {
    id: 'place.division-studio',
    type: 'place',
    canonicalName: '3340 SE Division St',
    aliases: ['the Division studio'],
    metadata: { use: 'Ceramics studio, 2015–2026' },
  },
  {
    id: 'device.nova-m12',
    type: 'device',
    canonicalName: "Daniel Mercer's NOVA M12",
    aliases: ['NOVA M12'],
    metadata: { carrier: 'Cascade Mobile', lastSync: '09 Jun 2026 22:51' },
  },
]
