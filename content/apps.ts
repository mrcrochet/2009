import type { z } from 'zod'
import type { AppDefinitionSchema } from '@/engine/content-schema'

type AppInput = z.input<typeof AppDefinitionSchema>

/** Window geometry is taken verbatim from the Claude Design handoff. */
export const apps: AppInput[] = [
  { id: 'mail', title: 'Corvid Mail', mono: 'M', width: 640, height: 410 },
  { id: 'msg', title: 'Ember Messenger', mono: 'E', width: 318, height: 392 },
  { id: 'web', title: 'Halcyon Browser', mono: 'W', width: 720, height: 472 },
  { id: 'files', title: 'Files', mono: 'F', width: 600, height: 352 },
  { id: 'bank', title: 'Meridian Savings', mono: 'B', width: 472, height: 364 },
  { id: 'mkt', title: 'Quoteline', mono: 'Q', width: 520, height: 340 },
  { id: 'notes', title: 'Notes', mono: 'N', width: 352, height: 300 },
  { id: 'term', title: 'Terminal', mono: '>', width: 568, height: 328 },
  { id: 'recall', title: 'Recall', mono: 'R', width: 428, height: 352 },
]

export const dock = ['mail', 'msg', 'web', 'files', 'bank', 'mkt', 'notes', 'term', 'recall', 'phone']
