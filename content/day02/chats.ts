import type { z } from 'zod'
import type { ThreadSchema } from '@/engine/content-schema'

type ThreadInput = z.input<typeof ThreadSchema>

/**
 * The night event puts the player in `threads[0]`, so Lea is first: the day opens on a person
 * rather than on a handler, and the handler has to be gone to on purpose.
 *
 * `requiresEvidence` is qualified with the day being played unless the id already names one, so
 * `'e7'` means this morning's route sheet and `'1:e6'` means the photograph the player pinned on
 * Thursday. A line the player earned yesterday is still theirs today, and it opens a door in a
 * conversation that did not exist yesterday.
 */
export const threads: ThreadInput[] = [
  {
    id: 'lea',
    label: 'Lea',
    beat: 'voss',
    script: [
      {
        who: 'Lea',
        text: 'the car is gone. i slept four hours and i keep going to the window like an idiot',
        choices: [
          {
            text: 'Did you see who was driving it?',
            reply:
              'no. a shape. i have spent the whole morning telling myself it was a shape and it has not worked once',
            advances: false,
          },
          {
            text: 'Who told you it was gone?',
            reply:
              'nobody told me. it is simply not there. that is the entire contents of what i know',
          },
        ],
      },
      {
        who: 'Lea',
        text: 'marc gave somebody my screen name and then stopped answering his own. i have decided i am allowed to ask you about that',
        choices: [
          {
            text: 'I do not know where he is.',
            reply: 'ok. that is at least an answer with a shape to it',
          },
          {
            // Only offered to a player holding this morning's route sheet. Telling her is not
            // obviously the kind thing to do, and the day-end card says so either way.
            text: 'His address is on a collection route for this morning.',
            reply:
              'then he did not stop answering. somebody stopped him answering. i am going to put that somewhere other people can see it and you can tell me afterwards whether that was stupid',
            requiresEvidence: 'e7',
            setsFlag: 'leaToldAboutMarc',
          },
        ],
      },
      {
        who: 'Lea',
        text: 'there is work if you want it. a man i know cannot be seen bidding at the lien sale on hawthorne and he will pay somebody who can',
        choices: [
          {
            text: 'What is in the unit?',
            reply: 'if anybody knew that it would not be two hundred and fifty dollars',
            advances: false,
          },
          {
            text: 'Where do I go?',
            reply:
              'unit 214, hawthorne self storage. they cut the lock at eleven and it is cash at the door. do not say my name to him',
          },
        ],
      },
      {
        who: 'Lea',
        text: 'i am going to my sister in salem tonight. i am telling you because there is nobody else left to tell',
        choices: [],
      },
    ],
  },
  {
    id: 'unknown',
    label: 'unknown_',
    beat: null,
    script: [
      {
        who: 'unknown_',
        text: 'You are still here. That is worth something to somebody, and not to you.',
        choices: [
          {
            text: 'Who signed the card?',
            reply: 'Somebody who needed the work. It is always somebody who needed the work.',
            advances: false,
          },
          {
            text: 'You knew he was not at home on the fourteenth.',
            reply:
              'Everybody knew. He is not a careful man and he was never the one who had to be.',
            requiresEvidence: '1:e6',
            advances: false,
          },
          {
            text: 'What am I supposed to do with a statement?',
            reply: 'Keep it. A statement is the only thing in this business that does not lie.',
          },
        ],
      },
      {
        who: 'unknown_',
        text: 'Do not go to Morrison in person. Not today, and not on Monday when the doors open again.',
        choices: [
          {
            text: 'I will stay away.',
            reply: 'Good. It is the first sensible thing you have done in two days.',
            setsFlag: 'stayedAway',
          },
          {
            text: 'I will go on Monday.',
            reply:
              'Then I will not write to you again, and you can decide afterwards whether that was a threat.',
            setsFlag: 'wentToward',
          },
        ],
      },
      {
        who: 'unknown_',
        text: 'Twenty-eight days. The amount has not moved and neither have you. — M',
        choices: [],
      },
    ],
  },
  {
    // Not a conversation. The tab is here because the player will click it, and what is behind it
    // is a client message with a timestamp on it, which is worse than silence.
    id: 'marc',
    label: 'Marc',
    beat: null,
    script: [
      {
        who: 'Ember',
        text: 'Marc Deleon has not signed in since 14 Jan, 22:41. Messages will be delivered when he next connects.',
        choices: [],
      },
    ],
  },
]
