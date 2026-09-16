import type { CaseContent } from '../case-schema'
import type { WorldArtifact } from './schema'

/**
 * The case's authored content, projected into the world graph.
 *
 * Without this there would be two worlds: a graph nobody's story happens in, and a story the
 * graph has never heard of. A player who searches a name has to reach the mail they actually
 * read, not a second person who exists only in a database.
 *
 * The case stays the unit of authoring. This makes it an event *in* the world rather than the
 * only thing in it.
 */

/**
 * The identity of a projected artifact.
 *
 * Exported because the reducer marks these discovered as the player opens things, and an id it
 * builds differently from the one the projection builds is an artifact nobody can ever find.
 * One definition, two callers.
 */
export const projectedId = {
  mail: (kase: string, id: string) => `${kase}.mail.${id}`,
  file: (kase: string, id: string) => `${kase}.file.${id}`,
  photo: (kase: string, id: string) => `${kase}.photo.${id}`,
  sms: (kase: string, time: string) => `${kase}.sms.${time.replace(/[^0-9]/g, '')}`,
  web: (kase: string, url: string) => `${kase}.web.${url.replace(/[^a-z0-9]/gi, '-')}`,
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

export function projectCase(content: CaseContent, options: ProjectionOptions): WorldArtifact[] {
  const { resolve, names } = options
  const kase = content.id
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
    // A projected case is the machine's own record of what it showed. Whether the *content* of
    // a document is true is a matter for the case that authored it, and it says so in its own
    // words rather than in a field here.
    reliability: 'reliable',
    contradicts: [],
  })

  // Surfaces are named by the case, never by this file. It named one case's mail client and its
  // outright, which is authored prose living in the engine.
  const mailAppTitle = content.apps.find((a) => a.id === 'mail')?.title ?? 'Mail'
  const phoneLabel = content.phone?.device ?? 'Phone'

  for (const mail of content.mail) {
    const text = `${mail.from} ${mail.subject} ${mail.body.join(' ')}`
    artifacts.push({
      ...base(),
      id: projectedId.mail(kase, mail.id),
      type: 'email',
      date,
      title: mail.subject,
      body: mail.body.join('\n\n'),
      source: `${mailAppTitle} — ${mail.from}`,
      surface: 'mail',
      mentions: mentionsIn(text, resolve, names),
      fields: { from: mail.from, received: mail.time },
      disputedClaim: mail.disputedClaim,
    })
  }

  for (const file of content.files) {
    artifacts.push({
      ...base(),
      id: projectedId.file(kase, file.id),
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

  for (const photo of content.photos) {
    // A picture is filed under the source it came off, not under whatever window opened it.
    const device = photo.sourceId ? content.devices.find((d) => d.id === photo.sourceId) : undefined
    const text = [photo.meta, ...photo.detail].join(' ')
    artifacts.push({
      ...base(),
      id: projectedId.photo(kase, photo.id),
      type: 'photo',
      date,
      title: photo.label,
      body: [photo.meta, ...photo.detail].join('\n'),
      source: device ? `${device.label} — Photos` : `${phoneLabel} — Photos`,
      surface: !device ? 'files' : device.kind === 'phone' ? 'phone' : 'device',
      mentions: mentionsIn(text, resolve, names),
      // The metadata is the point. A player who reads it can cross-reference it.
      fields: { exif: photo.meta },
    })
  }

  for (const sms of content.phone?.sms ?? []) {
    artifacts.push({
      ...base(),
      id: projectedId.sms(kase, sms.time),
      type: 'sms',
      date,
      title: `${sms.who} — ${sms.time}`,
      body: sms.text,
      source: `${phoneLabel} — SMS`,
      surface: 'phone',
      mentions: mentionsIn(`${sms.who} ${sms.text}`, resolve, names),
      fields: { sent: sms.time },
    })
  }

  for (const page of content.browser.pages) {
    const text = page.blocks
      .map((b) => ('text' in b ? b.text : 'title' in b ? b.title : ''))
      .join(' ')
    artifacts.push({
      ...base(),
      id: projectedId.web(kase, page.url),
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
