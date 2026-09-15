import type { z } from 'zod'
import type { WorldFactSchema } from '@/engine/world/schema'

type FactInput = z.input<typeof WorldFactSchema>

/**
 * What the world knows, authored separately from the traces that carry it.
 *
 * `register` is the density control. Out of every hundred pages the investigator reads, most
 * should be completely ordinary. If every site is about the case, the world is transparently
 * artificial within twenty minutes.
 *
 * Statements are for authors and are never shown. Write them as flat assertions — the drama
 * belongs in the artifacts, and a fact that reads as ominous here usually means its traces are
 * doing too little work.
 */
export const facts: FactInput[] = [
  {
    id: 'fact.fremont-loop',
    statement: 'The Fremont Street lot keeps its barrier camera footage on an eleven-day loop.',
    about: ['place.fremont-lot'],
    register: 'ordinary',
  },
  {
    id: 'fact.nadia-cycles',
    statement: 'Nadia Okafor rides with a Tuesday-night cycling club and sold a bike in May.',
    about: ['person.nadia-okafor'],
    register: 'ordinary',
  },
  {
    id: 'fact.hollow-coast-hiatus',
    statement: 'The Hollow Coast stopped playing after a show at the Doug Fir on 30 May.',
    about: ['org.hollow-coast'],
    register: 'ordinary',
  },
  {
    id: 'fact.claire-teaches',
    statement: 'Claire Mercer teaches fourth grade at Vernon Elementary.',
    about: ['person.claire-mercer'],
    register: 'ordinary',
  },
  {
    id: 'fact.ridgeline-founded',
    statement: 'Richard Vale founded Ridgeline Partners in 2011 with two other partners.',
    about: ['person.richard-vale', 'org.ridgeline'],
    register: 'economic',
  },
  {
    id: 'fact.vale-marlow-2013',
    statement:
      'Richard Vale was a director of the Marlow Foundation in 2013 and resigned in March 2014.',
    about: ['person.richard-vale', 'org.marlow-foundation'],
    register: 'suggestive',
  },
]
