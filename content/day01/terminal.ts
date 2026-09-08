import type { z } from 'zod'
import type { TerminalConfigSchema } from '@/engine/content-schema'

export const terminal: z.input<typeof TerminalConfigSchema> = {
  prompt: 'orask$',
  banner: { text: 'Halcyon Terminal — type “help”', tone: 'prompt' },
  statics: {
    help: [{ text: 'ls · cat <file> · whoami · date · decrypt <file> --key <key>', tone: 'out' }],
    ls: [{ text: 'READ_ME.txt   contacts.txt   cibles.enc   Pictures/', tone: 'out' }],
    whoami: [{ text: 'orask   (uid 501)   full name: Rask, Owen T.', tone: 'out' }],
    clear: [],
  },
  dateTemplate: 'Thu Jan 15 {{clock}}:00 PST 2009',
  catTargets: {
    read_me: 'readme',
    'read_me.txt': 'readme',
    contacts: 'contacts',
    'contacts.txt': 'contacts',
  },
  catBinary: 'cat: cannot display binary file',
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
