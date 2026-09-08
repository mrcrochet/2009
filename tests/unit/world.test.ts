import { describe, expect, it } from 'vitest'
import { WorldSchema } from '@/engine/world/schema'
import {
  artifactUrl,
  buildWorldIndex,
  conflictingPairs,
  entityDossier,
  factCoverage,
  isEntityKnown,
  knownEntities,
  resolveAlias,
  searchWorld,
  siblingPages,
  siteOf,
  worldAsOf,
} from '@/engine/world'
import { projectDay, projectedId } from '@/engine/world/project'
import { content, dispatch, fresh, run } from './helpers'

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
    {
      id: 'a.rumour',
      type: 'forumPost',
      date: '2008-12-01',
      title: 'who is aion group anyway',
      body: 'somebody i drink with says he does settlements for them. no idea if that is true.',
      source: 'nullcache.org',
      surface: 'web',
      mentions: ['org.aion-group'],
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
      // Nothing names them together. The rumour lives in one post, and that post is the only
      // reason the player ever hears it.
      sources: ['a.rumour'],
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
    expect(partial).toEqual({ found: 2, total: 3, conflicts: 0 })
  })

  /**
   * The distinction the schema could not previously make. Two of six because the world is large
   * and two of six because you are holding a lie are the same number, and the second is the
   * state this game is made of.
   */
  it('tells corroboration from contradiction, which are the same count', () => {
    const disputed = buildWorldIndex(
      WorldSchema.parse({
        ...world,
        artifacts: world.artifacts.map((a) =>
          a.id === 'a.bank-parts'
            ? { ...a, reliability: 'deceptive', contradicts: ['a.email-parts'] }
            : a,
        ),
      }),
    )

    // One trace of each: nothing to disagree with yet.
    expect(factCoverage(disputed, 'fact.marc-saab', new Set(['a.email-parts'])).conflicts).toBe(0)

    // Both in hand, and they cannot both be true.
    const both = factCoverage(
      disputed,
      'fact.marc-saab',
      new Set(['a.email-parts', 'a.bank-parts']),
    )
    expect(both).toEqual({ found: 2, total: 3, conflicts: 1 })

    // Declared in one direction, true in both.
    const pairs = conflictingPairs(disputed, new Set(['a.email-parts', 'a.bank-parts']))
    expect(pairs).toHaveLength(1)
    expect(pairs[0]!.map((a) => a.id).sort()).toEqual(['a.bank-parts', 'a.email-parts'])

    // And holding only one half of a disagreement is not a disagreement.
    expect(conflictingPairs(disputed, new Set(['a.bank-parts']))).toHaveLength(0)
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
  /** What the desktop is already showing at wake. Every count below is on top of it. */
  const AT_WAKE = ['d1.mail.m1', 'd1.file.readme']

  it('records what the player met, once', () => {
    let state = dispatch(fresh(), {
      type: 'WORLD_ARTIFACTS_SEEN',
      artifactIds: ['a.email-parts', 'a.classified'],
    })
    expect(state.discovered).toEqual([...AT_WAKE, 'a.email-parts', 'a.classified'])

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
    // Day 02's opening mail and file join it; nothing from Day 01 is taken away.
    expect(state.discovered).toEqual([...AT_WAKE, 'a.email-parts', 'd2.mail.m1', 'd2.file.readme'])
  })
})

describe('the world as of a date', () => {
  it('cannot answer questions about a document that has not been written', () => {
    // The classified is 5 November; the bank line is the 7th.
    const early = worldAsOf(world, '2008-11-05')
    expect(early.artifacts.map((a) => a.id)).toEqual(['a.email-parts', 'a.classified'])
  })

  it('takes a name away with its documents, rather than leaving it searchable and empty', () => {
    const early = worldAsOf(world, '2008-11-03')
    // Aion is mentioned only by the December post, so on 3 November Aion is not a name yet.
    expect(early.entities.map((e) => e.id)).not.toContain('org.aion-group')
    expect(searchWorld(buildWorldIndex(early), 'aion').total).toBe(0)
    // And the rumour that needed that post as its source goes with it.
    expect(early.relations.map((r) => r.relation)).not.toContain('employedBy')
  })

  it('keeps a fact only while something still carries it', () => {
    expect(worldAsOf(world, '2008-11-02').facts).toEqual([])
    expect(worldAsOf(world, '2008-11-03').facts.map((f) => f.id)).toEqual(['fact.marc-saab'])
  })
})

