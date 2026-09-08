import type { z } from 'zod'
import type { WorldFactSchema } from '@/engine/world/schema'

type FactInput = z.input<typeof WorldFactSchema>

/**
 * What the world knows, authored separately from the traces that carry it.
 *
 * `register` is the density control. Out of every hundred pages the player reads, roughly sixty-five
 * should be completely ordinary, twenty economically interesting, ten a side story, four indirectly
 * strange and one genuinely wrong. If everything is about Aion the world is transparently artificial
 * within twenty minutes.
 *
 * Statements are for authors and are never shown. Write them as flat assertions — the drama belongs
 * in the artifacts, and a fact that reads as ominous here usually means the traces are doing too
 * little work.
 */
export const facts: FactInput[] = [
  // ------------------------------------------------------------------ ordinary
  {
    id: 'fact.marc-owns-saab',
    statement: 'Marc Deleon owns a black 1991 Saab 900. It runs badly and he keeps it anyway.',
    about: ['person.marc-deleon', 'vehicle.saab-900-black'],
    register: 'ordinary',
  },
  {
    id: 'fact.marc-lives-39th',
    statement: 'Marc Deleon rents the upper unit of a duplex at 1822 SE 39th Ave.',
    about: ['person.marc-deleon', 'place.1822-se-39th'],
    register: 'ordinary',
  },
  {
    id: 'fact.lea-lives-ankeny',
    statement: 'Lea Voss lives alone in apartment 4, 2118 SE Ankeny St.',
    about: ['person.lea-voss', 'place.2118-se-ankeny'],
    register: 'ordinary',
  },
  {
    id: 'fact.don-railway',
    statement: 'Don Ackerley has been building the same N scale layout since 1998.',
    about: ['person.don-ackerley'],
    register: 'ordinary',
  },
  {
    id: 'fact.mabry-wedding',
    statement: 'Karen and Doug Mabry married in August 2007 and have not updated the page since.',
    about: ['person.karen-mabry', 'person.doug-mabry'],
    register: 'ordinary',
  },
  {
    id: 'fact.ray-answers-everything',
    statement: 'Raymond Cott answers nearly every question on the Cascade Import Owners board.',
    about: ['person.raymond-cott', 'handle.raycott', 'org.portland-auto-parts'],
    register: 'ordinary',
  },
  {
    id: 'fact.hollis-vane-family',
    statement: 'Hollis & Vane has been run by the same family since 1931.',
    about: ['org.hollis-funeral'],
    register: 'ordinary',
  },
  {
    id: 'fact.morrison-branch-hours',
    statement:
      'The SE Morrison branch closes at five. The ATM is in an unlocked vestibule, open all night.',
    about: ['org.meridian-savings', 'place.1140-se-morrison'],
    register: 'ordinary',
  },
  {
    id: 'fact.december-snow',
    statement: 'The December 2008 snowstorm shut Portland down for most of a week.',
    about: ['org.columbia-register'],
    register: 'ordinary',
  },
  {
    id: 'fact.wesley-student',
    statement: 'Wesley Pike is a sophomore at Portland State and works shifts at a coffee place.',
    about: ['person.wesley-pike', 'handle.wespike'],
    register: 'ordinary',
  },
  {
    id: 'fact.ted-selling-board',
    statement: 'Ted Bramble is selling a snowboard he bought in 2004 and used twice.',
    about: ['person.ted-bramble'],
    register: 'ordinary',
  },
  {
    id: 'fact.hal-crt',
    statement: 'Hal Ottoway is giving away a 27-inch CRT television because he bought a flat one.',
    about: ['person.hal-ottoway'],
    register: 'ordinary',
  },
  {
    id: 'fact.priya-vet-tech',
    statement: 'Priya Raghunathan works at an animal hospital on SE Hawthorne.',
    about: ['person.priya-raghunathan'],
    register: 'ordinary',
  },
  {
    id: 'fact.eileen-teller',
    statement: 'Eileen Vasquez has worked the Morrison counter for nine years.',
    about: ['person.eileen-vasquez', 'org.meridian-savings'],
    register: 'ordinary',
  },
  {
    id: 'fact.geohost-guestbooks',
    statement: 'GeoHost pages carry guestbooks nobody has signed since about 2003.',
    about: ['domain.geohost'],
    register: 'ordinary',
  },
  {
    id: 'fact.cascade-guild-meets',
    statement: 'The Cascade Ceramics Guild meets on second Tuesdays and is short of members.',
    about: ['org.cascade-ceramics'],
    register: 'ordinary',
  },
  {
    id: 'fact.marc-phone-number',
    statement: 'Marc Deleon can be reached at 503-555-0148.',
    about: ['person.marc-deleon'],
    register: 'ordinary',
  },
  {
    id: 'fact.nokora-writes-serial',
    statement: 'The Nokora N90 camera writes its body serial into every frame it takes.',
    about: ['device.nokora-n90'],
    register: 'ordinary',
  },

  {
    id: 'fact.bus-cuts',
    statement: 'Two bus lines were cut and six reduced in the January service change.',
    about: ['org.columbia-register', 'place.2118-se-ankeny'],
    register: 'ordinary',
  },
  {
    id: 'fact.library-hours',
    statement:
      'Branch libraries lost their Monday hours in January and their evenings in November.',
    about: ['org.columbia-register'],
    register: 'ordinary',
  },

  // ------------------------------------------------------------------ economic
  {
    id: 'fact.gwen-office-closed',
    statement: 'The office Gwen Sorrel managed closed on 19 December with no notice to staff.',
    about: ['person.gwen-sorrel'],
    register: 'economic',
  },
  {
    id: 'fact.arcadia-passed',
    statement:
      'Arcadia Ventures passed on Lea Voss in November and told her the market was the reason.',
    about: ['org.arcadia-ventures', 'person.lea-voss'],
    register: 'economic',
  },
  {
    id: 'fact.storage-auctions-up',
    statement: 'Storage-unit auctions in Portland roughly doubled in the last quarter of 2008.',
    about: ['org.columbia-register', 'person.nora-kemp'],
    register: 'economic',
  },
  {
    id: 'fact.morrison-vacancy',
    statement: 'Three floors above the Morrison branch have been vacant since the summer.',
    about: ['place.1140-se-morrison'],
    register: 'economic',
  },
  {
    id: 'fact.parts-trade-down',
    statement: 'Portland Auto Parts is selling more used parts than new ones for the first time.',
    about: ['org.portland-auto-parts', 'person.raymond-cott'],
    register: 'economic',
  },
  {
    id: 'fact.register-cuts',
    statement:
      'The Columbia Register cut its newsroom by a fifth in October and stopped its Sunday magazine.',
    about: ['org.columbia-register'],
    register: 'economic',
  },

  {
    id: 'fact.foreclosure-notices-up',
    statement:
      "Trustee's sale notices in the Register's public notice column roughly tripled during 2008.",
    about: ['org.columbia-register'],
    register: 'economic',
  },
  {
    id: 'fact.pawn-volume',
    statement:
      'The pawn shop on SE Powell is buying more than it can sell and has stopped taking jewellery.',
    about: ['org.portland-auto-parts', 'org.columbia-register'],
    register: 'economic',
  },

  // ---------------------------------------------------------------- sideStory
  {
    id: 'fact.fenner-line-ended',
    statement: 'The Fenner Line broke up in November when their drummer moved to Seattle.',
    about: ['org.fenner-line', 'person.wesley-pike'],
    register: 'sideStory',
  },
  {
    id: 'fact.doreen-selling-kiln',
    statement: 'Doreen Halloway is selling her kiln because her hands have stopped cooperating.',
    about: ['person.doreen-halloway', 'org.cascade-ceramics'],
    register: 'sideStory',
  },
  {
    id: 'fact.priya-cat-missing',
    statement: "Priya Raghunathan's cat has been missing since 2 January.",
    about: ['person.priya-raghunathan'],
    register: 'sideStory',
  },

  // --------------------------------------------------------------- suggestive
  {
    id: 'fact.marc-downtown-14th',
    statement:
      'Marc was downtown between 22:00 and 22:20 on 14 January. He wrote at 23:51 that he stayed in.',
    about: ['person.marc-deleon', 'place.sw-3rd-ash-garage', 'place.1140-se-morrison'],
    register: 'suggestive',
  },
  {
    id: 'fact.phone-was-marcs',
    statement: "The Nokora Owen woke up holding was Marc's until the end of December.",
    about: ['device.nokora-n90', 'person.marc-deleon', 'person.owen-rask'],
    register: 'suggestive',
  },
  {
    id: 'fact.orbe-agent-of-record',
    statement:
      'Stefan Orbe is the registered agent on eleven Oregon filings, one of which is Aion Group.',
    about: ['person.stefan-orbe', 'org.aion-group'],
    register: 'suggestive',
  },

  // ---------------------------------------------------------------- anomalous
  {
    id: 'fact.eye-predates-aion',
    statement:
      'The Aion eye was served from blackbird-hosting.net in 2001, seven years before Aion Group LLC was registered.',
    about: ['org.aion-group', 'domain.blackbird', 'org.blackbird-hosting'],
    register: 'anomalous',
  },
]
