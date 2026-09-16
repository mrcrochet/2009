import type { CaseContent, DocumentKind } from '../case-schema'
import type { InvestigationState } from '../types'

/**
 * The machine's filesystem.
 *
 * Files and Terminal used to be two descriptions of the same fiction that never had to agree:
 * one listed every document the case authored in a flat pane labelled "Desktop", the other
 * printed an `ls` somebody had typed out by hand. A player who read both learned that neither
 * was the machine.
 *
 * So there is one tree, and everything that talks about a file goes through it. The case still
 * owns the content — what a document is, where it lives, what it weighs — and the tree is
 * *derived*, never stored: a save holds the working directory and nothing else, because a
 * filesystem serialised into a save is a filesystem that can drift from the case that authored
 * it. Mount a volume and it appears in both applications, because there is only one of it.
 *
 * Pure: no framework, no platform, no clock of its own.
 */

/** Where the investigator's own account lives. */
export const HOME = '/Users/investigator'

/** Where a mounted source shows up, the way an attached volume always has. */
export const VOLUMES = '/Volumes'

export type VfsNodeType = 'directory' | 'file' | 'volume'

export interface VfsNode {
  /** Absolute, normalised, no trailing slash (except the root itself). */
  readonly path: string
  readonly name: string
  readonly type: VfsNodeType
  /** What kind of document this is, for a file the case authored. */
  readonly kind: DocumentKind | null
  readonly size: number
  /** Authored, and empty for anything the case did not date. */
  readonly created: string
  readonly modified: string
  readonly owner: string
  /** `rw-r--r--`. A read-only image is a read-only image in the listing too. */
  readonly mode: string
  /** The case document behind this node. */
  readonly fileId: string | null
  /** The photograph behind this node. */
  readonly photoId: string | null
  /**
   * A volume nobody has opened yet.
   *
   * It is on the machine — a locked disk is still plugged in — and its contents are not. They
   * are not hidden from the listing; they are not in the tree at all, so there is nothing for a
   * save to be edited past.
   */
  readonly locked: boolean
}

export interface FileSystem {
  readonly nodes: ReadonlyMap<string, VfsNode>
  readonly children: ReadonlyMap<string, readonly string[]>
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** `/a/b/../c` -> `/a/c`. Absolute in, absolute out. */
export function normalise(path: string): string {
  const parts: string[] = []
  for (const segment of path.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') {
      parts.pop()
      continue
    }
    parts.push(segment)
  }
  return `/${parts.join('/')}`
}

/** What an argument typed at a prompt means, from where the player is standing. */
export function resolvePath(cwd: string, arg: string): string {
  const trimmed = arg.trim()
  if (trimmed === '' || trimmed === '~') return HOME
  if (trimmed.startsWith('~/')) return normalise(`${HOME}/${trimmed.slice(2)}`)
  if (trimmed.startsWith('/')) return normalise(trimmed)
  return normalise(`${cwd}/${trimmed}`)
}

export function parentOf(path: string): string {
  const at = path.lastIndexOf('/')
  return at <= 0 ? '/' : path.slice(0, at)
}

export function basename(path: string): string {
  return path === '/' ? '/' : (path.slice(path.lastIndexOf('/') + 1) || '/')
}

/** `/Users/investigator/Desktop` -> `~/Desktop`, which is what a prompt shows. */
export function tildify(path: string): string {
  if (path === HOME) return '~'
  return path.startsWith(`${HOME}/`) ? `~${path.slice(HOME.length)}` : path
}

// ---------------------------------------------------------------------------
// Reading the tree
// ---------------------------------------------------------------------------

export function nodeAt(fs: FileSystem, path: string): VfsNode | null {
  return fs.nodes.get(normalise(path)) ?? null
}

export function exists(fs: FileSystem, path: string): boolean {
  return fs.nodes.has(normalise(path))
}