describe('an address leads somewhere', () => {
  it('takes the explicit url first, and falls back to a url-shaped source', () => {
    const page = index.world.artifacts.find((a) => a.id === 'a.classified')!
    // `tradepost.com/pdx/auto` was written as the source and is a real address.
    expect(artifactUrl(page)).toBe('tradepost.com/pdx/auto')
    expect(artifactUrl({ ...page, url: 'http://TradePost.com/pdx/auto/' })).toBe(
      'tradepost.com/pdx/auto',
    )
  })

  it('does not put a bank statement on the internet', () => {
    const txn = index.world.artifacts.find((a) => a.id === 'a.bank-parts')!
    // Its source is a bank, but even a hostname-shaped one would not make it a web page.
    expect(artifactUrl(txn)).toBeNull()
    expect(artifactUrl({ ...txn, url: 'meridiansavings.com/statement' })).toBeNull()
  })

  it('reads a source that names a place rather than an address as no address at all', () => {
    const mail = index.world.artifacts.find((a) => a.id === 'a.email-parts')!
    expect(artifactUrl({ ...mail, surface: 'web', source: 'Cascade Import Owners' })).toBeNull()
  })

  /**
   * The host is not the site. A free host in 2009 gave somebody a directory, and everything
   * under it was theirs; grouping by host puts fourteen strangers in one man's nav bar.
   */
  it('reads a site as the folder its pages sit in, not the host', () => {
    expect(siteOf('geohost.com/Terminal/4417/links.html')).toBe('geohost.com/Terminal/4417')
    expect(siteOf('geohost.com/Terminal/4417/stock.html')).toBe('geohost.com/Terminal/4417')
    // A front page has no filename to drop, and lands on its own site.
    expect(siteOf('geohost.com/Terminal/4417')).toBe('geohost.com/Terminal/4417')
    // Somebody else entirely.
    expect(siteOf('geohost.com/Meadow/2210/thanks.html')).toBe('geohost.com/Meadow/2210')
    expect(siteOf('tradepost.com')).toBe('tradepost.com')
  })

  it('offers the rest of the site and nobody else', () => {
    const site = buildWorldIndex(
      WorldSchema.parse({
        ...world,
        artifacts: [
          { ...world.artifacts[1]!, id: 'p.front', url: 'geohost.com/Terminal/4417' },
          { ...world.artifacts[1]!, id: 'p.links', url: 'geohost.com/Terminal/4417/links.html' },
          { ...world.artifacts[1]!, id: 'p.stock', url: 'geohost.com/Terminal/4417/stock.html' },
          { ...world.artifacts[1]!, id: 'p.other', url: 'geohost.com/Meadow/2210/thanks.html' },
        ],
      }),
    )
    const links = site.artifactById.get('p.links')!
    expect(siblingPages(site, links).map((p) => p.id)).toEqual(['p.front', 'p.stock'])
    // And the neighbour's page keeps to itself.
    expect(siblingPages(site, site.artifactById.get('p.other')!)).toEqual([])
  })

  it('answers what lives at an address', () => {
    expect(index.artifactByUrl.get('tradepost.com/pdx/auto')?.id).toBe('a.classified')
    expect(index.artifactByUrl.get('nowhere.example')).toBeUndefined()
  })
})

