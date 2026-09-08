import type { z } from 'zod'
import type { PhoneConfigSchema } from '@/engine/content-schema'

export const phone: z.input<typeof PhoneConfigSchema> = {
  device: 'NOKORA N90',
  carrier: 'MERIDIAN WIRELESS',
  sms: [
    {
      who: '503-555-0195',
      text: '(picture message — 96 KB — open in Photos)',
      time: '16/01 04:02',
      choices: ['(no reply sent)'],
      evidenceId: null,
    },
    {
      who: '503-555-0195',
      text: 'he is not answering me either. do not go to the branch today.',
      time: '16/01 04:07',
      choices: ['Who is this?'],
      evidenceId: 'e5',
    },
    {
      who: '503-555-0195',
      text: 'this number will not be here in an hour. do not try it.',
      time: '16/01 04:08',
      choices: [],
    },
  ],
  photos: [
    {
      id: 'IMG_0119',
      label: 'IMG_0119 — 96 KB',
      meta: '16/01/2009 04:02 · received from 503-555-0195 · no geotag · flash off, room already lit',
      subject: 'interior-night',
      evidenceId: 'e6',
    },
    {
      id: 'IMG_0120',
      label: 'IMG_0120 — 71 KB',
      meta: '16/01/2009 04:02 · received from 503-555-0195 · a card photographed on a desk, out of square',
      subject: 'scanned-page',
      evidenceId: null,
    },
    {
      // Still on the telephone, and no longer pinnable. What the player did with it on Thursday
      // is what they have; a second pin today would be a second object saying the same thing.
      id: 'IMG_0114',
      label: 'IMG_0114 — 78 KB',
      meta: '14/01/2009 22:08 · flash on · cell: PDX-CENTRAL-04 (SW 3rd & Ash, parking structure)',
      subject: 'parking-structure',
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
    { name: '(unlisted)', number: '503-555-0195' },
  ],
}
