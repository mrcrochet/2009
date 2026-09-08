'use client'

import { useMemo, useState } from 'react'
import { displayDate, entityDossier, factCoverage, knownEntities } from '@/engine/world'
import type { RelationTypeSchema, WorldEntity } from '@/engine/world/schema'
import type { z } from 'zod'
import { useWorldOptional } from '../WorldContext'

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
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  const dossier = useMemo(() => {
    if (!world || !selectedId) return null
    return entityDossier(world.index, selectedId, world.discovered)
  }, [world, selectedId])

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
        {!dossier ? (
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
                <div className="hal-dir__sectionhead">CORROBORATION</div>
                <ul className="hal-dir__facts">
                  {facts.map((fact) => (
                    <li key={fact.factId} className="hal-dir__fact">
                      {fact.found} of {fact.total} traces found
                      {fact.found < fact.total ? ' — the rest are somewhere' : ''}
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