describe('reading something is finding it', () => {
  const names = ['Marc', 'Aion']
  const resolve = (name: string) => (name === 'Marc' ? 'person.marc-deleon' : 'org.aion-group')
  const projected = new Set(projectDay(content, { resolve, names }).map((a) => a.id))

  /**
   * The invariant the whole surface rests on. Discovery is derived in the reducer from the id
   * builders the projection uses; if the two ever drifted, the search would hold a document the
   * player has demonstrably read and refuse to admit it — and nothing else would fail.
   */
  it('names artifacts the projection actually built', () => {
    const state = run(fresh(), [
      { type: 'MAIL_OPENED', mailId: content.mail[0]!.id },
      { type: 'FILE_OPENED', fileId: 'readme' },
      { type: 'APP_OPENED', app: 'bank' },
      { type: 'PHONE_TOGGLED' },
      { type: 'PHONE_TAB_CHANGED', tab: 'photos' },
      { type: 'PHONE_TAB_CHANGED', tab: 'sms' },
      { type: 'BROWSER_NAVIGATED', url: content.browser.pages[0]!.url },
    ])

    expect(state.discovered.length).toBeGreaterThan(5)
    for (const id of state.discovered) expect(projected.has(id)).toBe(true)
  })

  it('finds the mail that was opened and not the mail that was not', () => {
    const first = content.mail[0]!
    const state = dispatch(fresh(), { type: 'MAIL_OPENED', mailId: first.id })
    expect(state.discovered).toContain(projectedId.mail(1, first.id))
    for (const other of content.mail.slice(1))
      expect(state.discovered).not.toContain(projectedId.mail(1, other.id))
  })

  it('reveals the SMS thread only as far as it has been read', () => {
    const sms = (state: { discovered: readonly string[] }) =>
      state.discovered.filter((id) => id.startsWith('d1.sms.'))

    let state = run(fresh(), [{ type: 'PHONE_TOGGLED' }, { type: 'PHONE_TAB_CHANGED', tab: 'sms' }])
    expect(sms(state)).toHaveLength(1)

    state = dispatch(state, { type: 'SMS_ADVANCED' })
    expect(sms(state)).toHaveLength(2)
    expect(sms(state).length).toBeLessThan(content.phone.sms.length)
  })

  it('does not record an address that resolves to nothing', () => {
    const before = fresh()
    const state = dispatch(before, { type: 'BROWSER_NAVIGATED', url: 'nowhere.example/missing' })
    expect(state.discovered).toEqual(before.discovered)
  })

  it('records the corpus document the browser found at an address the day never authored', () => {
    const state = dispatch(fresh(), {
      type: 'BROWSER_NAVIGATED',
      url: 'geohost.com/SunsetStrip/8802',
      worldArtifactId: 'art.fenner-line',
    })
    expect(state.discovered).toContain('art.fenner-line')
  })

  it('records a page once, however many times it is revisited', () => {
    const url = content.browser.pages[0]!.url
    const state = run(fresh(), [
      { type: 'BROWSER_NAVIGATED', url },
      { type: 'BROWSER_NAVIGATED', url: content.browser.pages[1]!.url },
      { type: 'BROWSER_WENT_BACK' },
      { type: 'BROWSER_NAVIGATED', url },
    ])
    expect(state.discovered.filter((id) => id === projectedId.web(1, url))).toHaveLength(1)
  })
})

describe('a name is not a licence to know somebody', () => {
  it('a discovered-only search does not surface a stranger', () => {
    // A name always matches a text search, so without a guard the palette would happily reveal
    // everyone in the world to a player who has met nobody. It is the most spoiling leak the
    // search can produce.
    const metNobody = new Set<string>()
    expect(searchWorld(index, 'marc', { discovered: metNobody }).total).toBe(0)
    expect(isEntityKnown(index, 'person.marc-deleon', metNobody)).toBe(false)
  })

  it('somebody exists once one thing mentioning them has been found', () => {
    const seen = new Set(['a.email-parts'])
    expect(isEntityKnown(index, 'person.marc-deleon', seen)).toBe(true)
    expect(searchWorld(index, 'marc', { discovered: seen }).hits[0]?.kind).toBe('entity')

    // Aion is mentioned by nothing that has been found, so Aion is still a stranger.
    expect(isEntityKnown(index, 'org.aion-group', seen)).toBe(false)
    expect(knownEntities(index, seen).map((e) => e.id)).toEqual([
      'person.marc-deleon',
      'vehicle.saab-900',
    ])
  })

  it('an unfiltered search still sees the whole world, for authoring', () => {
    expect(searchWorld(index, 'aion').total).toBeGreaterThan(0)
  })
})
