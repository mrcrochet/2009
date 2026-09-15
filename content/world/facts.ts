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
    id: 'fact.brandt-knee',
    statement: 'Peter Brandt tore a meniscus in April and has not ridden since.',
    about: ['person.peter-brandt', 'org.hill-club'],
    register: 'ordinary',
  },
  {
    id: 'fact.alberta-closure',
    statement:
      'Alberta Street between 21st and 26th is closed to traffic for the 4 July block party.',
    about: ['org.alberta-main-street', 'place.alberta'],
    register: 'ordinary',
  },

  // ------------------------------------------------------------------ economic
  {
    id: 'fact.alberta-rents',
    statement: 'Commercial rents on Alberta rose about a fifth between 2024 and 2026.',
    about: ['org.alberta-main-street', 'place.alberta'],
    register: 'economic',
  },

  /*
   * ---------------------------------------------------------------- side story
   *
   * A complete small story with a beginning and an end, and nothing to do with the case. This
   * is the layer that makes the corpus a world rather than a set of props: somebody reads four
   * pages about a cat because they are following it, and finds out it came home.
   */
  {
    id: 'fact.pilot-comes-home',
    statement:
      'Marguerite Hoy\u2019s cat Pilot went missing on 7 June and was returned on 15 June by a neighbour who had shut him in a garage.',
    about: ['person.marguerite-hoy', 'place.alberta'],
    register: 'sideStory',
  },
  {
    id: 'fact.kiln-sold',
    statement:
      'Sofia Ellery closed her Division Street studio after eleven years, sold the kiln, and fired the last load on 6 June.',
    about: ['person.sofia-ellery', 'place.division-studio'],
    register: 'sideStory',
  },

  // --------------------------------------------------------------- suggestive
  {
    id: 'fact.vale-marlow-2013',
    statement:
      'Richard Vale was a director of the Marlow Foundation in 2013 and resigned in March 2014.',
    about: ['person.richard-vale', 'org.marlow-foundation'],
    register: 'suggestive',
  },
  {
    id: 'fact.marlow-single-donor',
    statement:
      'In 2013 the Marlow Foundation received a single anonymous contribution of $4.1m and disbursed the whole of it within the same financial year.',
    about: ['org.marlow-foundation', 'person.alice-marlow'],
    register: 'suggestive',
  },

  /*
   * ---------------------------------------------------------------- anomalous
   *
   * One per hundred pages, and it has to earn it. Nothing in the case explains why a managed
   * forensic workstation mirrors its session to a peer nobody assigned — and the two traces of
   * it are a vendor support page and somebody else noticing the same thing, which is exactly
   * how a player would find out they are not the only one.
   */
  {
    id: 'fact.session-mirror',
    statement:
      'Managed NOVA workstations can mirror a session to a peer address, and the mirror is not listed in the case volume that the session is working.',
    about: ['org.ridgeline'],
    register: 'anomalous',
  },
]
