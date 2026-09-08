import type { z } from 'zod'
import type { ThreadSchema } from '@/engine/content-schema'

type ThreadInput = z.input<typeof ThreadSchema>

export const threads: ThreadInput[] = [
  {
    id: 'unknown',
    label: 'unknown_',
    beat: null,
    script: [
      { who: 'unknown_', text: 'You have 30 days.', choices: ['Who is this?', 'What happens after 30 days?'] },
      {
        who: 'unknown_',
        text: 'A file will appear on your desktop. Read it. Then stop asking me things I will not answer.',
        choices: ['Why me?'],
      },
      { who: 'unknown_', text: 'Because the name you are using is available. — M', choices: [] },
    ],
  },
  {
    id: 'marc',
    label: 'Marc',
    beat: 'marc',
    script: [
      {
        who: 'Marc',
        text: 'youre up. good. i have a thing that pays today, no questions',
        choices: ['What kind of thing?', 'Where were you last night?'],
      },
      {
        who: 'Marc',
        text: 'guy on tradepost is dumping a phone he doesnt know the value of. 60 bucks. you flip it, we split',
        choices: ['Send me the listing.', 'You said you were home last night.'],
      },
      { who: 'Marc', text: 'i was home. why are you asking me that', choices: [] },
    ],
  },
  {
    id: 'lea',
    label: 'Lea',
    beat: null,
    script: [
      {
        who: 'Lea',
        text: 'you dont know me but marc gave me this screen name. im the one building the thing he keeps calling “the website”',
        choices: ['What are you building?', 'Why are you messaging me at 4am?'],
      },
      {
        who: 'Lea',
        text: 'a way to put a short clip on a page without a plugin. everyone says nobody wants that. i think everyone is wrong',
        choices: ['Everyone is wrong.', 'How much would it take to finish it?'],
      },
      {
        who: 'Lea',
        text: 'nine thousand and four months. i have neither. also i think there is a car outside my building again. probably nothing',
        choices: ['Post about the car somewhere public.', 'Say nothing about the car.'],
      },
      { who: 'Lea', text: 'ok. posted it to cluster. if i vanish at least it is written down somewhere', choices: [] },
    ],
  },
]
