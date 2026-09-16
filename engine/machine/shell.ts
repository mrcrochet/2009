import type { CaseContent } from '../case-schema'
import type { TerminalLine } from '../types'
import {
  HOME,
  basename,
  listing,
  nodeAt,
  normalise,
  resolvePath,
  tildify,
  volumes,
  walk,
  type FileSystem,
  type VfsNode,
} from './vfs'

/**
 * The commands that read the machine.
 *
 * Every one of these answers out of the same tree the file manager draws, which is the whole
 * point of the tree existing. `ls` is not a paragraph somebody typed into the case file; it is
 * the directory. `cat` reaches a document because the document is at that path, and a document
 * that is not at that path cannot be read by guessing its name.
 *
 * Pure, and deliberately without effects: a command returns lines, and at most says that the
 * working directory should move or that a document should be opened. The reducer decides what
 * that means for the investigation, because the reducer is the only thing that may.
 */

export interface ShellResult {
  readonly lines: readonly TerminalLine[]
  /** Where the shell ends up. `null` leaves it where it was. */
  readonly cwd: string | null
  /** A document this command put in front of the player, by file id. */
  readonly opened: string | null
  /** A photograph this command put in front of the player, by photo id. */
  readonly openedPhoto: string | null
}

const nothing: ShellResult = { lines: [], cwd: null, opened: null, openedPhoto: null }

function say(lines: readonly TerminalLine[], rest: Partial<ShellResult> = {}): ShellResult {
  return { ...nothing, ...rest, lines }
}

function out(text: string): TerminalLine {
  return { text, tone: 'out' }
}

function err(text: string): TerminalLine {
  return { text, tone: 'err' }
}

function dim(text: string): TerminalLine {
  return { text, tone: 'dim' }
}

/** The commands this shell answers. Anything else falls through to the case's own statics. */
export const SHELL_COMMANDS: readonly string[] = [
  'pwd',
  'cd',
  'ls',
  'cat',
  'stat',
  'file',
  'find',
  'open',
  'mount',
  'df',
]

export function isShellCommand(verb: string): boolean {
  return SHELL_COMMANDS.includes(verb)
}

/**
 * The prompt, with the directory in it.
 *
 * A shell that never says where it is standing is a shell nobody can be lost in, and being
 * momentarily lost in somebody else's disk image is most of the feeling this is for.
 */
export function promptFor(content: CaseContent, cwd: string): string {
  const where = cwd === HOME ? '~' : basename(cwd)
  return `${content.terminal.prompt} ${where} %`
}

export function runShellCommand(
  fs: FileSystem,
  cwd: string,
  argv: readonly string[],
  content: CaseContent,
): ShellResult {
  const [verb = '', ...rest] = argv
  const flags = rest.filter((token) => token.startsWith('-'))
  const args = rest.filter((token) => !token.startsWith('-'))

  switch (verb) {
    case 'pwd':
      return say([out(cwd)])

    case 'cd':
      return changeDirectory(fs, cwd, args[0] ?? '')

    case 'ls':
      return list(fs, cwd, args[0], flags.some((flag) => flag.includes('l')))

    case 'cat':
      return read(fs, cwd, args[0], content)

    case 'stat':
      return describe(fs, cwd, args[0])

    case 'file':
      return classify(fs, cwd, args[0])

    case 'find':
      return search(fs, args[0] ?? '')

    case 'open':
      return show(fs, cwd, args[0])

    case 'mount':
    case 'df':
      return attached(fs)

    default:
      return say([])
  }
}

// ---------------------------------------------------------------------------

function changeDirectory(fs: FileSystem, cwd: string, arg: string): ShellResult {
  const target = resolvePath(cwd, arg)
  const node = nodeAt(fs, target)
  if (!node) return say([err(`cd: ${arg || target}: No such file or directory`)])
  if (node.type === 'file') return say([err(`cd: ${arg}: Not a directory`)])
  if (node.locked) return say([err(`cd: ${target}: volume is locked`)])
  return say([], { cwd: target })
}

function list(fs: FileSystem, cwd: string, arg: string | undefined, long: boolean): ShellResult {
  const target = resolvePath(cwd, arg ?? '.')
  const node = nodeAt(fs, target)
  if (!node) return say([err(`ls: ${arg ?? target}: No such file or directory`)])

  // A locked source is on the machine and its contents are not, and the listing says which.
  if (node.locked) {
    return say([
      dim(`${target}: volume is locked. nothing on it is mounted.`),
    ])
  }

  if (node.type === 'file') return say([long ? out(longLine(node)) : out(node.name)])

  const entries = listing(fs, target)
  if (entries.length === 0) return say([])
  if (long) {
    return say([
      dim(`total ${entries.length}`),
      ...entries.map((entry) => out(longLine(entry))),
    ])
  }
  return say(columns(entries).map(out))
}

/** `r--r--r--  12 KB  09 Jun 02:43  notes.txt` — not a real `ls -l`, but true in every column. */
function longLine(node: VfsNode): string {
  const size = node.type === 'file' ? humanSize(node.size) : '-'
  const when = node.modified || node.created || '-'
  const mark = node.type === 'file' ? '' : node.locked ? '/ (locked)' : '/'
  return [
    node.mode.padEnd(10),
    node.owner.padEnd(12),
    size.padStart(9),
    '  ',
    when.padEnd(14),
    `${node.name}${mark}`,
  ].join('')
}

