import type { z } from 'zod'
import type { TerminalConfigSchema } from '@/engine/content-schema'

export const terminal: z.input<typeof TerminalConfigSchema> = {
  prompt: 'orask$',
  banner: { text: 'Halcyon Terminal — type “help”', tone: 'prompt' },
  statics: {
    help: [
      {
        text: 'ls · cat <file> · whoami · who · last · date · pwd · ps · history · decrypt <file> --key <key>',
        tone: 'out',
      },
    ],
    ls: [
      {
        text: 'QUOTA_02.txt   signature_card.tif   route.enc   contacts.txt   Pictures/',
        tone: 'out',
      },
    ],
    pwd: [{ text: '/Users/orask', tone: 'out' }],
    clear: [],
    // Yesterday `ps` was where a careful player found the surveillance. Today it is still there,
    // and there is a second process, and the second one has a destination.
    ps: [
      { text: '  PID  COMMAND', tone: 'dim' },
      { text: '    1  /sbin/init', tone: 'out' },
      { text: '  412  halcyond', tone: 'out' },
      { text: '  988  hd_sync --remote --quiet', tone: 'out' },
      { text: ' 1442  scp -q -B /Users/orask 10.0.1.9:/inbound/4471', tone: 'out' },
      { text: ' 1607  ps', tone: 'out' },
      { text: '  (1442 started 04:04. It has not finished.)', tone: 'dim' },
    ],
    // The 04:03 session, written down by the machine that ran it. Whoever it was cleared the
    // history again, in the same order, four minutes apart, exactly as on Wednesday.
    history: [
      { text: '  04:04  scp -q -B /Users/orask 10.0.1.9:/inbound/4471', tone: 'out' },
      { text: '  04:09  cp /Volumes/ext/route.enc ~/', tone: 'out' },
      { text: '  04:11  vi contacts.txt', tone: 'out' },
      { text: '  04:14  defaults write Bookmarks', tone: 'out' },
      { text: '  04:18  history -c', tone: 'out' },
      { text: '  09:47  (this session)', tone: 'dim' },
    ],
    // Two sessions, one of which the player is not having.
    who: [
      { text: '  orask   console    Jan 16 09:47', tone: 'out' },
      { text: '  orask   ttys001   Jan 16 04:03   (10.0.1.9)', tone: 'out' },
      { text: '  the second session is still open', tone: 'dim' },
    ],
    // The whole of Day 01, rendered as four lines of an accounting nobody asked for.
    last: [
      { text: '  orask  console   Fri Jan 16 09:47                still logged in', tone: 'out' },
      { text: '  orask  ttys001   Fri Jan 16 04:03 - 04:19        (00:16)', tone: 'out' },
      { text: '  orask  console   Thu Jan 15 07:32 - 23:41        (16:09)', tone: 'out' },
      { text: '  orask  console   Wed Jan 14 22:14 - 22:16        (00:02)', tone: 'out' },
      { text: '  wtmp begins Tue Jan  6 09:02', tone: 'dim' },
    ],
    man: [{ text: 'What manual page do you want?', tone: 'dim' }],
  },
  dateTemplate: 'Fri Jan 16 {{clock}}:00 PST 2009',
  catTargets: {
    quota_02: 'brief',
    'quota_02.txt': 'brief',
    contacts: 'contacts',
    'contacts.txt': 'contacts',
  },
  catBinary: 'cat: cannot display binary file',
  whoami: [{ text: 'orask   (uid 501)   full name: Rask, Owen T.', tone: 'out' }],
  /**
   * The machine only contradicts itself once the player is holding the card that does.
   *
   * These lines do not reach a screen today, and neither do Day 01's. `runTerminal` compares this
   * authored id against `state.evidence`, whose ids are qualified by the day the pin was made on
   * — `'e1'` is never equal to `'2:e1'`, so the branch has been unreachable since evidence ids
   * were namespaced. Authored correctly here rather than written as `'2:e1'`, because hiding an
   * engine bug inside a day's content is how it survives to day thirty.
   */
  whoamiAfterEvidence: {
    evidenceId: 'e1',
    lines: [
      { text: 'groups: staff, meridian-ext', tone: 'dim' },
      { text: 'meridian-ext added 16 jan 2009, 04:12 by uid 0', tone: 'dim' },
    ],
  },
  notFound: '{{command}}: command not found',
  decrypt: {
    // The teller number, which is on the scan and in contacts.txt and nowhere else.
    key: '3071',
    fileId: 'route',
    evidenceId: 'e7',
    success: 'key accepted — 1 file recovered: route.enc',
    // Two, not three. `decryptAttempts` is carried across the night, so a player who burned
    // Wednesday's allowance and gave up finds this file already shut to them — and is told why.
    wrongKey: 'key rejected. {{remaining}} attempt remains. the counter did not reset overnight.',
    usage: 'usage: decrypt <file> --key <key>',
    maxAttempts: 2,
    lockout:
      'too many attempts. the file has reported, again, to the same address as the last one.',
  },
}
