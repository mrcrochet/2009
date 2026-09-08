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
    'ownerEntityId' | 'fields' | 'amountCents' | 'factId' | 'variants'
  > => ({
    ownerEntityId: null,
    fields: {},
    amountCents: null,
    factId: null,
    variants: [],
  })

  for (const mail of content.mail) {
    const text = `${mail.from} ${mail.subject} ${mail.body.join(' ')}`
    artifacts.push({
      ...base(),
      id: `d${day}.mail.${mail.id}`,
      type: 'email',
      date,
      title: mail.subject,
      body: mail.body.join('\n\n'),
      source: `Corvid Mail — ${mail.from}`,
      surface: 'mail',
      mentions: mentionsIn(text, resolve, names),
      fields: { from: mail.from, received: mail.time },
    })
  }

  for (const file of content.files) {
    artifacts.push({
      ...base(),
      id: `d${day}.file.${file.id}`,
      type: 'document',
      date,
      title: file.name,
      body: file.body,
      source: `Files — ${file.name}`,
      surface: 'files',
      mentions: mentionsIn(file.body, resolve, names),
    })
  }

  for (const photo of content.phone.photos) {
    artifacts.push({
      ...base(),
      id: `d${day}.photo.${photo.id}`,
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
      id: `d${day}.sms.${sms.time.replace(/[^0-9]/g, '')}`,
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
      id: `d${day}.txn.${entry.id}`,
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
      id: `d${day}.web.${page.url.replace(/[^a-z0-9]/gi, '-')}`,
      type: 'webPage',
      date,
      title: page.url,
      body: text,
      source: page.url,
      surface: 'web',
      mentions: mentionsIn(text, resolve, names),
    })
  }

  return artifacts
}
