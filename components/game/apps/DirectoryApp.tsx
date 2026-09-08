'use client'

import { useMemo, useState } from 'react'
import { displayDate, entityDossier, factCoverage, knownEntities } from '@/engine/world'
import type { RelationTypeSchema, WorldArtifact, WorldEntity } from '@/engine/world/schema'
import type { z } from 'zod'
import { useWorldOptional } from '../WorldContext'
import { useDirectoryFocus } from '../DirectoryFocus'

type RelationType = z.infer<typeof RelationTypeSchema>

/**
 * The directory: a person, and everything about them the player has actually found.
 *
 * The number that matters most on this page is the one for what they have *not* found. A dossier
 * that only shows what you hold reads like a summary; a dossier that says "seventeen found, six
 * not yet" tells you there is more without telling you where, which is the difference between a
 * report and an investigation.
 */

const SURFACE_LABEL: Readonly<Record<string, string>> = {
  mail: 'Mail',
  msg: 'Messages',
  phone: 'Phone',
  files: 'Files',
  bank: 'Bank',
  web: 'Web',
  archive: 'Archive',
  term: 'System',
}

const RELATION_PHRASE: Readonly<Record<RelationType, string>> = {
  knows: 'knows',
  employedBy: 'works for',
  owns: 'owns',
  registeredTo: 'is registered to',
  livesAt: 'lives at',
  locatedAt: 'is at',
  foundedBy: 'was founded by',
  usesHandle: 'posts as',
  relatedTo: 'is connected to',
}

/**
 * How sure the world is, and how the page says so.
 *
 * Colour would not be enough and a coloured badge would not be much better. The real fix is
 * grammar: a rumour is written as reported speech. "Marc works for the Aion Group" and "Somebody
 * says Marc works for the Aion Group" cannot be confused for one another by anybody, including a
 * player skimming, including a screen reader. Presenting a claim in the same sentence shape as a
 * document *is* the problem, so the sentence shape changes.
 */
const CONFIDENCE = {
  asserted: {
    heading: 'ON RECORD',
    note: 'Documented. You have seen where each of these comes from.',
    mark: '▪',
    lead: (sentence: string) => sentence,
  },
  inferred: {
    heading: 'INFERRED',
    note: 'Stated nowhere. Worked out from things you hold.',
    mark: '▫',
    lead: (sentence: string) => `${sentence} — you worked this out`,
  },
  rumoured: {
    heading: 'CLAIMED — UNVERIFIED',
    note: 'Somebody said this. Nothing you hold supports it.',
    mark: '?',
    lead: (sentence: string) =>
      `Somebody says ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`,
  },
} as const

type Confidence = keyof typeof CONFIDENCE
const CONFIDENCE_ORDER: readonly Confidence[] = ['asserted', 'inferred', 'rumoured']

/**
 * One half of a disagreement.
 *
 * The quoted line where a document has one, because "stayed in all evening" set against "IN
 * 01/14/09 21:47" is the moment; two file names set against each other is a filing system
 * telling you to go and read something.
 */
function ConflictSide({ artifact }: { artifact: WorldArtifact }) {
  const line = artifact.disputedClaim
  return (
    <span className="hal-dir__conflictside">
      <span className={line ? 'hal-dir__conflictquote' : 'hal-dir__conflicttitle'}>
        {line ? `“${line}”` : artifact.title || artifact.source}
      </span>
      <span className="hal-dir__conflictmeta">
        {line ? `${artifact.title || artifact.source} · ` : ''}
        {artifact.source} · {displayDate(artifact.date)}
      </span>
    </span>
  )
}

/**
 * What the player is told about a fact they are partway through.
 *
 * It never says which document is wrong. Naming the lie would make this page an answer key; the
 * useful thing — and the harder one — is knowing that two things you are holding cannot both be
 * true, and having to work out which.
 */
function traceLine(fact: { found: number; total: number; conflicts: number }): string {
  const held = `${fact.found} of ${fact.total} traces found`
  if (fact.conflicts === 1) return `${held} — two of them cannot both be true`
  if (fact.conflicts > 1) return `${held} — ${fact.conflicts} pairs of them cannot both be true`
  return fact.found < fact.total ? `${held} — the rest are somewhere` : held
}

