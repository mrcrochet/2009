import type { z } from 'zod'
import type { ThreadSchema } from '@/engine/content-schema'

type ThreadInput = z.input<typeof ThreadSchema>

/**
 * Every choice answers itself.
 *
 * A branching-looking script that ignores what was picked is worse than an honest linear one:
 * ask Marc where he was on the 14th and get a sales pitch about a telephone, and the player
 * learns in ten seconds that nothing they say matters. `reply` is what the other person actually
 * says back; the script's next line follows it, which is how a person changes the subject.
 */
export const threads: ThreadInput[] = [
  {
    id: 'unknown',
    label: 'unknown_',
    beat: null,
    script: [
      {
        who: 'unknown_',
        text: 'You have 30 days.',
        choices: [
          { text: 'Who is this?', reply: 'Someone who is already finished asking you things.' },
          {
            text: 'What happens after 30 days?',
            reply: 'Nothing happens after. That is the point of a deadline.',
          },
        ],
      },
      {
        who: 'unknown_',
        text: 'A file will appear on your desktop. Read it. Then stop asking me things I will not answer.',
        choices: [{ text: 'Why me?', reply: '' }],
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
        choices: [
          {
            text: 'What kind of thing?',
            reply: 'nothing that needs a name. you drive, you hand over cash, thats it',
          },
          {
            // Offered only once the photograph is pinned — you cannot accuse a man of lying
            // before you are holding the thing that proves it.
            text: 'Where were you last night?',
            reply: 'home. why',
            requiresEvidence: 'e6',
          },
        ],
      },
      {
        who: 'Marc',
        text: 'guy on tradepost is dumping a phone he doesnt know the value of. 60 bucks. you flip it, we split',
        choices: [
          {
            text: 'Send me the listing.',
            reply: 'tradepost, portland, electronics. its the nokora. dont haggle, just take it',
          },
          { text: 'You said you were home last night.', reply: '' },
        ],
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
        choices: [
          {
            text: 'What are you building?',
            reply:
              'a way to put a short clip on a page without a plugin. everyone says nobody wants that',
          },
          {
            text: 'Why are you messaging me at 4am?',
            reply:
              'because i have not been sleeping. that is the honest answer and i am too tired to give you the other one',
          },
        ],
      },
      {
        who: 'Lea',
        text: 'marc says you know things. he says it like a joke. i dont think he means it as one',
        choices: [
          {
            text: 'I know your demo works.',
            reply: 'nobody has said that to me out loud. not once. how do you know that',
          },
          {
            text: 'Marc talks too much.',
            reply: 'he does. he is also the only person who answers me',
          },
        ],
      },
      {
        who: 'Lea',
        text: 'also the car is still there this morning. i already put something on cluster about it at four like an idiot',
        choices: [
          {
            text: 'Post about it again. Get the plate.',
            reply:
              'ok. partial plate, oregon, starts with 4. posted. if i vanish at least it is written down somewhere',
            setsFlag: 'leaPostedAgain',
          },
          {
            // The player can talk her out of the only public record of what is happening to
            // her — and out of the evidence that would have proved it.
            text: 'Take the post down.',
            reply: 'ok. taken down. you are probably right that it just makes me easier to find',
            setsFlag: 'leaPostRemoved',
          },
        ],
      },
      {
        who: 'Lea',
        text: 'nine thousand and four months is what finishing it would take. i have neither',
        choices: [],
      },
    ],
  },
]
