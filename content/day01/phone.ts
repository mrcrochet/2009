import type { z } from 'zod'
import type { PhoneConfigSchema } from '@/engine/content-schema'

export const phone: z.input<typeof PhoneConfigSchema> = {
  device: 'NOKORA N90',
  carrier: 'MERIDIAN WIRELESS',
  sms: [
    {
      who: 'Marc',
      text: 'you home? need to drop something off.',
      time: '14/01 21:58',
      choices: ['(no reply sent)'],
      evidenceId: 'e5',
    },
    { who: 'Marc', text: 'nvm. handled it', time: '14/01 22:31', choices: ['Handled what?'] },
    {
      who: 'Marc',
      text: 'nothing. forget it. the kid was up late, thats all — 0412 if you need the safe',
      time: '14/01 22:33',
      choices: [],
    },
  ],
  photos: [
    {
      id: 'IMG_0114',
      label: 'IMG_0114 — 78 KB',
      meta: '14/01/2009 22:08 · flash on · geotag: 45.5231,-122.6412 (parking structure, SW 3rd)',
      subject: 'parking-structure',
      evidenceId: 'e6',
    },
    {
      id: 'IMG_0113',
      label: 'IMG_0113 — 61 KB',
      meta: '14/01/2009 19:40 · no flash · geotag: none',
      subject: 'interior-night',
      evidenceId: null,
    },
    {
      id: 'IMG_0098',
      label: 'IMG_0098 — 44 KB',
      meta: '22/12/2008 11:02 · scan of a printed page, unreadable at this size',
      subject: 'scanned-page',
      evidenceId: null,
    },
  ],
  contacts: [
    { name: 'Deleon, Marc', number: '503-555-0148' },
    { name: 'Voss, Lea', number: '503-555-0072' },
    { name: 'M', number: '—' },
    { name: 'Meridian S&L', number: '1-800-555-9910' },
  ],
}
