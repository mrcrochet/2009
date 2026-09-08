import { describe, expect, it } from 'vitest'
import { WorldSchema } from '@/engine/world/schema'
import {
  buildWorldIndex,
  entityDossier,
  factCoverage,
  resolveAlias,
  searchWorld,
} from '@/engine/world'
import { projectDay } from '@/engine/world/project'
import { content, dispatch, fresh } from './helpers'

/** A small world, so these tests do not depend on how much corpus has been authored yet. */
const world = WorldSchema.parse({
  entities: [
    {
      id: 'person.marc-deleon',
      type: 'person',
      canonicalName: 'Marc Deleon',
      aliases: ['Marc', 'Deleon', 'm.deleon', 'saabman81'],
      metadata: { 'Last known address': '1822 SE 39th Ave' },
    },
    { id: 'vehicle.saab-900', type: 'vehicle', canonicalName: 'Black Saab 900', aliases: ['Saab'] },
    { id: 'org.aion-group', type: 'organization', canonicalName: 'Aion Group', aliases: ['Aion'] },
  ],
  facts: [
    {
      id: 'fact.marc-saab',
      statement: 'Marc Deleon owns a black Saab 900.',
      about: ['person.marc-deleon', 'vehicle.saab-900'],
      register: 'ordinary',
    },
  ],
  artifacts: [
    {
      id: 'a.email-parts',
      type: 'email',
      date: '2008-11-03',
      title: 'need parts for the saab',
      body: 'the alternator went again. anyone know a yard that carries 900 parts',
      source: 'Corvid Mail',
      surface: 'mail',
      mentions: ['person.marc-deleon', 'vehicle.saab-900'],
      factId: 'fact.marc-saab',
    },
    {
      id: 'a.classified',
      type: 'classified',
      date: '2008-11-05',
      title: 'Saab 900 — parts wanted',
      body: 'alternator, any condition. cash.',
      source: 'tradepost.com/pdx/auto',
      surface: 'web',
      mentions: ['vehicle.saab-900'],
      factId: 'fact.marc-saab',
    },
    {
      id: 'a.bank-parts',
      type: 'transaction',
      date: '2008-11-07',
      title: 'PORTLAND AUTO PARTS',
      source: 'Meridian Savings',
      surface: 'bank',
      mentions: ['person.marc-deleon'],
      amountCents: -21400,
      factId: 'fact.marc-saab',
    },
  ],
  relations: [
    {
      from: 'person.marc-deleon',
      relation: 'owns',
      to: 'vehicle.saab-900',
      confidence: 'asserted',
    },
    {
      from: 'person.marc-deleon',
      relation: 'employedBy',
      to: 'org.aion-group',
      confidence: 'rumoured',
    },
  ],
})

const index = buildWorldIndex(world)
const all = new Set(world.artifacts.map((a) => a.id))

describe('the world is searchable', () => {
  it('answers from every surface at once', () => {
    const results = searchWorld(index, 'saab', { discovered: all })
    expect(results.total).toBeGreaterThan(2)
    // The shape that tells a player the world is bigger than their question.
    expect(Object.keys(results.bySurface).sort()).toEqual(['mail', 'people', 'web'])
  })

  it('does not reach a trace that never says the word', () => {
    // The bank line reads PORTLAND AUTO PARTS. It is a trace of the Saab, and searching "saab"
    // will never find it — which is correct, and is why the entity page exists. Search finds
    // text; a person's page is what assembles a fact out of things that do not share a word.
    const results = searchWorld(index, 'saab', { discovered: all })
    expect(results.hits.map((h) => h.id)).not.toContain('a.bank-parts')

    const dossier = entityDossier(index, 'person.marc-deleon', all)!
    expect(Object.keys(dossier.known).sort()).toEqual(['bank', 'mail'])
  })

  it('an entity outranks a mention of it', () => {
    const results = searchWorld(index, 'marc deleon', { discovered: all })
    expect(results.hits[0]?.kind).toBe('entity')
  })

  it('a handle reaches a person', () => {
    // The thing that makes a search feel like a world: you type what you found, not what you know.
    expect(resolveAlias(index, 'saabman81')?.id).toBe('person.marc-deleon')
    expect(searchWorld(index, 'saabman81', { discovered: all }).hits[0]?.id).toBe(
      'person.marc-deleon',
    )
  })

  it('shows only what the player has met', () => {
    const seenOne = new Set(['a.email-parts'])
    const results = searchWorld(index, 'saab', { discovered: seenOne })
    expect(results.hits.filter((h) => h.kind === 'artifact').map((h) => h.id)).toEqual([
      'a.email-parts',
    ])
  })

  it('does not fire on a single letter', () => {
    expect(searchWorld(index, 'a', { discovered: all }).total).toBe(0)
  })
})