/**
 * The entries of a directory, directories first and then by name.
 *
 * Not alphabetical across both: a listing that interleaves folders and files is a listing
 * nobody scans, and every file manager worth the name has known this for thirty years.
 */
export function listing(fs: FileSystem, path: string): readonly VfsNode[] {
  const here = fs.children.get(normalise(path)) ?? []
  return here
    .flatMap((childPath) => {
      const node = fs.nodes.get(childPath)
      return node ? [node] : []
    })
    .sort((a, b) => {
      const aDir = a.type === 'file' ? 1 : 0
      const bDir = b.type === 'file' ? 1 : 0
      if (aDir !== bDir) return aDir - bDir
      return a.name.localeCompare(b.name)
    })
}

/** Every node under a path, the directory itself excluded. Depth-first, stable. */
export function walk(fs: FileSystem, path: string): readonly VfsNode[] {
  const out: VfsNode[] = []
  const visit = (at: string) => {
    for (const node of listing(fs, at)) {
      out.push(node)
      if (node.type !== 'file') visit(node.path)
    }
  }
  visit(normalise(path))
  return out
}

/** The places sidebar, and `mount`: every source attached to this machine. */
export function volumes(fs: FileSystem): readonly VfsNode[] {
  return listing(fs, VOLUMES)
}

// ---------------------------------------------------------------------------
// Building it
// ---------------------------------------------------------------------------

/**
 * How many bytes a piece of text actually is.
 *
 * Counted rather than measured with a platform encoder, so `ls -l`, `stat` and the size in the
 * file manager agree on every runtime — and so this module keeps importing nothing.
 */
export function byteLength(text: string): number {
  let bytes = 0
  for (const character of text) {
    const code = character.codePointAt(0) ?? 0
    if (code < 0x80) bytes += 1
    else if (code < 0x800) bytes += 2
    else if (code < 0x10000) bytes += 3
    else bytes += 4
  }
  return bytes
}

interface Draft {
  path: string
  type: VfsNodeType
  kind?: DocumentKind | null
  size?: number
  created?: string
  modified?: string
  owner?: string
  mode?: string
  fileId?: string | null
  photoId?: string | null
  locked?: boolean
}

const SKELETON: readonly string[] = [
  '/Applications',
  '/System',
  '/Users',
  HOME,
  `${HOME}/Desktop`,
  `${HOME}/Documents`,
  `${HOME}/Downloads`,
  `${HOME}/Pictures`,
  VOLUMES,
  '/tmp',
]

/**
 * The tree, as this investigation currently has it.
 *
 * Derived from three things and nothing else: the case's own documents, which sources are
 * attached and open, and which forensic recoveries have been granted. A document behind a
 * recovery is not on the disk until it has been bought — the same rule the file manager already
 * enforced, applied one level lower down so the terminal cannot be used to walk around it.
 */
