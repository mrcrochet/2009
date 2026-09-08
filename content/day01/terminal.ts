import type { z } from 'zod'
import type { TerminalConfigSchema } from '@/engine/content-schema'

export const terminal: z.input<typeof TerminalConfigSchema> = {
  prompt: 'orask$',
  banner: { text: 'Halcyon Terminal — type “help”', tone: 'prompt' },
  statics: {
    help: [
      {
        text: 'ls · cat <file> · whoami · date · pwd · ps · history · decrypt <file> --key <key>',
        tone: 'out',
      },
    ],
    ls: [{ text: 'READ_ME.txt   contacts.txt   cibles.enc   Pictures/', tone: 'out' }],
    pwd: [{ text: '/Users/orask', tone: 'out' }],
    clear: [],
    // Third from the bottom, quiet, and doing exactly what its name says. A player who thinks
    // to look finds the surveillance fourteen hours before they are told about it.
    ps: [
      { text: '  PID  COMMAND', tone: 'dim' },
      { text: '    1  /sbin/init', tone: 'out' },
      { text: '  412  halcyond', tone: 'out' },
      { text: '  988  hd_sync --remote --quiet', tone: 'out' },
      { text: ' 1104  ps', tone: 'out' },
    ],
    // Someone used this machine at 22:14 on the 14th, took the file, and cleared their tracks
    // badly. The boot screen already told the player the login time; this says what was done.
    history: [
      { text: '  22:14  mount /Volumes/ext', tone: 'out' },
      { text: '  22:14  cp cibles.enc ~/', tone: 'out' },
      { text: '  22:16  history -c', tone: 'out' },
      { text: '  07:32  (this session)', tone: 'dim' },
    ],
    man: [{ text: 'What manual page do you want?', tone: 'dim' }],
  },
  dateTemplate: 'Thu Jan 15 {{clock}}:00 PST 2009',
  catTargets: {
    read_me: 'readme',
    'read_me.txt': 'readme',
    contacts: 'contacts',
    'contacts.txt': 'contacts',
  },
  catBinary: 'cat: cannot display binary file',
  /** Appended to `whoami` once the player is holding the obituary. */
  whoami: [{ text: 'orask   (uid 501)   full name: Rask, Owen T.', tone: 'out' }],
  whoamiAfterEvidence: {
    evidenceId: 'e3',
    lines: [{ text: 'last password change: 06 jan 2009, 09:02', tone: 'dim' }],
  },
  notFound: '{{command}}: command not found',
  decrypt: {
    key: '0412',
    fileId: 'enc',
    evidenceId: 'e7',
    success: 'key accepted — 1 file recovered: cibles.enc',
    wrongKey: 'key rejected. {{remaining}} attempts remain before the file reports.',
    usage: 'usage: decrypt <file> --key <key>',
    maxAttempts: 3,
    lockout: 'too many attempts. the file has reported. someone now knows you tried.',
  },
}
