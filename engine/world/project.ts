import type { DayContent } from '../content-schema'
import type { WorldArtifact } from './schema'

/**
 * The day's authored content, projected into the world graph.
 *
 * Without this there would be two worlds: a graph nobody's story happens in, and a story the
 * graph has never heard of. A player who searches "Marc" has to reach the mail they actually
 * read, not a second Marc who exists only in a database.
 *
 * Days stay the unit of authoring. This makes them events *in* the world rather than the only
 * things in it.
 */

/**
 * The identity of a projected artifact.
 *
 * Exported because the reducer marks these discovered as the player opens things, and an id it
 * builds differently from the one the projection builds is an artifact nobody can ever find.
 * One definition, two callers.
 */
export const projectedId = {
  mail: (day: number, id: string) => `d${day}.mail.${id}`,
  file: (day: number, id: string) => `d${day}.file.${id}`,
  photo: (day: number, id: string) => `d${day}.photo.${id}`,
  sms: (day: number, time: string) => `d${day}.sms.${time.replace(/[^0-9]/g, '')}`,
  txn: (day: number, id: string) => `d${day}.txn.${id}`,
  web: (day: number, url: string) => `d${day}.web.${url.replace(/[^a-z0-9]/gi, '-')}`,
} as const

/** `@/content` owns the mapping from an author's short name to a graph entity. */
export type EntityResolver = (name: string) => string | null

function mentionsIn(text: string, resolve: EntityResolver, known: readonly string[]): string[] {
  const found = new Set<string>()
  const haystack = text.toLowerCase()
  for (const name of known) {
    if (haystack.includes(name.toLowerCase())) {
      const id = resolve(name)
      if (id) found.add(id)
    }
  }
  return [...found]
}

export interface ProjectionOptions {
  readonly resolve: EntityResolver
  /** Names to look for in bodies. Supplied by content, which knows its own cast. */
  readonly names: readonly string[]
}

export function projectDay(content: DayContent, options: ProjectionOptions): WorldArtifact[] {
  const { resolve, names } = options
  const day = content.day
  const date = content.dateISO
  const artifacts: WorldArtifact[] = []

  const base = (): Pick<
    WorldArtifact,
    | 'ownerEntityId'
    | 'fields'
    | 'amountCents'
    | 'factId'
    | 'variants'
    | 'reliability'
    | 'contradicts'
    | 'url'
    | 'disputedClaim'
  > => ({
    url: null,
    disputedClaim: null,
    ownerEntityId: null,
    fields: {},
    amountCents: null,
    factId: null,
    variants: [],
    // A projected day is the machine's own record of what it showed. Whether the *content* of a
    // document is true is a matter for the day that authored it, and it says so in its own
    // words rather than in a field here.
    reliability: 'reliable',
    contradicts: [],
  })

  for (const mail of content.mail) {
    const text = `${mail.from} ${mail.subject} ${mail.body.join(' ')}`
    artifacts.push({
      ...base(),
      id: projectedId.mail(day, mail.id),
      type: 'email',
      date,
      title: mail.subject,
      body: mail.body.join('\n\n'),
      source: `Corvid Mail — ${mail.from}`,
      surface: 'mail',
      mentions: mentionsIn(text, resolve, names),
      fields: { from: mail.from, received: mail.time },
      disputedClaim: mail.disputedClaim,
    })
  }

  for (const file of content.files) {
    artifacts.push({
      ...base(),
      id: projectedId.file(day, file.id),
      type: 'document',
      date,
      title: file.name,
      body: file.body,
      source: `Files — ${file.name}`,
      surface: 'files',
      mentions: mentionsIn(file.body, resolve, names),
      disputedClaim: file.disputedClaim,
    })
  }

  for (const photo of content.phone.photos) {
    artifacts.push({
      ...base(),
      id: projectedId.photo(day, photo.id),
      type: 'photo',
      date,
      title: photo.label,
      body: photo.meta,
      source: `Nokora N90 — Photos`,
      surface: 'phone',
      mentions: mentionsIn(photo.meta, resolve, names),
      // The metadata is the point. A player who reads it can cross-reference it.
      fields: { exif: photo.meta },
    })
  }

  for (const sms of content.phone.sms) {
    artifacts.push({
      ...base(),
      id: projectedId.sms(day, sms.time),
      type: 'sms',
      date,
      title: `${sms.who} — ${sms.time}`,
      body: sms.text,
      source: 'Nokora N90 — SMS',
      surface: 'phone',
      mentions: mentionsIn(`${sms.who} ${sms.text}`, resolve, names),
      fields: { sent: sms.time },
    })
  }

  for (const entry of content.economy.openingLedger) {
    artifacts.push({
      ...base(),
      id: projectedId.txn(day, entry.id),
      type: 'transaction',
      date,
      title: entry.label,
      body: '',
      source: `${content.economy.bankName} — ${content.economy.accountLabel}`,
      surface: 'bank',
      mentions: mentionsIn(entry.label, resolve, names),
      amountCents: entry.amount,
      fields: { posted: entry.date },
    })
  }

  for (const page of content.browser.pages) {
    const text = page.blocks
      .map((b) => ('text' in b ? b.text : 'title' in b ? b.title : ''))
      .join(' ')
    artifacts.push({
      ...base(),
      id: projectedId.web(day, page.url),
      type: 'webPage',
      date,
      url: page.url,
      title: page.url,
      body: text,
      source: page.url,
      surface: 'web',
      mentions: mentionsIn(text, resolve, names),
    })
  }

  return artifacts
}