export function buildFileSystem(state: InvestigationState, content: CaseContent): FileSystem {
  const drafts: Draft[] = [
    { path: '/', type: 'directory', owner: 'system', mode: 'rwxr-xr-x' },
    ...SKELETON.map((path) => ({ path, type: 'directory' as const })),
  ]

  // --- sources attached to the machine -------------------------------------
  const volumeOf = new Map<string, string>()
  for (const device of content.devices) {
    if (!device.connected) continue
    const mount = `${VOLUMES}/${device.volume}`
    volumeOf.set(device.id, mount)
    drafts.push({
      path: mount,
      type: 'volume',
      owner: device.owner,
      // An image taken off somebody else's machine is evidence, and evidence is not written to.
      mode: 'r-xr-xr-x',
      locked: !state.devices[device.id]?.unlocked,
    })
  }

  const withheld = new Set(
    content.services
      .filter((service) => !state.services.includes(service.id))
      .flatMap((service) => service.grantsFileIds),
  )

  // --- the case's documents ------------------------------------------------
  for (const doc of content.files) {
    if (withheld.has(doc.id)) continue
    const dir = doc.dir === '' ? `${HOME}/Desktop` : normalise(doc.dir)
    if (!reachable(dir, drafts)) continue
    drafts.push({
      path: `${dir}/${doc.name}`,
      type: 'file',
      kind: doc.kind,
      size: doc.bytes ?? byteLength(doc.body),
      created: doc.created,
      modified: doc.modified,
      owner: ownerOfDir(dir, content),
      mode: dir.startsWith(`${VOLUMES}/`) ? 'r--r--r--' : 'rw-r--r--',
      fileId: doc.id,
    })
  }

  // --- what came off a camera ----------------------------------------------
  for (const photo of content.photos) {
    const mount = photo.sourceId ? volumeOf.get(photo.sourceId) : null
    if (photo.sourceId && !mount) continue
    const dir = mount ? `${mount}/DCIM/100NOVA` : `${HOME}/Pictures`
    if (mount && !reachable(mount, drafts)) continue
    drafts.push({ path: `${dir}/DCIM-placeholder`, type: 'directory' })
    drafts.push({
      path: `${dir}/${photo.label}`,
      type: 'file',
      kind: null,
      size: photo.bytes,
      created: photo.captured,
      modified: photo.captured,
      owner: mount ? ownerOfDir(dir, content) : 'investigator',
      mode: mount ? 'r--r--r--' : 'rw-r--r--',
      photoId: photo.id,
    })
  }

  return assemble(drafts)
}

/** Whose files these are, for a listing that says so. */
function ownerOfDir(dir: string, content: CaseContent): string {
  if (!dir.startsWith(`${VOLUMES}/`)) return 'investigator'
  const name = dir.slice(VOLUMES.length + 1).split('/')[0]
  return content.devices.find((device) => device.volume === name)?.owner ?? 'investigator'
}

/** A path on a volume nobody has opened is not a path this machine has. */
function reachable(dir: string, drafts: readonly Draft[]): boolean {
  if (!dir.startsWith(`${VOLUMES}/`)) return true
  const mount = `${VOLUMES}/${dir.slice(VOLUMES.length + 1).split('/')[0]}`
  const volume = drafts.find((draft) => draft.path === mount)
  return Boolean(volume) && !volume?.locked
}

/**
 * Drafts in, tree out: every intermediate directory is created, and a path claimed twice keeps
 * the first claim rather than silently becoming whichever the iteration reached last.
 */
function assemble(drafts: readonly Draft[]): FileSystem {
  const nodes = new Map<string, VfsNode>()
  const children = new Map<string, string[]>()

  const put = (draft: Draft) => {
    const path = normalise(draft.path)
    if (nodes.has(path)) return
    nodes.set(path, {
      path,
      name: basename(path),
      type: draft.type,
      kind: draft.kind ?? null,
      size: draft.size ?? 0,
      created: draft.created ?? '',
      modified: draft.modified ?? '',
      owner: draft.owner ?? 'investigator',
      mode: draft.mode ?? (draft.type === 'file' ? 'rw-r--r--' : 'rwxr-xr-x'),
      fileId: draft.fileId ?? null,
      photoId: draft.photoId ?? null,
      locked: draft.locked ?? false,
    })
    if (path === '/') return
    const parent = parentOf(path)
    if (!nodes.has(parent)) put({ path: parent, type: 'directory' })
    const siblings = children.get(parent) ?? []
    siblings.push(path)
    children.set(parent, siblings)
  }

  for (const draft of drafts) put(draft)
  // The placeholder exists only to make the camera's folders appear on an empty roll.
  for (const path of [...nodes.keys()]) {
    if (!path.endsWith('/DCIM-placeholder')) continue
    nodes.delete(path)
    const parent = parentOf(path)
    children.set(parent, (children.get(parent) ?? []).filter((child) => child !== path))
  }

  return { nodes, children }
}