export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Three across, the way a terminal listing wraps, so a long directory is still scannable. */
function columns(entries: readonly VfsNode[]): readonly string[] {
  const names = entries.map((entry) => (entry.type === 'file' ? entry.name : `${entry.name}/`))
  const width = Math.max(...names.map((name) => name.length)) + 3
  const rows: string[] = []
  for (let i = 0; i < names.length; i += 3) {
    rows.push(
      names
        .slice(i, i + 3)
        .map((name, index) => (index === 2 ? name : name.padEnd(width)))
        .join('')
        .trimEnd(),
    )
  }
  return rows
}

function read(
  fs: FileSystem,
  cwd: string,
  arg: string | undefined,
  content: CaseContent,
): ShellResult {
  if (!arg) return say([err('usage: cat <file>')])
  const target = resolvePath(cwd, arg)
  const node = nodeAt(fs, target)
  if (!node) return say([err(`cat: ${arg}: No such file or directory`)])
  if (node.type !== 'file') return say([err(`cat: ${arg}: Is a directory`)])

  const doc = node.fileId ? content.files.find((file) => file.id === node.fileId) : null
  // A picture, a recording and a sealed file are all "not a text file", and the case supplies
  // that line so the machine says it in its own voice rather than in ours.
  if (!doc || doc.kind === 'scan' || doc.kind === 'audio') {
    return say([out(content.terminal.catBinary)])
  }
  if (doc.kind === 'encrypted') return say([out(content.terminal.catBinary)])

  return say(
    doc.body.split('\n').map(out),
    // Reading a file is opening it. The world graph does not care which application it was.
    { opened: doc.id },
  )
}

function describe(fs: FileSystem, cwd: string, arg: string | undefined): ShellResult {
  if (!arg) return say([err('usage: stat <path>')])
  const target = resolvePath(cwd, arg)
  const node = nodeAt(fs, target)
  if (!node) return say([err(`stat: ${arg}: No such file or directory`)])

  const rows: [string, string][] = [
    ['File', node.path],
    ['Type', node.type === 'file' ? 'regular file' : node.type],
    ['Size', node.type === 'file' ? `${node.size} bytes` : '-'],
    ['Owner', node.owner],
    ['Access', node.mode],
  ]
  if (node.created) rows.push(['Created', node.created])
  if (node.modified) rows.push(['Modified', node.modified])
  return say(rows.map(([label, value]) => out(`${`${label}:`.padEnd(11)}${value}`)))
}

function classify(fs: FileSystem, cwd: string, arg: string | undefined): ShellResult {
  if (!arg) return say([err('usage: file <path>')])
  const target = resolvePath(cwd, arg)
  const node = nodeAt(fs, target)
  if (!node) return say([err(`file: ${arg}: No such file or directory`)])
  return say([out(`${node.name}: ${described(node)}`)])
}

function described(node: VfsNode): string {
  if (node.type === 'volume') return node.locked ? 'attached volume, locked' : 'attached volume'
  if (node.type === 'directory') return 'directory'
  if (node.photoId) return 'HEIC image data'
  switch (node.kind) {
    case 'note':
      return 'ASCII text'
    case 'letter':
      return 'word processor document'
    case 'sheet':
      return 'CSV text, comma-separated values'
    case 'scan':
      return 'PDF document, scanned'
    case 'audio':
      return 'MPEG-4 audio'
    case 'encrypted':
      return 'encrypted data, no readable header'
    default:
      return 'data'
  }
}

/**
 * Names, across everything mounted.
 *
 * The one command here that is worth having for its own sake: a player who knows half a
 * filename and not where it is gets to find it, and what comes back says which volume it was on
 * — which is often the answer they were actually after.
 */
function search(fs: FileSystem, needle: string): ShellResult {
  if (!needle) return say([err('usage: find <name>')])
  const wanted = needle.toLowerCase()
  const hits = walk(fs, '/').filter((node) => node.name.toLowerCase().includes(wanted))
  if (hits.length === 0) return say([dim(`find: nothing matching "${needle}"`)])
  return say(hits.slice(0, 40).map((node) => out(node.path)))
}

function show(fs: FileSystem, cwd: string, arg: string | undefined): ShellResult {
  if (!arg) return say([err('usage: open <path>')])
  const target = resolvePath(cwd, arg)
  const node = nodeAt(fs, target)
  if (!node) return say([err(`open: ${arg}: No such file or directory`)])
  if (node.fileId) return say([dim(`open: ${node.name}`)], { opened: node.fileId })
  if (node.photoId) return say([dim(`open: ${node.name}`)], { openedPhoto: node.photoId })
  return say([err(`open: ${arg}: nothing on this machine opens that`)])
}

function attached(fs: FileSystem): ShellResult {
  const mounted = volumes(fs)
  if (mounted.length === 0) return say([dim('no volumes attached')])
  return say([
    dim('  VOLUME                OWNER           STATE'),
    ...mounted.map((volume) =>
      out(
        `  ${volume.name.padEnd(21)} ${volume.owner.padEnd(15)} ${
          volume.locked ? 'locked' : 'mounted read-only'
        }`,
      ),
    ),
  ])
}

/** Where a path points, for the file manager's own breadcrumb. */
export function crumbs(path: string): readonly { name: string; path: string }[] {
  const normal = normalise(path)
  if (normal === '/') return [{ name: '/', path: '/' }]
  const parts = normal.slice(1).split('/')
  return parts.map((name, index) => ({
    name,
    path: `/${parts.slice(0, index + 1).join('/')}`,
  }))
}

export { tildify }