describe('an entity page shows the gap', () => {
  it('counts what has not been found without listing it', () => {
    const dossier = entityDossier(index, 'person.marc-deleon', new Set(['a.email-parts']))!
    expect(dossier.knownCount).toBe(1)
    // Two more exist. The page says so and does not say where.
    expect(dossier.undiscoveredCount).toBe(1)
    expect(Object.keys(dossier.known)).toEqual(['mail'])
  })

  it('keeps a rumour distinguishable from a fact', () => {
    const dossier = entityDossier(index, 'person.marc-deleon', all)!
    const employment = dossier.relations.find((r) => r.relation.relation === 'employedBy')
    // The whole Day 01 trap is a claim that Marc works for Aion. The graph must not assert it.
    expect(employment?.relation.confidence).toBe('rumoured')
    expect(dossier.relations.find((r) => r.relation.relation === 'owns')?.relation.confidence).toBe(
      'asserted',
    )
  })

  it('returns nothing for somebody who does not exist', () => {
    expect(entityDossier(index, 'person.nobody', all)).toBeNull()
  })
})

describe('one fact, many surfaces', () => {
  it('two of three is enough to act on', () => {
    const partial = factCoverage(
      index,
      'fact.marc-saab',
      new Set(['a.email-parts', 'a.bank-parts']),
    )
    expect(partial).toEqual({ found: 2, total: 3 })
  })

  it('no fact is reachable from only one place', () => {
    // The rule the whole graph exists to serve. A fact with a single trace is a quest step.
    for (const fact of world.facts) {
      const { total } = factCoverage(index, fact.id, all)
      expect(total, fact.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('and its traces are spread across surfaces, not stacked on one', () => {
    for (const fact of world.facts) {
      const traces = index.artifactsByFact.get(fact.id) ?? []
      expect(new Set(traces.map((t) => t.surface)).size, fact.id).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('the day is part of the world', () => {
  const names = ['Marc', 'Aion', 'Rask', 'Lea', 'Meridian']
  const resolve = (name: string) =>
    ({
      Marc: 'person.marc-deleon',
      Aion: 'org.aion-group',
    })[name] ?? null

  it('projects Day 01 into the same graph the search reads', () => {
    const projected = projectDay(content, { resolve, names })
    // Otherwise there are two worlds: a graph nobody's story happens in, and a story the graph
    // has never heard of.
    expect(projected.length).toBeGreaterThan(20)
    expect(projected.map((a) => a.surface)).toContain('mail')
    expect(projected.map((a) => a.surface)).toContain('bank')
    expect(projected.map((a) => a.surface)).toContain('phone')

    const quota = projected.find((a) => a.title === 'Quota 01 — statement of obligation')
    expect(quota?.mentions).toContain('org.aion-group')
  })

  it('a projected artifact keeps the metadata a player can cross-reference', () => {
    const projected = projectDay(content, { resolve, names })
    const photo = projected.find((a) => a.id.includes('IMG_0114'))
    expect(photo?.fields.exif).toContain('22:08')
  })

  it('projected ids are stable across builds', () => {
    const a = projectDay(content, { resolve, names }).map((x) => x.id)
    const b = projectDay(content, { resolve, names }).map((x) => x.id)
    expect(a).toEqual(b)
    expect(new Set(a).size).toBe(a.length)
  })
})

describe('discovery', () => {
  it('records what the player met, once', () => {
    let state = dispatch(fresh(), {
      type: 'WORLD_ARTIFACTS_SEEN',
      artifactIds: ['a.email-parts', 'a.classified'],
    })
    expect(state.discovered).toEqual(['a.email-parts', 'a.classified'])

    const before = state
    state = dispatch(state, { type: 'WORLD_ARTIFACTS_SEEN', artifactIds: ['a.email-parts'] })
    expect(state).toBe(before)
  })

  it('survives the night, because meeting something is not undone by sleeping', () => {
    let state = dispatch(fresh(), { type: 'WORLD_ARTIFACTS_SEEN', artifactIds: ['a.email-parts'] })
    state = dispatch(state, {
      type: 'DAY_ADVANCED',
      day: 2,
      dateISO: '2009-01-16',
      wakeMinute: 400,
      threadIds: ['unknown', 'marc', 'lea'],
      firstMailId: 'm1',
      firstFileId: 'readme',
      browserHome: 'corvid.com',
      terminalBanner: content.terminal.banner,
    })
    expect(state.discovered).toEqual(['a.email-parts'])
  })
})
