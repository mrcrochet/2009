import type { z } from 'zod'
import type { CaseContentSchema } from '@/engine/case-schema'
import { browser } from './browser'

/**
 * CASE 001 — HE NEVER CAME HOME.
 *
 * A scaffold rather than a finished case: every surface the engine has is authored here at least
 * once, so the shape of a case is legible and the invariants are exercised, but the density this
 * product needs — the ordinary web around the case, the side stories, the sixth trace on a fact —
 * is authoring still to come. What is already true of it is structural, and deliberate:
 *
 * - The workstation is the machine. The phone is a *source* attached to it, and it is locked.
 * - Nothing the two sound claims need is behind the forensic service. The recovered call log
 *   deepens the case; it is not the case, and `tests/unit/content.test.ts` enforces that.
 * - The only page that changes changes because the investigator picked up the telephone.
 */
export const case001: z.input<typeof CaseContentSchema> = {
  id: 'case001',
  number: 1,
  title: 'He Never Came Home',
  client: 'Claire Mercer',
  summary:
    'Daniel Mercer, 34, left his house on the evening of 9 June and did not come back. The police are not treating it as suspicious. His sister does not agree.',
  dateISO: '2026-06-17',
  startMinute: 19 * 60 + 12,
  sessionMinutes: 260,
  location: 'Portland, Oregon',
  investigator: 'You',
  osName: 'NOVA 3.2',

  boot: [
    'NOVA 3.2 (build 3.2.114)',
    'workstation: secure session',
    'mounting case volume … CASE-24-118',
    'sources: 2 attached · 1 locked',
    'index: 41,882 documents',
    'relay: attached, metered',
    'ready',
  ],
  bootIntervalMs: 170,
  bootHoldMs: 700,
  messengerOpensAtMs: 1100,
  desktopIconAtMs: 2600,
  desktopIconFileId: 'f1',
  chatReplyDelayMs: 1400,

  /*
   * The shop window. The frame is the one the case already owns: IMG_2214 is a parking structure
   * at 22:47 on the ninth, and the receipt from the same lot says he was there until 22:47. The
   * key art is that, drawn — not a stock photograph of somewhere else.
   */
  catalogue: {
    art: 'lot',
    hook: 'A laptop image, a locked handset, and a sister who does not believe the police.',
    kind: 'Missing person',
    difficulty: 'Moderate',
    estimate: '2 to 4 hours',
    surfaces: ['Open web', 'Mail', 'Files', 'Photographs', 'Console', 'The relay'],
    provided: 'A read-only laptop image, a locked handset, a name, and a date',
    access: 'free',
    series: { name: 'The Marlow Files', position: 1 },
  },

  apps: [
    { id: 'mail', title: 'Relay Mail', mono: 'M', width: 640, height: 410 },
    { id: 'msg', title: 'Dispatch', mono: 'D', width: 318, height: 392 },
    { id: 'web', title: 'Orbit', mono: 'O', width: 720, height: 472 },
    { id: 'files', title: 'Files', mono: 'F', width: 792, height: 468 },
    { id: 'photos', title: 'Photos', mono: 'P', width: 668, height: 472 },
    { id: 'devices', title: 'Devices', mono: 'V', width: 520, height: 380 },
    { id: 'notes', title: 'Notes', mono: 'N', width: 352, height: 300 },
    { id: 'term', title: 'Console', mono: '>', width: 568, height: 328 },
    { id: 'directory', title: 'Directory', mono: 'I', width: 640, height: 420 },
  ],
  dock: ['mail', 'msg', 'web', 'files', 'photos', 'devices', 'notes', 'term', 'directory', 'phone'],

  devices: [
    {
      id: 'dev-phone',
      kind: 'phone',
      label: "Daniel's NOVA M12",
      owner: 'Daniel Mercer',
      meta: '68% · last sync 09 Jun 22:51',
      connected: true,
      unlocked: false,
      unlockKey: '190455',
      unlockHint:
        'Six digits. Claire has tried his birthday and the dog. He wrote the rest of them down; there is no reason to think he did not write this one down too.',
      wrongKey: 'Not that one. The handset does not say how many tries are left, which usually means it is not counting.',
      setsFlag: 'phoneOpen',
      beat: 'device',
    },
    {
      id: 'dev-laptop',
      kind: 'laptop',
      label: 'Daniel-MBP.img',
      owner: 'Daniel Mercer',
      meta: '512 GB · imaged 12 Jun · read-only',
      connected: true,
      unlocked: true,
      unlockKey: '',
      unlockHint: '',
      wrongKey: '',
      setsFlag: null,
      beat: null,
    },
  ],

  services: [
    {
      id: 'svc-calls',
      entitlement: 'case001.call_history',
      title: 'Call Archive Recovery',
      unavailable:
        'This device holds the last 30 days of call metadata. Records older than 18 May are not on the handset.',
      offer:
        '90 additional days of call metadata, reconstructed from carrier records held by the recovery service.',
      realityNote:
        'This is a real purchase, charged outside the investigation. The case can be closed without it.',
      grantsEvidenceIds: ['e8'],
      grantsFileIds: ['f6'],
      completed: 'Recovery complete. 143 records restored.',
    },
  ],

  evidence: [
    {
      id: 'e1',
      source: 'RELAY MAIL — CLAIRE MERCER',
      sourceKind: 'mail',
      text: 'The phone was in the kitchen, which is the part I cannot get past — he did not go anywhere without it.',
      tags: ['claire', 'timeline'],
      reliability: 'testimonial',
    },
    {
      id: 'e2',
      source: 'FILES — draft-statement-v3.doc',
      sourceKind: 'files',
      text: 'Draft, unsent: "I have been asked to sign off on grant disbursements that I cannot trace past 2013." Named recipient: Oregon DOJ, Charitable Activities.',
      tags: ['daniel', 'marlow'],
      reliability: 'documentary',
    },
    {
      id: 'e3',
      source: 'FILES — receipt-fremont-0609.pdf',
      sourceKind: 'files',
      text: 'Fremont Street Parking. Entry 09 Jun 21:44, exit 09 Jun 22:47, lane 3. Card ending 4471.',
      tags: ['timeline', 'fremont'],
      reliability: 'documentary',
    },
    {
      id: 'e4',
      source: 'ORBIT — kgw-portland.com',
      sourceKind: 'browser',
      text: 'Richard Vale told KGW he last saw Mercer at the office on Sunday 7 June and that nothing about him seemed out of the ordinary.',
      tags: ['vale', 'statement'],
      reliability: 'documentary',
    },
    {
      id: 'e5',
      source: "DANIEL'S NOVA M12 — MESSAGES",
      sourceKind: 'phone',
      text: '09 Jun 21:58, from R: "Don\'t." Sent 46 minutes before the exit stamp on the parking receipt.',
      tags: ['vale', 'timeline'],
      reliability: 'documentary',
    },
    {
      id: 'e6',
      source: "DANIEL'S NOVA M12 — PHOTOS",
      sourceKind: 'phone',
      text: 'IMG_2214.HEIC. Taken 09 Jun 22:47. Parking structure, level 3. No embedded location.',
      tags: ['fremont', 'timeline'],
      reliability: 'documentary',
    },
    {
      id: 'e7',
      source: 'FILES — marlow-2013.enc',
      sourceKind: 'terminal',
      text: 'Marlow Foundation, 2013 annual filing. Directors: A. Marlow, J. Reyes, R. Vale. Vale resigned from the board in 2014.',
      tags: ['marlow', 'vale'],
      reliability: 'documentary',
    },
    {
      id: 'e9',
      source: 'FILES — grant-disbursements-2013.csv',
      sourceKind: 'files',
      text: 'Daniel\u2019s own working file. Eleven 2013 disbursements totalling $4,118,204, every one of them annotated "no counterparty on file".',
      tags: ['daniel', 'marlow'],
      reliability: 'documentary',
    },
    {
      id: 'e10',
      source: 'FILES — voicemail-0610.m4a',
      sourceKind: 'files',
      text: 'Voicemail transcript, 10 June 08:14, from R. Vale: "Call me back. I am not going to keep doing this by message."',
      tags: ['vale', 'timeline'],
      reliability: 'documentary',
    },
    {
      id: 'e8',
      source: "DANIEL'S NOVA M12 — RECOVERED CALLS",
      sourceKind: 'device',
      text: 'Outgoing, 09 Jun 22:51, 41 seconds, to a number listed in the handset as R. Vale.',
      tags: ['vale', 'timeline'],
      reliability: 'documentary',
    },
  ],

  claims: [
    {
      id: 'c1',
      text: 'Richard Vale was in contact with Daniel Mercer on the night of 9 June.',
      need: ['e3', 'e4', 'e5'],
      sound: true,
      accepted:
        'Filed. The parking receipt puts Daniel at Fremont Street until 22:47. The message from R is timed 21:58. Vale says he last saw him on the 7th. Two of those three are documents.',
      rejected:
        'Not yet. A contradiction needs both halves: what Vale said, and something that says otherwise with a time on it.',
    },
    {
      id: 'c2',
      text: 'Daniel Mercer was preparing to report the Marlow Foundation.',
      need: ['e2', 'e7'],
      sound: true,
      accepted:
        'Filed. An unsent draft naming the DOJ, and a filing that puts Vale on the board in the year the draft says the trail stops.',
      rejected: 'Not yet. An intention needs the document it was about.',
    },
    {
      id: 'c4',
      text: 'Richard Vale was still trying to reach Daniel Mercer after the day he disappeared.',
      need: ['e4', 'e10'],
      sound: true,
      accepted:
        'Filed. Vale told a reporter he last saw Mercer on the 7th and had noticed nothing. On the morning of the 10th he left a voicemail saying he was not going to keep doing this by message.',
      rejected:
        'Not yet. This one is about the gap between what he said in public and what he did in private, so it needs both.',
    },
    {
      id: 'c3',
      text: 'Daniel Mercer left Portland of his own accord.',
      need: ['e1', 'e3'],
      sound: false,
      accepted:
        'Filed, and on the record under your name. A receipt from a car park and a sister who expected him home do not add up to a man who chose to leave, and the file will keep your name next to that sentence.',
      rejected:
        'Refused, and filed anyway. You asserted something the evidence does not carry, and the record shows you asserted it.',
    },
  ],

  mail: [
    {
      id: 'm1',
      from: 'intake@unlisted',
      subject: 'CASE 24-118 assigned',
      time: '18:40',
      meta: 'To: you · Priority: standard',
      body: [
        'Case 24-118 — Daniel Mercer, 34. Missing person, Portland OR. Client: Claire Mercer (sister).',
        'Two sources attached to your workstation: a read-only image of the subject’s laptop, and the subject’s handset. The handset is locked and we do not hold the passcode.',
        'Portland Police are not treating the disappearance as suspicious. That is not a finding. It is a resourcing decision.',
      ],
      evidenceId: null,
      disputedClaim: null,
    },
    {
      id: 'm2',
      from: 'claire.mercer@fastmail.com',
      subject: 'everything I have',
      time: '18:52',
      meta: 'To: you · 3 attachments processed',
      body: [
        'I brought everything I had. The laptop was still on his desk. The phone was in the kitchen, which is the part I cannot get past — he did not go anywhere without it.',
        'I know what the police think. He is thirty-four and he is allowed to leave. But he called me on the Sunday and asked whether I still had dad’s lawyer’s number.',
        'The receipt was in his coat pocket. I do not know what it is for.',
      ],
      evidenceId: 'e1',
      disputedClaim: null,
    },
    {
      id: 'm4',
      from: 'records@fremontparking.com',
      subject: 'Re: records request — 09 June',
      time: '19:11',
      meta: 'To: you · Automated acknowledgement',
      body: [
        'Thank you for your request. Barrier camera footage is held on an eleven-day loop and is released to law enforcement on request.',
        'Your request refers to 9 June. Please note that recordings from that date will be overwritten on 20 June.',
        'Receipts carry the entry time, the exit time and the lane, and we can confirm a receipt against our own record without a warrant. Footage we cannot.',
      ],
      evidenceId: null,
      disputedClaim: null,
    },
    {
      id: 'm5',
      from: 'postmaster@ridgelinepartners.com',
      subject: 'Undeliverable: (no subject)',
      time: '19:18',
      meta: 'To: you · Delivery status notification',
      body: [
        'Your message to d.mercer@ridgelinepartners.com could not be delivered.',
        'Reason: mailbox disabled by administrator on 11 June 2026.',
        'This is an automated message. Please do not reply.',
      ],
      evidenceId: null,
      disputedClaim: null,
    },
    {
      id: 'm3',
      from: 'n.okafor@ridgelinepartners.com',
      subject: 'Re: Daniel',
      time: '19:04',
      meta: 'To: you · Sent from a personal device',
      body: [
        'I should not be writing to you and I am going to anyway.',
        'Daniel asked me in April how far back our grant files went. I told him 2014, because that is when the system was migrated. He asked who ran the migration.',
        'That is all I know and it is probably nothing. Please do not reply to this address.',
      ],
      evidenceId: null,
      disputedClaim: null,
    },
  ],

  unknownMail: {
    id: 'm-unknown',
    from: '—',
    subject: '(no subject)',
    time: '23:32',
    meta: 'To: you · No route recorded',
    opening: 'You have been on this file for four hours.',
    withClaim: 'You filed this: "{{claim}}". It is on the record now, under your name.',
    withoutClaim: 'You filed nothing. That is a decision too, and it is also on the record.',
    exposureLines: [
      {
        minExposure: 20,
        text: 'You made a lot of noise doing it. Somebody who was not watching this file this morning is watching it now.',
      },
      { minExposure: 8, text: 'You were careful. Not careful enough to be invisible.' },
    ],
    notesLine:
      'You wrote {{count}} characters into a notebook on a machine you do not own. Nobody has read them. That is not the same as nobody being able to.',
  },

  threads: [
    {
      id: 'unknown',
      label: '—',
      beat: null,
      script: [
        {
          who: '—',
          text: 'The handset syncs at 22:51 and then never again. Ask yourself what was still switched on at 22:51.',
          choices: [
            {
              text: 'Who is this?',
              reply: 'Somebody who has read this file before you did.',
              advances: false,
              setsFlag: null,
              requiresEvidence: null,
            },
            {
              text: 'Say something I can check.',
              reply: 'Lane three. The barrier camera at Fremont Street writes to a loop that keeps eleven days. Today is the seventeenth.',
              advances: true,
              setsFlag: null,
              requiresEvidence: null,
            },
          ],
        },
        { who: '—', text: 'Eight days left on the loop. Fewer by the time you decide.', choices: [] },
      ],
    },
    {
      id: 'claire',
      label: 'Claire Mercer',
      beat: 'claire',
      script: [
        {
          who: 'Claire Mercer',
          text: 'Are you the one they assigned? I have been told twice this week that there is nothing to investigate.',
          choices: [
            {
              text: 'There is a receipt in what you sent. Where did it come from?',
              reply: 'His coat. The grey one, on the hook. He wore it that night.',
              advances: true,
              setsFlag: null,
              requiresEvidence: null,
            },
            {
              text: 'Tell me about Sunday.',
              reply: 'He asked for dad’s lawyer’s number and then talked about nothing for twenty minutes.',
              advances: true,
              setsFlag: null,
              requiresEvidence: null,
            },
          ],
        },
        {
          who: 'Claire Mercer',
          text: 'He said he would be home by seven. He never says that. He just comes home.',
          choices: [
            {
              text: 'Did he ever mention Richard Vale outside work?',
              reply: 'Once. He said Richard was the reason he was still there, and then he stopped saying it.',
              advances: false,
              setsFlag: null,
              requiresEvidence: null,
            },
            {
              text: 'I am going to call Vale.',
              reply: 'Do it. Somebody should ask him something he has not rehearsed.',
              advances: true,
              // Calling him is a choice with a consequence, and the consequence is on the web.
              setsFlag: 'valeNotified',
              requiresEvidence: null,
            },
            {
              text: 'Vale was on the Marlow board in 2013. Daniel found that too.',
              reply: 'Then he knew. He knew and he still went to meet him.',
              advances: true,
              setsFlag: null,
              requiresEvidence: 'e7',
            },
          ],
        },
        {
          who: 'Claire Mercer',
          text: 'Whatever you find, I would rather know it than not. I want you to understand that before you tell me.',
          choices: [],
        },
      ],
    },
  ],

  browser,

  files: [
    {
      id: 'f1',
      name: 'CASE_24-118.txt',
      kind: 'note',
      meta: 'Plain text · 1 KB · intake',
      metaWhenDecrypted: null,
      body: 'CASE 24-118 — MERCER, DANIEL\n\nSubject: Daniel James Mercer, 34. 2214 NE Alberta St, Portland OR.\nLast seen: 09 Jun 2026, approx 21:20, leaving the above address on foot.\nClient: Mercer, Claire (sister).\n\nSOURCES ATTACHED\n  1. Daniel-MBP.img — read-only image, 512 GB, taken 12 Jun.\n  2. NOVA M12 handset — locked. Six-digit passcode. Client has tried 0412 (birthday)\n     and 1955 (the dog). Client mentions a card in his wallet with a number on the back;\n     the wallet was not recovered, but the number was copied into his own notes.\n\nNOTE: Portland Police are not treating the disappearance as suspicious.',
      bodyWhenDecrypted: null,
      evidenceId: null,
      disputedClaim: null,
      evidenceRequiresDecryption: false,
      beat: null,
    },
    {
      id: 'f2',
      name: 'draft-statement-v3.doc',
      kind: 'letter',
      meta: 'Document · 4 KB · modified 08 Jun 23:41',
      metaWhenDecrypted: null,
      body: 'DRAFT — NOT SENT\nTo: Oregon Department of Justice, Charitable Activities Section\n\nI am employed as an analyst at Ridgeline Partners. Since February I have been asked to sign off on grant disbursements to the Marlow Foundation that I cannot trace past 2013.\n\nThe 2013 records are described internally as lost in migration. I have been told this four times by three people. On each occasion the person telling me had no reason to know.\n\nI am aware of what this letter does to my position. I have a copy of the 2013 filing and I am prepared to explain how I obtained it.\n\n[unsigned]',
      bodyWhenDecrypted: null,
      evidenceId: 'e2',
      disputedClaim: null,
      evidenceRequiresDecryption: false,
      beat: 'statement',
    },
    {
      id: 'f3',
      name: 'receipt-fremont-0609.pdf',
      kind: 'scan',
      meta: 'Scan · 212 KB · from client',
      metaWhenDecrypted: null,
      body: 'FREMONT STREET PARKING\n1140 NE FREMONT ST\n\nENTRY   09 JUN 2026  21:44\nEXIT    09 JUN 2026  22:47\nLANE    3\nCARD    **** 4471\n\nTHANK YOU — RETAIN FOR YOUR RECORDS',
      bodyWhenDecrypted: null,
      evidenceId: 'e3',
      disputedClaim: null,
      evidenceRequiresDecryption: false,
      beat: null,
    },
    {
      id: 'f4',
      name: 'passcodes.txt',
      kind: 'note',
      meta: 'Plain text · 312 bytes · recovered from Daniel-MBP.img',
      metaWhenDecrypted: null,
      body: "Daniel's own notes file. Recovered from the desktop of the image.\n\n  gym locker      — 44\n  bike lock       — 8812\n  storage unit    — 0906\n  phone           — 190455\n  work laptop     — (fingerprint)\n\nHe wrote them down. Everybody writes them down.",
      bodyWhenDecrypted: null,
      evidenceId: null,
      disputedClaim: null,
      evidenceRequiresDecryption: false,
      beat: null,
    },
    {
      id: 'f5',
      name: 'marlow-2013.enc',
      kind: 'encrypted',
      // Six pages off a flatbed. What comes out of it is a scan, not a text file.
      kindWhenDecrypted: 'scan',
      meta: 'Encrypted · 88 KB · cannot be previewed',
      metaWhenDecrypted: 'Decrypted · 88 KB · scanned filing, 6 pages',
      body: 'This file is encrypted.\n\nThe console on this workstation can open it if you know what key to give it.\n\n  decrypt marlow-2013.enc --key <word>\n\nThree attempts are logged before the file reports itself.',
      bodyWhenDecrypted:
        'THE MARLOW FOUNDATION\nAnnual filing, year ended 31 December 2013\nOregon Secretary of State — Corporation Division\n\nDIRECTORS\n  A. Marlow      Chair\n  J. Reyes       Treasurer\n  R. Vale        Director (resigned 14 March 2014)\n\nGRANTS DISBURSED   $4,118,204\nGRANTS RECEIVED    $4,118,204\n\nNote 7: The Foundation received a single contribution of $4,100,000 from a donor who has\nrequested anonymity. The Board resolved to disburse the contribution within the same\nfinancial year.',
      evidenceId: 'e7',
      disputedClaim: null,
      evidenceRequiresDecryption: true,
      beat: null,
    },
    {
      id: 'f7',
      name: 'grant-disbursements-2013.csv',
      kind: 'sheet',
      meta: 'Spreadsheet · 11 rows · modified 02 Jun 21:07',
      metaWhenDecrypted: null,
      body: 'date,recipient,amount,counterparty_on_file\n2013-03-14,Marlow Foundation,412000,no\n2013-04-02,Marlow Foundation,388400,no\n2013-05-21,Marlow Foundation,401900,no\n2013-06-18,Marlow Foundation,376200,no\n2013-07-09,Marlow Foundation,395800,no\n2013-08-13,Marlow Foundation,362700,no\n2013-09-05,Marlow Foundation,408100,no\n2013-10-22,Marlow Foundation,371500,no\n2013-11-19,Marlow Foundation,399904,no\n2013-12-03,Marlow Foundation,384600,no\n2013-12-27,Marlow Foundation,417104,no\n\nTOTAL 4118204\n\n[cell comment, D1] asked three people. same answer four times. nobody had a reason to know.',
      bodyWhenDecrypted: null,
      evidenceId: 'e9',
      disputedClaim: null,
      evidenceRequiresDecryption: false,
      beat: null,
    },
    {
      id: 'f8',
      name: 'voicemail-0610.m4a',
      kind: 'audio',
      meta: 'Recording · 9 s · from client',
      metaWhenDecrypted: null,
      /*
       * Nine seconds, and the last two of them are him not hanging up. A transcript would have
       * thrown that away, which is the argument for the recording being a recording.
       */
      audio: {
        durationSec: 9,
        channel: 'Voicemail · 10 Jun 2026 08:14 · (503) 555-0197',
        cues: [
          { at: 0.4, who: 'R. Vale', text: 'It\u2019s me.' },
          { at: 1.8, who: 'R. Vale', text: 'Call me back.' },
          { at: 3.4, who: 'R. Vale', text: 'I am not going to keep doing this by message.' },
          { at: 7.1, who: '', text: '[line stays open]' },
        ],
      },
      body: 'Client note: I played this to the officer. He wrote down the date and that was all.',
      bodyWhenDecrypted: null,
      evidenceId: 'e10',
      disputedClaim: null,
      evidenceRequiresDecryption: false,
      beat: null,
    },
    {
      id: 'f6',
      name: 'call-archive-recovered.csv',
      kind: 'sheet',
      meta: 'Recovered · 143 records · 18 Feb – 18 May',
      metaWhenDecrypted: null,
      body: 'timestamp,direction,duration,contact\n2026-06-09 22:51,out,41,R. Vale\n2026-06-09 21:58,in,0,R. Vale (message)\n2026-06-07 09:12,out,412,R. Vale\n2026-05-28 18:03,out,77,C. Mercer\n… 139 further records',
      bodyWhenDecrypted: null,
      evidenceId: 'e8',
      disputedClaim: null,
      evidenceRequiresDecryption: false,
      beat: null,
    },
  ],

  /*
   * The pictures, filed under the source they came off rather than under the window that shows
   * them. The handset's roll and the workstation's viewer are the same three files: one carries
   * the line a phone would print under a thumbnail, the other carries what the extraction found.
   */
  photos: [
    {
      id: 'p1',
      label: 'IMG_2214.HEIC',
      meta: 'Taken 09 Jun 2026 22:47 · NOVA M12 · no embedded location',
      subject: 'parking-structure',
      sourceId: 'dev-phone',
      detail: [
        'Extracted from NOVA M12 · DCIM/100NOVA/IMG_2214.HEIC',
        'Capture 09 Jun 2026 22:47:03 · ISO 2500 · 1/15 s · f/1.8',
        'No GPS block. Location was switched off for the camera on this handset, and was off for every frame on it.',
        'No edit history. This is the file the camera wrote.',
      ],
      evidenceId: 'e6',
    },
    {
      id: 'p2',
      label: 'IMG_2201.HEIC',
      meta: 'Taken 08 Jun 2026 23:39 · NOVA M12 · 2214 NE Alberta St',
      subject: 'scanned-page',
      sourceId: 'dev-phone',
      detail: [
        'Extracted from NOVA M12 · DCIM/100NOVA/IMG_2201.HEIC',
        'Capture 08 Jun 2026 23:39:41 · ISO 800 · 1/30 s · f/1.8',
        'Subject is a printed page held flat under a desk lamp. Photographed, not scanned.',
        'Taken forty minutes before draft-statement-v3.doc was last modified.',
      ],
      evidenceId: null,
    },
    {
      id: 'p3',
      label: 'IMG_2180.HEIC',
      meta: 'Taken 02 Jun 2026 19:04 · NOVA M12 · 2214 NE Alberta St',
      subject: 'interior-night',
      sourceId: 'dev-phone',
      detail: [
        'Extracted from NOVA M12 · DCIM/100NOVA/IMG_2180.HEIC',
        'Capture 02 Jun 2026 19:04:22 · ISO 3200 · 1/8 s · f/1.8',
        'Underexposed by four stops. Nothing in the frame resolves, and enhancement will not make it.',
      ],
      evidenceId: null,
    },
  ],

  terminal: {
    prompt: 'nova$',
    banner: { text: 'NOVA console 3.2 — case volume CASE-24-118 mounted read-only', tone: 'dim' },
    statics: {
      help: [
        { text: 'ls · cat <file> · date · whoami · decrypt <file> --key <word> · relay', tone: 'out' },
      ],
      ls: [
        { text: 'CASE_24-118.txt   draft-statement-v3.doc   receipt-fremont-0609.pdf', tone: 'out' },
        { text: 'passcodes.txt     marlow-2013.enc', tone: 'out' },
      ],
      /*
       * The process table, and the one line in it nothing in the case explains.
       *
       * Nothing announces it and nothing reacts to it. The relay is reachable from here by
       * somebody who wonders what a session mirror is and goes looking — which is the whole
       * mechanic: the machine never points at the thing.
       */
      ps: [
        { text: '  PID  COMMAND', tone: 'dim' },
        { text: '  118  nova-session --case 24-118', tone: 'out' },
        { text: '  241  index --watch /volumes/case', tone: 'out' },
        { text: '  377  relay --idle', tone: 'out' },
        { text: '  412  smirror --peer 10.24.0.1 --quiet', tone: 'out' },
      ],
    },
    dateTemplate: 'Wed 17 Jun 2026 {{clock}} PDT',
    catTargets: {
      'case_24-118.txt': 'f1',
      'draft-statement-v3.doc': 'f2',
      'passcodes.txt': 'f4',
    },
    catBinary: 'cat: not a text file',
    whoami: [
      { text: 'investigator · session 24-118 · read-only on all attached sources', tone: 'out' },
    ],
    whoamiAfterEvidence: {
      evidenceId: 'e5',
      lines: [
        {
          text: 'note: handset access was granted by the client, not by the subject. the subject has not consented to anything you have read.',
          tone: 'dim',
        },
      ],
    },
    notFound: 'nova: {{command}}: command not found',
    relay: {
      command: 'relay',
      locked: [
        { text: 'relay: no outbound route on this session.', tone: 'err' },
        { text: 'relay: a case volume does not reach the open web by default.', tone: 'dim' },
      ],
      unlockPhrase: 'open the line',
      granted: [
        { text: 'relay: route opened. metered.', tone: 'ok' },
        { text: 'relay: everything you pull is captured and kept as read.', tone: 'dim' },
      ],
      opened: [{ text: 'relay: attached.', tone: 'ok' }],
    },
    decrypt: {
      key: 'reyes',
      fileId: 'f5',
      evidenceId: 'e7',
      success: 'decrypt: ok — 6 pages recovered',
      wrongKey: 'decrypt: wrong key. {{remaining}} attempts before the file reports.',
      usage: 'usage: decrypt <file> --key <word>',
      maxAttempts: 3,
      lockout: 'decrypt: this file has reported. no further attempts will be accepted.',
    },
  },

  relay: {
    signalBudget: 24,
    availableAtStart: false,
    searchCost: 1,
    openCost: 2,
    title: 'relay — attached',
    subtitle: 'outbound route · metered · every pull is captured',
    queryLabel: 'ask:',
    submitLabel: 'SEND',
    signalTemplate: 'lookups {{left}} of {{budget}}',
    capturedTemplate: 'captured {{when}} · {{bytes}} bytes · via {{provider}}',
    offlineTitle: 'no route',
    offlineBody:
      'The relay is attached and nothing is answering. There is no index on this side of the route — only the address. Try again when the far end is awake.',
    offlineDial:
      'It will still carry an address, if you give it one whole. Type the host and the path into the same field and it will fetch rather than ask.',
    exhausted:
      'The route is closed. This case paid for a fixed number of lookups and it has spent them.',
    emptyResults: 'Nothing came back. That is not the same as nothing being there.',
    refusals: {
      scheme: 'relay: unsupported transport. this route carries documents, nothing else.',
      credentials: 'relay: refused — that address carried a name and a password.',
      'private-address': 'relay: refused — that address is inside this building.',
      'metadata-endpoint': 'relay: refused — that address answers to the machine, not to you.',
      'own-origin': 'relay: refused — you are asking the route to fetch the route.',
      'redirect-loop': 'relay: the far end keeps handing this back to itself.',
      'too-many-redirects': 'relay: too many forwardings. gave up.',
      'content-type': 'relay: whatever that is, it is not a document.',
      'too-large': 'relay: too large to hold.',
      timeout: 'relay: no answer in time.',
      unresolvable: 'relay: that host does not resolve.',
      network: 'relay: the other side did not answer.',
    },
    fallbackRefusal: 'relay: refused. no reason given, which is itself a reason.',
    keepExposure: 1,
    docLabel: 'the document, line by line',
    keptHeading: 'CARRIED IN',
    keptNote:
      'These are not evidence. A filed claim rests on the case file, and a line pulled off the open web is context — it is how you knew where to look, not what you can show. You know it anyway.',
    pinLabel: 'KEEP THIS LINE',
    pinnedLabel: 'kept',
    closeLabel: 'detach the relay',
    backLabel: 'back to what came back',
    resultsLabel: 'came back:',
    linksLabel: 'this document names further addresses:',
    working: 'sending. the far end is not close.',
    costTemplate: 'opening this costs {{cost}}',
    pinHint: 'mark a line in the document first. this machine will not decide which line matters.',
    rateLimited: 'relay: too fast for the route. {{seconds}} seconds before it will carry again.',
  },

  phone: {
    device: 'NOVA M12',
    carrier: 'Cascade Mobile',
    /*
     * The thread is read backwards, one message at a time.
     *
     * The choices are the reading, not a conversation: nobody is going to reply to these. A
     * handset hands over its last evening in the order somebody scrolls, and the line that
     * matters is four messages down.
     */
    sms: [
      {
        who: 'Claire',
        text: 'call me when you get in',
        time: '09 Jun 18:22',
        choices: ['Scroll further back'],
        evidenceId: null,
      },
      {
        who: 'R',
        text: 'we should talk before monday. not at the office.',
        time: '09 Jun 20:31',
        choices: ['Keep reading'],
        evidenceId: null,
      },
      {
        who: 'Daniel',
        text: 'fremont, level 3. 10pm.',
        time: '09 Jun 20:34',
        choices: ['Keep reading'],
        evidenceId: null,
      },
      {
        who: 'R',
        text: "Don't.",
        time: '09 Jun 21:58',
        choices: ['Keep reading'],
        evidenceId: 'e5',
      },
      {
        who: 'Daniel',
        text: 'im already here',
        time: '09 Jun 22:02',
        choices: [],
        evidenceId: null,
      },
    ],
    contacts: [
      { name: 'Claire', number: '(503) 555-0142' },
      { name: 'R. Vale', number: '(503) 555-0197' },
      { name: 'N. Okafor', number: '(503) 555-0163' },
      { name: 'Ridgeline (office)', number: '(503) 555-0100' },
    ],
  },

  report: {
    timestamp: '17 JUN 2026 · 23:32',
    title: 'END OF SESSION',
    watchedLine: 'Somebody opened this case volume from another address at 23:19.',
    exposedLine: 'The file you built is not the only record of what you did tonight.',
    deeds: {
      evidence: 'You put {{count}} things in the file.',
      claims: 'You filed {{count}} of them as findings, under your name.',
      devices: 'You opened {{names}}.',
      notes: 'You wrote {{count}} characters into a notebook that is not yours.',
      kept: 'You carried {{count}} lines in from outside the case.',
      flagged: [
        {
          whenFlag: 'valeNotified',
          text: 'You told Richard Vale you were looking. His firm’s website is one sentence shorter than it was this afternoon.',
        },
        {
          whenFlag: 'decrypted',
          text: 'You opened an encrypted filing on a read-only image. The console logged it.',
        },
        {
          whenFlag: 'phoneOpen',
          text: 'You got into the handset. The client gave you permission. Daniel did not.',
        },
      ],
    },
    saveHeadline: 'Keep this investigation',
    saveBody:
      'The file, the record, and everything you found stays on this machine unless you save it. Saving takes an account and nothing else.',
    primaryCta: 'SAVE THIS INVESTIGATION',
    secondaryCta: 'Not yet',
    priceLine: 'Case 001 is free. It always will be.',
    surveillanceDelayMs: 3400,
  },

  requiredBeats: ['statement', 'claire', 'claim'],
  beatHints: {
    statement: 'read what he was drafting',
    claire: 'answer the client',
    device: 'get into the handset',
    claim: 'put a finding on the record',
  },
}