const GROUPS: readonly {
  readonly heading: string
  readonly types: readonly WorldEntity['type'][]
}[] = [
  { heading: 'PEOPLE', types: ['person'] },
  { heading: 'ORGANIZATIONS', types: ['organization'] },
  { heading: 'PLACES', types: ['place'] },
  { heading: 'OTHER', types: ['vehicle', 'account', 'handle', 'domain', 'device'] },
]

export function DirectoryApp() {
  const world = useWorldOptional()
  const focus = useDirectoryFocus()
  const [selectedId, setSelectedId] = useState<string | null>(focus)

  /*
   * A search that sends the player here has already chosen who they wanted. Adopted during
   * render rather than in an effect, so the window never paints somebody else first.
   */
  const [lastFocus, setLastFocus] = useState(focus)
  if (lastFocus !== focus) {
    setLastFocus(focus)
    if (focus) setSelectedId(focus)
  }

  /**
   * Only people the player has actually run into.
   *
   * Listing the whole graph would hand them the season's cast on the first morning, in
   * alphabetical order, with the dates of death filled in. The directory is not a database of
   * the world; it is what this machine has learned, and on Day 01 that is almost nothing.
   */
  const known = useMemo(() => (world ? knownEntities(world.index, world.discovered) : []), [world])

  const groups = useMemo(
    () =>
      GROUPS.map((group) => ({
        heading: group.heading,
        entities: known
          .filter((e) => group.types.includes(e.type))
          .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName)),
      })).filter((g) => g.entities.length > 0),
    [known],
  )

  /**
   * A dossier only exists for somebody the player has met.
   *
   * The search deliberately shows the whole world, so it can send the player to a name they have
   * never encountered. That is a good tease and it must not become a briefing: no aliases, no
   * address, no date of death for a person nothing they hold has mentioned.
   */
  const dossier = useMemo(() => {
    if (!world || !selectedId) return null
    if (!known.some((e) => e.id === selectedId)) return null
    return entityDossier(world.index, selectedId, world.discovered)
  }, [world, known, selectedId])

  const stranger = useMemo(() => {
    if (!world || !selectedId || dossier) return null
    return world.index.entityById.get(selectedId) ?? null
  }, [world, selectedId, dossier])

  /**
   * How many traces of each fact the player holds. Two of six is usually enough to act on, and
   * the remaining four are why the world feels larger than the case.
   */
  const facts = useMemo(() => {
    if (!world || !dossier) return []
    const ids = new Set<string>()
    for (const list of Object.values(dossier.known)) {
      for (const artifact of list) if (artifact.factId) ids.add(artifact.factId)
    }
    return [...ids].map((factId) => ({
      factId,
      ...factCoverage(world.index, factId, world.discovered),
    }))
  }, [world, dossier])

  const disputed = facts.some((fact) => fact.conflicts > 0)

  if (!world) {
    return (
      <div className="hal-dir__empty">
        <p>The directory is not available on this machine.</p>
      </div>
    )
  }

  return (
    <>
      <div className="hal-dir__list" role="listbox" aria-label="Directory">
        {groups.map((group) => (
          <div key={group.heading}>
            <div className="hal-dir__grouphead">{group.heading}</div>
            {group.entities.map((entity) => (
              <button
                key={entity.id}
                type="button"
                role="option"
                className="hal-dir__row"
                aria-selected={selectedId === entity.id}
                data-entity={entity.id}
                onClick={() => setSelectedId(entity.id)}
              >
                {entity.canonicalName}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="hal-dir__page">
        {stranger ? (
          <div className="hal-dir__empty">
            <p>{stranger.canonicalName}</p>
            <p>
              The name has come up in a search of this machine. Nothing you have read mentions them,
              so there is nothing here yet.
            </p>
          </div>
        ) : !dossier ? (
          <div className="hal-dir__empty">
            <p>{known.length === 0 ? 'Nobody yet.' : 'Nobody selected.'}</p>
            <p>
              {known.length === 0
                ? 'Names appear here once you have read something that mentions them.'
                : `${known.length} ${known.length === 1 ? 'name has' : 'names have'} come up so far. Most of them will never matter.`}
            </p>
          </div>
        ) : (
          <>
            <h1 className="hal-dir__name">{dossier.entity.canonicalName}</h1>
            <div className="hal-dir__type">{dossier.entity.type}</div>

            {dossier.entity.aliases.length > 0 ? (
              <div className="hal-dir__aliases">Also: {dossier.entity.aliases.join(' · ')}</div>
            ) : null}

            <div className="hal-dir__section">
              <div className="hal-dir__sectionhead">WHAT YOU HAVE</div>
              <dl className="hal-dir__counts">
                {Object.entries(dossier.known).map(([surface, list]) => (
                  <div key={surface} className="hal-dir__count">
                    <dt>{SURFACE_LABEL[surface] ?? surface}</dt>
                    <dd>{list.length}</dd>
                  </div>
                ))}
              </dl>
              <p className="hal-dir__gap">
                {dossier.knownCount} found
                {dossier.undiscoveredCount > 0
                  ? ` · ${dossier.undiscoveredCount} not yet found`
                  : ' · nothing else on record'}
              </p>
              {dossier.firstSeen ? (
                <p className="hal-dir__span">
                  First appears {displayDate(dossier.firstSeen)}
                  {dossier.lastSeen && dossier.lastSeen !== dossier.firstSeen
                    ? ` · last ${displayDate(dossier.lastSeen)}`
                    : null}
                </p>
              ) : null}
            </div>

            {facts.length > 0 ? (
              <div className="hal-dir__section">
                <div className="hal-dir__sectionhead">
                  {disputed ? 'CORROBORATION — DISPUTED' : 'CORROBORATION'}
                </div>
                <ul className="hal-dir__facts">
                  {facts.map((fact) => (
                    <li
                      key={fact.factId}
                      className="hal-dir__fact"
                      data-conflicts={fact.conflicts > 0 ? 'yes' : undefined}
                    >
                      {traceLine(fact)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {dossier.conflicts.length > 0 ? (
              <div className="hal-dir__section hal-dir__section--conflict">
                <div className="hal-dir__sectionhead">DOES NOT ADD UP</div>
                <p className="hal-dir__relnote">
                  {dossier.conflicts.length === 1
                    ? 'Two things you have cannot both be true.'
                    : `${dossier.conflicts.length} pairs of things you have cannot both be true.`}
                </p>
                <ul className="hal-dir__conflicts">
                  {dossier.conflicts.map(([a, b]) => (
                    <li key={`${a.id}|${b.id}`} className="hal-dir__conflict">
                      <ConflictSide artifact={a} />
                      <span className="hal-dir__conflictvs" aria-hidden="true">
                        ×
                      </span>
                      <ConflictSide artifact={b} />
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="hal-dir__section">
              <div className="hal-dir__sectionhead">CONNECTIONS</div>
              {dossier.relations.length === 0 ? (
                <p className="hal-dir__none">No connection recorded.</p>
              ) : (
                CONFIDENCE_ORDER.map((confidence) => {
                  const rows = dossier.relations.filter((r) => r.relation.confidence === confidence)
                  if (rows.length === 0) return null
                  const style = CONFIDENCE[confidence]
                  return (
                    <div
                      key={confidence}
                      className={`hal-dir__rel hal-dir__rel--${confidence}`}
                      data-confidence={confidence}
                    >
                      <div className="hal-dir__relhead">{style.heading}</div>
                      <div className="hal-dir__relnote">{style.note}</div>
                      <ul className="hal-dir__rellist">
                        {rows.map(({ relation, other }, i) => {
                          const outbound = relation.from === dossier.entity.id
                          const subject = outbound
                            ? dossier.entity.canonicalName
                            : (other?.canonicalName ?? 'Someone')
                          const object = outbound
                            ? (other?.canonicalName ?? 'someone')
                            : dossier.entity.canonicalName
                          const sentence = `${subject} ${RELATION_PHRASE[relation.relation]} ${object}.`
                          return (
                            <li key={`${relation.from}-${relation.relation}-${relation.to}-${i}`}>
                              <span className="hal-dir__relmark" aria-hidden="true">
                                {style.mark}
                              </span>
                              <span>{style.lead(sentence)}</span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )
                })
              )}
            </div>

            {Object.keys(dossier.entity.metadata).length > 0 ? (
              <div className="hal-dir__section">
                <div className="hal-dir__sectionhead">ON FILE</div>
                <dl className="hal-dir__meta">
                  {Object.entries(dossier.entity.metadata).map(([key, value]) => (
                    <div key={key} className="hal-dir__metarow">
                      <dt>{key}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </>
        )}
      </div>
    </>
  )
}
