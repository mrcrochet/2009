import type { z } from 'zod'
import type { WorldRelationSchema } from '@/engine/world/schema'

type RelationInput = z.input<typeof WorldRelationSchema>

/**
 * How the world is joined up.
 *
 * `confidence` is the load-bearing field. `asserted` is a fact of the fiction. `inferred` is
 * something a player could work out from the artifacts and that the world will therefore show them
 * having worked out. `rumoured` is somebody's claim, and it may simply be wrong — Lea believes the
 * grey sedan is connected to her, and the world does not know whether she is right.
 *
 * The entity page must not present the third as the first.
 */
export const relations: RelationInput[] = [
  // ------------------------------------------------------------- the Saab
  {
    from: 'person.marc-deleon',
    relation: 'owns',
    to: 'vehicle.saab-900-black',
    validFrom: '2006-02',
    confidence: 'asserted',
  },
  {
    from: 'person.marc-deleon',
    relation: 'usesHandle',
    to: 'handle.saabman81',
    validFrom: '2006-03-14',
    confidence: 'inferred',
  },
  {
    from: 'vehicle.saab-900-black',
    relation: 'locatedAt',
    to: 'place.1822-se-39th',
    confidence: 'inferred',
  },

  // ------------------------------------------------------------- the phone
  {
    from: 'person.marc-deleon',
    relation: 'owns',
    to: 'device.nokora-n90',
    validFrom: '2007-08',
    validUntil: '2008-12-29',
    confidence: 'asserted',
  },
  {
    from: 'person.owen-rask',
    relation: 'owns',
    to: 'device.nokora-n90',
    validFrom: '2008-12-29',
    confidence: 'asserted',
  },
  {
    from: 'device.nokora-n90',
    relation: 'registeredTo',
    to: 'org.meridian-wireless',
    confidence: 'asserted',
  },
  {
    from: 'handle.saabman81',
    relation: 'relatedTo',
    to: 'device.nokora-n90',
    confidence: 'inferred',
  },

  // ------------------------------------------------------------ where people live
  {
    from: 'person.marc-deleon',
    relation: 'livesAt',
    to: 'place.1822-se-39th',
    validFrom: '2007-09-01',
    confidence: 'asserted',
  },
  {
    from: 'person.lea-voss',
    relation: 'livesAt',
    to: 'place.2118-se-ankeny',
    validFrom: '2006-06',
    confidence: 'asserted',
  },

  // -------------------------------------------------------------- who knows whom
  { from: 'person.owen-rask', relation: 'knows', to: 'person.marc-deleon', confidence: 'asserted' },
  { from: 'person.owen-rask', relation: 'knows', to: 'person.lea-voss', confidence: 'asserted' },
  { from: 'person.marc-deleon', relation: 'knows', to: 'person.lea-voss', confidence: 'inferred' },
  {
    from: 'person.marc-deleon',
    relation: 'knows',
    to: 'person.m',
    confidence: 'rumoured',
    // Nothing names Marc. A post nobody signed, four days after the handset changed hands, in
    // the voice of a man who has agreed to something — is the whole of the evidence, and it is
    // a rumour precisely because that is all it is.
    sources: ['art.m-nullcache-post'],
  },
  {
    from: 'person.marc-deleon',
    relation: 'knows',
    to: 'person.raymond-cott',
    validFrom: '2006-03',
    confidence: 'asserted',
  },
  {
    from: 'person.karen-mabry',
    relation: 'knows',
    to: 'person.doug-mabry',
    confidence: 'asserted',
  },
  {
    from: 'person.doreen-halloway',
    relation: 'knows',
    to: 'org.cascade-ceramics',
    validFrom: '1978',
    validUntil: '2009-01-03',
    confidence: 'asserted',
  },
  {
    from: 'person.wesley-pike',
    relation: 'knows',
    to: 'person.don-ackerley',
    confidence: 'rumoured',
  },

  // ------------------------------------------------------------------- employment
  {
    from: 'person.raymond-cott',
    relation: 'employedBy',
    to: 'org.portland-auto-parts',
    validFrom: '1998',
    confidence: 'asserted',
  },
  {
    from: 'person.eileen-vasquez',
    relation: 'employedBy',
    to: 'org.meridian-savings',
    validFrom: '2000',
    confidence: 'asserted',
  },
  {
    from: 'person.doug-mabry',
    relation: 'knows',
    to: 'org.portland-auto-parts',
    confidence: 'asserted',
  },

  // -------------------------------------------------------------------- handles
  {
    from: 'person.wesley-pike',
    relation: 'usesHandle',
    to: 'handle.wespike',
    confidence: 'asserted',
  },
  {
    from: 'person.raymond-cott',
    relation: 'usesHandle',
    to: 'handle.raycott',
    validFrom: '2002-02-04',
    confidence: 'inferred',
  },

  // ------------------------------------------------------------------- addresses
  {
    from: 'org.meridian-savings',
    relation: 'locatedAt',
    to: 'place.1140-se-morrison',
    validFrom: '1974',
    confidence: 'asserted',
  },
  {
    from: 'org.aion-group',
    relation: 'locatedAt',
    to: 'place.1140-se-morrison',
    validFrom: '2008-12-11',
    confidence: 'asserted',
  },
  {
    from: 'person.gwen-sorrel',
    relation: 'locatedAt',
    to: 'place.1140-se-morrison',
    validUntil: '2008-12-19',
    confidence: 'inferred',
  },
  {
    from: 'account.meridian-4471',
    relation: 'registeredTo',
    to: 'person.owen-rask',
    validFrom: '2009-01-06',
    confidence: 'asserted',
  },
  {
    from: 'account.meridian-4471',
    relation: 'locatedAt',
    to: 'place.1140-se-morrison',
    confidence: 'asserted',
  },

  // --------------------------------------------------------------------- filings
  {
    from: 'org.aion-group',
    relation: 'registeredTo',
    to: 'person.stefan-orbe',
    validFrom: '2008-12-11',
    confidence: 'asserted',
  },
  {
    from: 'domain.aion-group',
    relation: 'registeredTo',
    to: 'org.aion-group',
    validFrom: '2008-12-11',
    confidence: 'asserted',
  },
  {
    from: 'org.aion-group',
    relation: 'relatedTo',
    to: 'org.blackbird-hosting',
    confidence: 'rumoured',
  },
  {
    from: 'domain.blackbird',
    relation: 'registeredTo',
    to: 'org.blackbird-hosting',
    validFrom: '1998-02-02',
    confidence: 'asserted',
  },
  {
    from: 'org.hollis-funeral',
    relation: 'foundedBy',
    to: 'org.hollis-funeral',
    validFrom: '1931',
    confidence: 'asserted',
  },

  // ---------------------------------------------------------------- the ordinary
  {
    from: 'person.don-ackerley',
    relation: 'relatedTo',
    to: 'domain.geohost',
    validFrom: '1998',
    confidence: 'asserted',
  },
  {
    from: 'person.karen-mabry',
    relation: 'relatedTo',
    to: 'domain.geohost',
    validFrom: '2007',
    confidence: 'asserted',
  },
  {
    from: 'org.fenner-line',
    relation: 'relatedTo',
    to: 'domain.geohost',
    validFrom: '2006',
    confidence: 'asserted',
  },
  {
    from: 'person.wesley-pike',
    relation: 'relatedTo',
    to: 'org.fenner-line',
    validFrom: '2005',
    validUntil: '2008-12-06',
    confidence: 'asserted',
  },
  {
    from: 'org.cascade-ceramics',
    relation: 'relatedTo',
    to: 'domain.geohost',
    confidence: 'asserted',
  },
  {
    from: 'person.lea-voss',
    relation: 'relatedTo',
    to: 'org.arcadia-ventures',
    validFrom: '2008-11',
    validUntil: '2008-11-21',
    confidence: 'asserted',
  },
  {
    from: 'person.nora-kemp',
    relation: 'relatedTo',
    to: 'vehicle.saab-900-black',
    confidence: 'rumoured',
  },
  {
    from: 'person.owen-rask',
    relation: 'relatedTo',
    to: 'org.hollis-funeral',
    validFrom: '2008-12-19',
    confidence: 'asserted',
  },
  {
    from: 'person.julia-moran',
    relation: 'relatedTo',
    to: 'org.hollis-funeral',
    validFrom: '2008-12-04',
    confidence: 'asserted',
  },
  {
    from: 'person.adaeze-okonkwo',
    relation: 'relatedTo',
    to: 'org.hollis-funeral',
    validFrom: '2008-12-11',
    confidence: 'asserted',
  },

  // ----------------------------------------------------------- what Lea believes
  {
    from: 'vehicle.grey-sedan',
    relation: 'locatedAt',
    to: 'place.2118-se-ankeny',
    validFrom: '2009-01-12',
    confidence: 'rumoured',
  },
  {
    from: 'vehicle.grey-sedan',
    relation: 'relatedTo',
    to: 'person.lea-voss',
    confidence: 'rumoured',
  },
]
