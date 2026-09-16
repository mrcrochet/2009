import { describe, expect, it } from 'vitest'
import { crumbs, humanSize, promptFor } from '@/engine/machine/shell'
import {
  HOME,
  byteLength,
  listing,
  nodeAt,
  normalise,
  resolvePath,
  walk,
} from '@/engine/machine/vfs'
import { selectFileSystem, selectFiles, selectPlaces } from '@/engine/selectors'
import { content, dispatch, fresh, run } from './helpers'

/**
 * The machine, rather than one application's account of it.
 *
 * What is being held here is a single claim: Files and the shell are two windows onto one
 * filesystem. Everything else follows from that — a volume that is locked is locked in both, a
 * document that has not been paid for is in neither, and a path is a path wherever it is typed.
 */

const text = (state: ReturnType<typeof fresh>) =>
  state.terminal.lines.map((line) => line.text).join('\n')
const shell = (commands: readonly string[]) =>
  run(
    fresh(),
    commands.map((command) => ({ type: 'TERMINAL_COMMAND_RUN' as const, command })),
  )

const MBP = '/Volumes/Daniel-MBP'
const HANDSET = '/Volumes/Daniel-NOVA-M12'

describe('paths', () => {
  it('normalises the way a path is actually typed', () => {
    expect(normalise('/a/b/../c')).toBe('/a/c')
    expect(normalise('/a//b/./c/')).toBe('/a/b/c')
    expect(normalise('/')).toBe('/')
    expect(normalise('/a/../..')).toBe('/')
  })

  it('resolves relative to where the player is standing', () => {
    expect(resolvePath('/Volumes', 'Daniel-MBP')).toBe(MBP)
    expect(resolvePath(`${MBP}/Documents`, '..')).toBe(MBP)
    expect(resolvePath('/tmp', '/etc')).toBe('/etc')
    expect(resolvePath('/tmp', '~')).toBe(HOME)
    expect(resolvePath('/tmp', '~/Desktop')).toBe(`${HOME}/Desktop`)
    expect(resolvePath('/tmp', '')).toBe(HOME)
  })

  it('counts bytes without asking the platform', () => {
    expect(byteLength('abc')).toBe(3)
    expect(byteLength('é')).toBe(2)
    expect(byteLength('—')).toBe(3)
    expect(humanSize(312)).toBe('312 B')
    expect(humanSize(4182)).toBe('4 KB')
  })

  it('builds a breadcrumb that goes back up its own trail', () => {
    expect(crumbs(`${MBP}/Documents`)).toEqual([
      { name: 'Volumes', path: '/Volumes' },
      { name: 'Daniel-MBP', path: MBP },
      { name: 'Documents', path: `${MBP}/Documents` },
    ])
  })
})

describe('the filesystem', () => {
  it('puts every document the case authored at the path the case gave it', () => {
    const fs = selectFileSystem(fresh(), content)
    for (const doc of content.files) {
      // The recovered archive is behind a service and is checked separately.
      if (content.services.some((svc) => svc.grantsFileIds.includes(doc.id))) continue
      const dir = doc.dir === '' ? `${HOME}/Desktop` : doc.dir
      const node = nodeAt(fs, `${dir}/${doc.name}`)
      expect(node, `${doc.name} is not on the machine`).not.toBeNull()
      expect(node?.fileId).toBe(doc.id)
    }
  })

  it('mounts a source that is attached, and leaves a locked one unreadable', () => {
    const fs = selectFileSystem(fresh(), content)

    // The laptop image arrived open, so its documents are on the machine.
    expect(nodeAt(fs, MBP)?.locked).toBe(false)
    expect(nodeAt(fs, `${MBP}/Documents/passcodes.txt`)).not.toBeNull()

    // The handset did not, so nothing off it is — not hidden from the listing, not in the tree.
    expect(nodeAt(fs, HANDSET)?.locked).toBe(true)
    expect(nodeAt(fs, `${HANDSET}/DCIM/100NOVA/IMG_2214.HEIC`)).toBeNull()
    expect(walk(fs, HANDSET)).toHaveLength(0)
  })

  it('a camera roll appears the moment its source is opened', () => {
    const opened = dispatch(fresh(), {
      type: 'DEVICE_UNLOCK_ATTEMPTED',
      deviceId: 'dev-phone',
      key: '190455',
    })
    const fs = selectFileSystem(opened, content)
    expect(nodeAt(fs, HANDSET)?.locked).toBe(false)
    const roll = listing(fs, `${HANDSET}/DCIM/100NOVA`)
    expect(roll.map((node) => node.name)).toContain('IMG_2214.HEIC')
    // The size and the capture date are the file's, and `stat` will say the same numbers.
    expect(roll[0]?.size).toBeGreaterThan(0)
    expect(roll[0]?.photoId).toBeTruthy()
  })

  it('an image taken off somebody else is read-only, and the investigator’s own is not', () => {
    const fs = selectFileSystem(fresh(), content)
    expect(nodeAt(fs, `${MBP}/Documents/passcodes.txt`)?.mode).toBe('r--r--r--')
    expect(nodeAt(fs, `${HOME}/Desktop/CASE_24-118.txt`)?.mode).toBe('rw-r--r--')
  })

  it('lists directories before files', () => {
    const fs = selectFileSystem(fresh(), content)
    const kinds = listing(fs, HOME).map((node) => node.type)
    expect(kinds.filter((kind) => kind === 'file')).toHaveLength(0)
    expect(listing(fs, HOME).map((node) => node.name)).toEqual([
      'Desktop',
      'Documents',
      'Downloads',
      'Pictures',
    ])
  })
})

