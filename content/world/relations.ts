import type { z } from 'zod'
import type { WorldRelationSchema } from '@/engine/world/schema'

type RelationInput = z.input<typeof WorldRelationSchema>

/**
 * The edges of the graph.
 *
 * A relation the player cannot trace back to something they could hold is the entity page
 * telling them the answer, which is the one thing it must not do. Left without `sources`, a
 * relation has to be grounded by an artifact that names both ends — and
 * `tests/unit/content.test.ts` fails the build when nothing does.
 */
export const relations: RelationInput[] = [
  {
    from: 'person.daniel-mercer',
    relation: 'employedBy',
    to: 'org.ridgeline',
    confidence: 'asserted',
  },
  {
    from: 'person.richard-vale',
    relation: 'employedBy',
    to: 'org.ridgeline',
    confidence: 'asserted',
    sources: ['w.ridgeline-about', 'w.business-journal-2011'],
  },
  {
    from: 'person.nadia-okafor',
    relation: 'employedBy',
    to: 'org.ridgeline',
    confidence: 'asserted',
  },
  {
    from: 'person.richard-vale',
    relation: 'relatedTo',
    to: 'org.marlow-foundation',
    validFrom: '2013',
    validUntil: '2014-03-14',
    confidence: 'asserted',
    sources: ['w.registry-marlow-2013', 'w.marlow-report-2013'],
  },
  {
    from: 'person.joel-reyes',
    relation: 'relatedTo',
    to: 'org.marlow-foundation',
    confidence: 'asserted',
    sources: ['w.registry-marlow-2013'],
  },
  {
    from: 'person.claire-mercer',
    relation: 'knows',
    to: 'person.daniel-mercer',
    confidence: 'asserted',
  },
  {
    from: 'person.daniel-mercer',
    relation: 'livesAt',
    to: 'place.alberta',
    confidence: 'asserted',
  },
  {
    from: 'person.daniel-mercer',
    relation: 'owns',
    to: 'device.nova-m12',
    confidence: 'asserted',
  },
  {
    from: 'person.amara-whitfield',
    relation: 'employedBy',
    to: 'org.kgw',
    confidence: 'asserted',
    sources: ['w.whitfield-byline'],
  },
]
