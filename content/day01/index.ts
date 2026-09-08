import type { z } from 'zod'
import type { DayContentSchema } from '@/engine/content-schema'
import { apps, dock } from '@/content/apps'
import { evidence } from './evidence'
import { claims } from './claims'
import { memories, recallConfig } from './recall'
import { mail, unknownMail } from './emails'
import { threads } from './chats'
import { browser } from './browser'
import { files } from './files'
import { terminal } from './terminal'
import { economy } from './economy'
import { phone } from './phone'

export const boot = [
  'HALCYON 4.1  (build 4.1.882)',
  '',
  'Memory check ........ 2048 MB OK',
  'Volume “Macintosh HD” ... mounted',
  'Network interface en0 ... 10.0.1.14',
  'Last login: Wed Jan 14 22:14:03 on console',
  '',
  'Restoring session for user: orask',
  '',
  'Loading desktop …',
]

export const day01: z.input<typeof DayContentSchema> = {
  day: 1,
  dateISO: '2009-01-15',
  location: 'Portland, Oregon',
  identity: 'Owen T. Rask',
  osName: 'HALCYON 4.1',
  boot,
  bootIntervalMs: 170,
  bootHoldMs: 700,
  messengerOpensAtMs: 1100,
  desktopIconAtMs: 2600,
  chatReplyDelayMs: 900,
  apps,
  dock,
  evidence,
  claims,
  memories,
  recall: recallConfig,
  mail,
  unknownMail,
  threads,
  browser,
  files,
  terminal,
  economy,
  phone,
  dayEnd: {
    timestamp: '15 JANUARY 2009 · 23:41',
    title: 'DAY 01\nCOMPLETE',
    watchedLine: 'Someone was watching the last four hours of this.',
    shiftedLine: 'One page you read today no longer says what it said.',
    saveHeadline: 'Day 02 is available.',
    saveBody: 'Your timeline is held locally. Save it to keep the version of 2009 you just made.',
    primaryCta: 'CONTINUE YOUR TIMELINE',
    secondaryCta: 'Save this timeline — free',
    priceLine:
      'Full access · $6.99/mo — days 02–30, alternate timelines, the scenarios that only exist if you fail.',
    surveillanceDelayMs: 3400,
  },
  requiredBeats: ['readme', 'marc', 'recall', 'money', 'claim'],
}