describe('the shell reads that same machine', () => {
  it('walks into a volume and lists what is actually on it', () => {
    const state = shell(['cd /Volumes/Daniel-MBP/Documents', 'ls'])
    expect(state.machine.cwd).toBe(`${MBP}/Documents`)
    expect(text(state)).toContain('passcodes.txt')
    expect(text(state)).toContain('marlow-2013.enc')
  })

  it('refuses a path that is not there, in the shell’s own words', () => {
    const state = shell(['cd /Volumes/nope'])
    expect(text(state)).toContain('cd: /Volumes/nope: No such file or directory')
    expect(state.machine.cwd).toBe(HOME)
  })

  it('will not walk into a source nobody has opened', () => {
    const state = shell([`cd ${HANDSET}`, `ls ${HANDSET}`])
    expect(state.machine.cwd).toBe(HOME)
    expect(text(state)).toContain('volume is locked')
  })

  it('says where it is standing, in the prompt and in pwd', () => {
    const state = shell(['cd /Volumes/Daniel-MBP/Documents', 'pwd'])
    expect(text(state)).toContain(`${MBP}/Documents`)
    expect(promptFor(content, state.machine.cwd)).toBe('nova@workstation Documents %')
    expect(promptFor(content, HOME)).toBe('nova@workstation ~ %')
  })

  it('stat agrees with the file, down to the byte', () => {
    const state = shell(['stat /Volumes/Daniel-MBP/Documents/passcodes.txt'])
    const fs = selectFileSystem(state, content)
    const node = nodeAt(fs, `${MBP}/Documents/passcodes.txt`)!
    expect(text(state)).toContain(`${node.size} bytes`)
    expect(text(state)).toContain('Daniel Mercer')
    expect(text(state)).toContain(node.modified)
  })

  it('finds a name wherever it is, and says which volume it was on', () => {
    const state = shell(['find passcodes'])
    expect(text(state)).toContain(`${MBP}/Documents/passcodes.txt`)
  })

  it('names what a file is without opening it', () => {
    const state = shell([
      'file /Volumes/Daniel-MBP/Documents/grant-disbursements-2013.csv',
      'file /Volumes/Daniel-MBP/Documents/marlow-2013.enc',
    ])
    expect(text(state)).toContain('comma-separated values')
    expect(text(state)).toContain('encrypted data, no readable header')
  })

  it('lists what is attached, and what state it is in', () => {
    const state = shell(['mount'])
    expect(text(state)).toContain('Daniel-MBP')
    expect(text(state)).toContain('mounted read-only')
    expect(text(state)).toContain('locked')
  })

  /**
   * The payoff for there being one machine.
   *
   * Reading a document at the prompt is reading it. It lands in the reader and the world graph
   * records it, so a player who works entirely from the shell is not invisible to the case.
   */
  it('reading a file in the shell is reading it', () => {
    const state = shell(['cd /Volumes/Daniel-MBP/Documents', 'cat draft-statement-v3.doc'])
    expect(state.files.openId).toBe('f2')
    expect(state.discovered).toContain('case001.file.f2')
  })

  it('open puts a document in the reader without printing it', () => {
    const state = shell(['open ~/Desktop/CASE_24-118.txt'])
    expect(state.files.openId).toBe('f1')
    expect(text(state)).toContain('open: CASE_24-118.txt')
  })

  it('a service the investigation has not bought is not reachable from the prompt either', () => {
    const state = shell(['find call-archive'])
    expect(text(state)).toContain('nothing matching')
  })
})

describe('the file manager stands in the same tree', () => {
  it('opens on the desktop, and the case put one thing there', () => {
    const state = fresh()
    expect(state.files.cwd).toBe(`${HOME}/Desktop`)
    expect(selectFiles(state, content).map((row) => row.name)).toEqual(['CASE_24-118.txt'])
  })

  it('navigates, and refuses a path that is not a directory on this machine', () => {
    const moved = dispatch(fresh(), {
      type: 'FILES_NAVIGATED',
      path: `${MBP}/Documents`,
    })
    expect(moved.files.cwd).toBe(`${MBP}/Documents`)
    expect(selectFiles(moved, content).map((row) => row.name)).toContain('passcodes.txt')

    for (const path of [`${HANDSET}/DCIM`, '/Volumes/nope', `${MBP}/Documents/passcodes.txt`]) {
      expect(dispatch(moved, { type: 'FILES_NAVIGATED', path }).files.cwd).toBe(`${MBP}/Documents`)
    }
  })

  it('shows a locked source in Places, and says it is locked', () => {
    const places = selectPlaces(fresh(), content)
    expect(places.map((place) => place.name)).toEqual([
      'Desktop',
      'Documents',
      'Downloads',
      'Pictures',
      'Daniel-MBP',
      'Daniel-NOVA-M12',
    ])
    expect(places.find((place) => place.name === 'Daniel-NOVA-M12')?.locked).toBe(true)
  })

  it('and the shell walking somewhere does not move the file manager', () => {
    const state = shell(['cd /'])
    expect(state.machine.cwd).toBe('/')
    expect(state.files.cwd).toBe(`${HOME}/Desktop`)
  })
})
