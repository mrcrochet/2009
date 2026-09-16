import type { CaseContent, MachineProcess } from '../case-schema'
import type { InvestigationState } from '../types'

/**
 * What is running on this machine.
 *
 * A computer people believe in is one that is doing things nobody asked it to do. The process
 * table used to be four lines of text in the case file, which meant `ps` was a poster of a
 * process table: the same four lines forever, and the one suspicious entry among them could be
 * read but never touched.
 *
 * So it is state now — derived, like the filesystem, from the case and from what the player has
 * done — and `kill` is real. Killing the wrong thing costs something. Killing the right thing
 * costs something too, which is the point: a process that is watching the session notices when
 * it stops, and the machine does not congratulate anybody for noticing it.
 *
 * Pure. The respawn is measured against the session clock rather than a timer, so a replay of
 * the same log produces the same table at the same minute.
 */

export interface ProcessRow {
  readonly pid: number
  readonly command: string
  readonly user: string
  /** Percent. Authored, and steady: a number that jitters is a number nobody can act on. */
  readonly cpu: number
  /** Megabytes resident. */
  readonly mem: number
  /** The machine refuses to kill it, and says so. */
  readonly system: boolean
}

/** A kill, kept so the table can be rebuilt and so a respawn can be timed against the clock. */
export interface Kill {
  readonly pid: number
  readonly at: number
}

/**
 * The table as of this minute.
 *
 * A process the case gated on the route being open is not listed until it is: the relay is a
 * thing a player finds, and a daemon named after it sitting in `ps` from the first minute would
 * be the machine pointing at the answer.
 */
export function processTable(state: InvestigationState, content: CaseContent): readonly ProcessRow[] {
  const rows: ProcessRow[] = []

  for (const process of content.terminal.processes) {
    if (process.needsRelay && !state.relay.unlocked) continue

    // The most recent kill, not the first: something that came back can be killed again, and
    // the clock it respawns against is the last time it died.
    const killed = [...state.machine.killed]
      .reverse()
      .find((kill) => kill.pid === process.pid)
    if (!killed) {
      rows.push(row(process, process.pid))
      continue
    }

    // It came back — under a different number, because what came back is not the same process.
    // Nothing on this machine mentions that it did.
    const back =
      process.respawnAfter !== null && state.minute - killed.at >= process.respawnAfter
    if (back) rows.push(row(process, process.respawnPid ?? process.pid))
  }

  return [...rows].sort((a, b) => a.pid - b.pid)
}

function row(process: MachineProcess, pid: number): ProcessRow {
  return {
    pid,
    command: process.command,
    user: process.user,
    cpu: process.cpu,
    mem: process.mem,
    system: process.system,
  }
}

/** Which authored process a pid currently belongs to — the original number or the one it came back as. */
export function processFor(
  state: InvestigationState,
  content: CaseContent,
  pid: number,
): MachineProcess | null {
  const live = processTable(state, content).some((process) => process.pid === pid)
  if (!live) return null
  return (
    content.terminal.processes.find(
      (process) => process.pid === pid || process.respawnPid === pid,
    ) ?? null
  )
}

/**
 * Whether this machine can reach the open web at all.
 *
 * Two things have to be true: the route was found, and the thing that carries it is running. A
 * case that names no daemon keeps the old behaviour exactly, so this is a capability a case opts
 * into rather than a rule imposed on every case.
 *
 * The dock reads this as well as the reducer. An icon for an application that refuses to open is
 * worse than no icon: it tells the player the machine is broken rather than that they broke it.
 */
export function relayRunning(state: InvestigationState, content: CaseContent): boolean {
  if (!state.relay.unlocked) return false
  const daemon = content.terminal.relay?.daemonPid
  if (!daemon) return true
  return processTable(state, content).some((process) => process.pid === daemon)
}
