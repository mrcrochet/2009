import type { z } from 'zod'
import type { WorldArtifactSchema } from '@/engine/world/schema'

type ArtifactInput = z.input<typeof WorldArtifactSchema>

/**
 * Every trace the world leaves, in whatever voice left it.
 *
 * Two rules held this file together while it was written. **One fact, many surfaces:** a truth worth
 * knowing shows up in an email, a photograph, a classified, a receipt, a handle and a record, and the
 * player needs two of the six. **Nobody is the narrator:** Marc types lowercase and skips apostrophes,
 * a bank sounds like a bank, a 2004 forum post sounds like 2004, and a man describing his model
 * railway is sincere about it. Nobody in here is witty.
 *
 * Dates are ISO because the index sorts on them lexically, and carry an hour whenever the hour is
 * part of the evidence — which for an alibi it always is.
 */

// ---------------------------------------------------------------------------
// Marc Deleon owns a black Saab 900.
//
// The worked example. Six traces, no two on the same surface, none of them announcing itself. A
// player who reads the classified and the pickup list has it. A player who only ever notices the
// handle still has it. Nobody has to find all six — the other four are why the world has depth.
// ---------------------------------------------------------------------------

const saab: ArtifactInput[] = [
  {
    id: 'art.saab-forum-intro',
    type: 'forumPost',
    date: '2006-03-14',
    title: 'new guy, 91 900 with 210k on it',
    body: `hi all. picked up a 91 900 last month off a guy in gresham, non turbo, 210k miles, black
with the grey interior. it runs. thats about the nicest thing i can say about it right now.

first question. the temp gauge sits about a needle width below halfway and never moves, in traffic,
on the highway, doesnt matter. is that a thermostat or is that the gauge. i dont want to pull the
thermostat if the answer is the gauge.

second question, and sorry if this is asked every week. where does everybody in portland get parts.
the dealer wanted 90 dollars for a part i can see costs 12 dollars to make.

--
saabman81
'91 900 · se portland`,
    source: 'Cascade Import Owners · Introductions',
    surface: 'web',
    url: 'cascadeimports.com/board/8814',
    ownerEntityId: 'handle.saabman81',
    mentions: ['handle.saabman81', 'person.marc-deleon', 'vehicle.saab-900-black'],
    fields: {
      Board: 'Cascade Import Owners',
      Author: 'saabman81',
      Replies: '4',
      Signature: "'91 900 · se portland",
    },
    factId: 'fact.marc-owns-saab',
  },
  {
    id: 'art.saab-classified',
    type: 'classified',
    date: '2008-11-02',
    title: 'Saab 900 — parts wanted',
    body: `Looking for parts off an 85-93 Saab 900, non-turbo. Specifically a fuel pump assembly and
the plastic surround for the driver door handle, mine snapped in the cold.

Whole car considered if it's cheap and it's black. Cash, I can come to you, weekends are easier.

Portland, SE. No dealers.`,
    source: 'TradePost · Parts & Accessories',
    surface: 'web',
    url: 'tradepost.com/pdx/parts/118402',
    ownerEntityId: 'person.marc-deleon',
    mentions: ['person.marc-deleon', 'vehicle.saab-900-black', 'org.tradepost'],
    fields: {
      Category: 'Auto parts',
      Contact: '503-555-0148',
      Location: 'Portland, SE',
      Reposted: '3 times',
    },
    factId: 'fact.marc-owns-saab',
  },
  {
    id: 'art.saab-email-parts',
    type: 'email',
    date: '2008-11-19T16:41',
    title: 'fuel pump — 900',
    body: `ray

you said to email instead of calling because the counter phone is a nightmare after 4. the pump on
the 900 is going. it primes but it takes two turns of the key and then it drops off on the highway
like somebody switched it off.

do you have a used one or do i have to buy new. i dont want to buy new. also the door handle surround,
driver side, part number is something like 8556 something, i can find it if you need it.

can pick up saturday.

thanks
marc`,
    source: 'm.deleon@fastwebmail.net → parts@portlandautoparts.com',
    surface: 'mail',
    ownerEntityId: 'person.marc-deleon',
    mentions: [
      'person.marc-deleon',
      'person.raymond-cott',
      'org.portland-auto-parts',
      'vehicle.saab-900-black',
    ],
    fields: { From: 'm.deleon@fastwebmail.net', To: 'parts@portlandautoparts.com' },
    factId: 'fact.marc-owns-saab',
  },
  {
    id: 'art.saab-order-pickup',
    type: 'transaction',
    date: '2008-11-22',
    title: 'Will-call — ready for pickup',
    body: `PORTLAND AUTO PARTS — WILL CALL
3400 SE Powell Blvd · 503-555-0110

Orders held at the counter. Bring the order number. Unclaimed after 30 days, restocking applies.

  ORD-40118   BRAMBLE, T.    wiper linkage, pickup              READY
  ORD-40122   DELEON, M.     fuel pump asm, used, 900 n/t       READY
                             door handle surround, drv, blk
  ORD-40127   HALLOWAY       battery, group 24                  READY
  ORD-40131   MABRY, D.      cabin filter x2                    ORDERED`,
    source: 'portlandautoparts.com/willcall',
    surface: 'web',
    ownerEntityId: 'org.portland-auto-parts',
    mentions: [
      'org.portland-auto-parts',
      'person.marc-deleon',
      'person.ted-bramble',
      'person.doreen-halloway',
      'person.doug-mabry',
      'vehicle.saab-900-black',
    ],
    fields: { Order: 'ORD-40122', Total: '$214.00', Status: 'READY' },
    amountCents: 21400,
    factId: 'fact.marc-owns-saab',
  },
  {
    id: 'art.saab-photo-edge',
    type: 'photo',
    date: '2008-12-03T18:22',
    title: 'IMG_0087.JPG',
    body: `A kitchen counter, shot from above, the flash blowing out the middle of the frame. A set of
keys on a folded newspaper. The fob is black plastic with a worn logo, and the key beside it is the
long flat kind. Behind the keys, most of the way out of frame at the left edge, is a dark car door
seen through a window — enough of it to read the shape of the mirror, not enough to read anything else.

Nobody is in the picture.`,
    source: 'Photos · IMG_0087.JPG',
    surface: 'phone',
    ownerEntityId: 'device.nokora-n90',
    mentions: ['device.nokora-n90', 'vehicle.saab-900-black', 'person.marc-deleon'],
    fields: {
      Taken: '03/12/2008 18:22',
      Camera: 'NOKORA N90',
      Serial: 'XJ18172',
      Location: 'not recorded',
      Size: '1600 x 1200',
    },
    factId: 'fact.marc-owns-saab',
  },
  {
    id: 'art.saab-tow-notice',
    type: 'record',
    date: '2008-12-27',
    title: 'Vehicle removal notice — SE 39th Ave',
    body: `CITY OF PORTLAND · BUREAU OF TRANSPORTATION
NOTICE OF VEHICLE REMOVAL — SNOW ROUTE

The following vehicles were removed from posted snow routes between 22 and 26 December and may be
recovered from the impound lot on NE Columbia Blvd. Storage accrues daily.

  LOCATION            VEHICLE                      PLATE (PARTIAL)
  SE 39th / Clinton   SEDAN, SAAB, BLK, 4DR        2 8 - - -
  SE 39th / Division  PICKUP, RED, EXT CAB         9 4 - - -
  SE Powell / 34th    SEDAN, SIL, 4DR              2 1 - - -

Partial plates as recorded by the removal contractor. Owners must present registration.`,
    source: 'Columbia Register · Public notices, 27 December',
    surface: 'archive',
    url: 'register.archive/notices/2008-12-27/snow-route-removals',
    ownerEntityId: null,
    mentions: [
      'vehicle.saab-900-black',
      'place.1822-se-39th',
      'org.columbia-register',
      'person.marc-deleon',
    ],
    fields: { Plate: '2 8 - - -', Vehicle: 'SAAB, BLK, 4DR', Removed: 'snow route' },
    factId: 'fact.marc-owns-saab',
  },
]

// ---------------------------------------------------------------------------
// Marc was not where he said he was on the night of the 14th.
//
// The thesis of the game, expressed as data rather than as a reveal. Day 01 already gives the player
// the SMS at 21:58, the photograph at 22:08 and the withdrawal at 22:17. These are the traces that
// let someone arrive at the conclusion on their own — a call log with a tower, a ticket from the
// garage, a camera frame, and a neighbour who noticed nothing except a car alarm.
//
// None of them says "Marc lied". The email that says he stayed in is already in his sent mail.
// ---------------------------------------------------------------------------

const alibi: ArtifactInput[] = [
  {
    id: 'art.call-log-14th',
    type: 'call',
    date: '2009-01-14T22:13',
    title: 'Call log — 14 January',
    body: `RECENT CALLS

  22:13   OUT   503-555-0072            0:11    PDX-CENTRAL-04
  21:56   OUT   503-555-0148            1:34    PDX-CENTRAL-04
  19:40   IN    1-800-555-9910          0:04    PDX-SE-07
  18:12   OUT   503-555-0110            2:20    PDX-SE-07

Cell shown is the tower that carried the call, not a position.`,
    source: 'Phone · Call log',
    surface: 'phone',
    ownerEntityId: 'device.nokora-n90',
    mentions: [
      'device.nokora-n90',
      'person.lea-voss',
      'person.marc-deleon',
      'place.sw-3rd-ash-garage',
      'org.meridian-savings',
    ],
    fields: {
      Number: '503-555-0072',
      Duration: '0:11',
      Tower: 'PDX-CENTRAL-04',
      Direction: 'Outgoing',
    },
    factId: 'fact.marc-downtown-14th',
  },
  {
    id: 'art.garage-ticket',
    type: 'record',
    date: '2009-01-14T22:20',
    title: 'Parking ticket stub — SW 3rd & Ash',
    body: `      SW 3RD & ASH GARAGE
       PORTLAND · LEVEL 4

  IN    01/14/09   21:47
  OUT   01/14/09   22:20
  ------------------------
  0 HR 33 MIN          $3.00
  CASH

  LOST TICKET RATE $22.00
  KEEP THIS STUB WITH YOU`,
    source: 'Files · scanned, folded in half',
    surface: 'files',
    ownerEntityId: null,
    mentions: ['place.sw-3rd-ash-garage', 'person.marc-deleon', 'vehicle.saab-900-black'],
    fields: { In: '21:47', Out: '22:20', Level: '4', Paid: '$3.00' },
    amountCents: 300,
    factId: 'fact.marc-downtown-14th',
    // Marc wrote at 23:51 that he stayed in all evening. He was on level 4 of a garage
    // downtown at 21:47. Declared here so the machine can say the player is holding two things
    // that cannot both be true — never which of them is the lie.
    contradicts: ['d1.mail.m3'],
    disputedClaim: 'IN 01/14/09 21:47 · OUT 01/14/09 22:20 · LEVEL 4',
  },
  {
    id: 'art.atm-frame-index',
    type: 'record',
    date: '2009-01-14T22:17',
    title: 'ATM camera — frame index, Morrison',
    body: `MERIDIAN SAVINGS & LOAN
VESTIBULE CAMERA · UNIT 4 · SE MORRISON
FRAME INDEX — 14/01/2009

  22:16:41   vestibule empty
  22:17:04   one figure, hood up, back to camera
  22:17:29   one figure, hood up, back to camera
  22:17:52   vestibule empty
  22:31:10   vestibule empty

Retention 30 days. Frames are indexed at the machine; images are held at the branch and are released
on written request only.`,
    source: 'Meridian Savings · branch systems',
    surface: 'archive',
    url: 'meridian.archive/branch/morrison/camera/2009-01-14',
    ownerEntityId: 'org.meridian-savings',
    mentions: [
      'org.meridian-savings',
      'place.1140-se-morrison',
      'account.meridian-4471',
      'person.marc-deleon',
    ],
    fields: { Camera: 'Vestibule, unit 4', Retention: '30 days', Subjects: '1' },
    factId: 'fact.marc-downtown-14th',
  },
  {
    id: 'art.lea-eleven-seconds',
    type: 'forumPost',
    date: '2009-01-15T08:02',
    title: 'ok now im annoyed',
    body: `someone called me at 22:13 last night and hung up after eleven seconds. not a wrong number,
eleven seconds is long enough to hear someone breathe and decide something. number wasnt one i know.

i called it back this morning and it rang out. no voicemail, no name.

third night in a row something. i know how this sounds. im writing it down so that if i stop writing
it down someone notices.`,
    source: 'Cluster · leavoss',
    surface: 'web',
    url: 'cluster.com/leavoss/ok-now-im-annoyed',
    ownerEntityId: 'person.lea-voss',
    mentions: ['person.lea-voss', 'device.nokora-n90', 'place.2118-se-ankeny'],
    fields: { Author: 'leavoss', Posted: '15 Jan, 08:02', Comments: '0' },
    factId: 'fact.marc-downtown-14th',
  },
  {
    id: 'art.se39th-alarm',
    type: 'forumPost',
    date: '2009-01-15T10:44',
    title: 'car alarm on 39th, roughly nine to midnight',
    body: `To whoever on the 1800 block of SE 39th owns the car that was going off last night — it
started around nine and it was still going at eleven thirty. Not continuously. Every twenty minutes
or so, thirty seconds at a time.

I don't mind so much that it went off. I mind that nobody came out. I stood on my porch twice
looking at the upstairs windows and there were no lights on the whole evening.

If it's yours, the sensor is too sensitive, it's been cold, that does it.`,
    source: 'Cluster · SE Portland',
    surface: 'web',
    url: 'cluster.com/pdx/se/car-alarm-on-39th',
    ownerEntityId: null,
    mentions: ['place.1822-se-39th', 'person.marc-deleon', 'vehicle.saab-900-black'],
    fields: { Board: 'Cluster · SE Portland', Comments: '2' },
    factId: 'fact.marc-downtown-14th',
    contradicts: ['d1.mail.m3'],
    disputedClaim:
      'I stood on my porch twice looking at the upstairs windows and there were no lights on the whole evening',
  },
]

// ---------------------------------------------------------------------------
// The phone was Marc's.
//
// The chain nobody is told is a chain. IMG_0087 was taken on 3 December — two weeks before Owen died
// and a month before his account existed — by a camera whose serial is written into the frame. The
// same serial is in a photo saabman81 posted to a car board in 2008. The carrier record closes it.
//
// A player who notices the serial has solved something nobody told them was a puzzle.
// ---------------------------------------------------------------------------

const phone: ArtifactInput[] = [
  {
    id: 'art.saabman-photo-exif',
    type: 'forumPost',
    date: '2008-10-08',
    title: 're: post a picture of your car',
    body: `heres mine. taken in the driveway before the rain came back. the paint is not as good as it
looks in this, its got a whole panel thats a different black.

sorry about the size, its off my phone.

--
saabman81
'91 900 · se portland

[ attachment: DSC_0044.JPG · 1600x1200 · NOKORA N90 · body XJ18172 ]`,
    source: 'Cascade Import Owners · Post a picture of your car',
    surface: 'web',
    url: 'cascadeimports.com/board/6602',
    ownerEntityId: 'handle.saabman81',
    mentions: [
      'handle.saabman81',
      'person.marc-deleon',
      'device.nokora-n90',
      'vehicle.saab-900-black',
    ],
    fields: {
      Attachment: 'DSC_0044.JPG',
      Camera: 'NOKORA N90',
      Serial: 'XJ18172',
      Author: 'saabman81',
    },
    factId: 'fact.phone-was-marcs',
  },
  {
    id: 'art.wireless-topup-dec',
    type: 'record',
    date: '2008-12-04',
    title: 'Prepaid top-up receipt',
    body: `MERIDIAN WIRELESS — PREPAID
TOP-UP RECEIPT · RETAIN FOR YOUR RECORDS

  ACCOUNT       ····5520
  NAME ON FILE  DELEON, M
  HANDSET       NOKORA N90 (····8172)
  AMOUNT        $25.00
  APPLIED       04/12/2008 11:31
  BALANCE       $31.40

Prepaid accounts have no contract and no credit check. Airtime expires 90 days after the last top-up.`,
    source: 'Files · receipts',
    surface: 'files',
    ownerEntityId: 'org.meridian-wireless',
    mentions: ['org.meridian-wireless', 'person.marc-deleon', 'device.nokora-n90'],
    fields: { Account: '····5520', Handset: '····8172', Name: 'DELEON, M' },
    amountCents: 2500,
    factId: 'fact.phone-was-marcs',
  },
  {
    id: 'art.wireless-transfer',
    type: 'record',
    date: '2008-12-29',
    title: 'Change of responsible party — prepaid',
    body: `MERIDIAN WIRELESS
ACCOUNT ····5520 · CHANGE OF RESPONSIBLE PARTY

  EFFECTIVE     29/12/2008
  FROM          DELEON, M
  TO            RASK, O T
  HANDSET       RETAINED BY ACCOUNT (····8172)
  NUMBER        RETAINED
  BALANCE       CARRIED FORWARD

Prepaid transfers require no identification and are completed at the point of sale. The handset,
number and remaining airtime move together unless the outgoing party requests otherwise. No request
was recorded.`,
    source: 'Meridian Wireless · account history',
    surface: 'archive',
    url: 'meridian.archive/wireless/account/5520/transfers',
    ownerEntityId: 'org.meridian-wireless',
    mentions: [
      'org.meridian-wireless',
      'person.marc-deleon',
      'person.owen-rask',
      'device.nokora-n90',
    ],
    fields: {
      From: 'DELEON, M',
      To: 'RASK, O T',
      Effective: '29/12/2008',
      Identification: 'not required',
    },
    factId: 'fact.phone-was-marcs',
  },
  {
    id: 'art.nokora-manual-exif',
    type: 'document',
    date: '2007-06-01',
    title: 'NOKORA N90 — user guide, p.61',
    body: `PHOTOGRAPHS AND INFORMATION STORED WITH THEM

Each photograph your N90 takes is stored with information about how it was taken. This includes the
date and time from the phone clock, the exposure the camera chose, and the serial number of the
camera unit in your handset.

The camera serial is written for service purposes and cannot be switched off from the menu. It stays
with the photograph if you send it, upload it, or copy it to a computer.

If you send photographs to people you do not know, you may prefer to remove this information first
using a program on your computer.

  SETTINGS > PHOTOS > SAVE LOCATION      on / off
  SETTINGS > PHOTOS > SAVE CAMERA INFO   always on`,
    source: 'Files · manuals · nokora_n90_en.pdf',
    surface: 'files',
    ownerEntityId: 'device.nokora-n90',
    mentions: ['device.nokora-n90'],
    fields: { Page: '61', Section: 'Photographs', 'Save camera info': 'always on' },
    factId: 'fact.nokora-writes-serial',
  },
]

// ---------------------------------------------------------------------------
// Two things that are strange, and one that is wrong.
//
// Stefan Orbe is a real job done normally: registered agents exist, they are cheap, and one man
// holding eleven filings is unremarkable to anybody who works in filings. It is only strange from
// where the player is standing, which is the correct kind of strange.
//
// The eye is the one wrong thing. It is the only artifact in this file that has no ordinary reading.
// ---------------------------------------------------------------------------

const filings: ArtifactInput[] = [
  {
    id: 'art.orbe-filing-aion',
    type: 'record',
    date: '2008-12-11',
    title: 'Articles of Organization — AION GROUP LLC',
    body: `OREGON BUSINESS REGISTRY
ARTICLES OF ORGANIZATION · DOMESTIC LIMITED LIABILITY COMPANY

  ENTITY NAME            AION GROUP LLC
  REGISTRY NUMBER        1188241-94
  TYPE                   DOMESTIC LIMITED LIABILITY COMPANY
  ENTITY STATUS          ACTIVE
  REGISTRY DATE          11-12-2008
  NEXT RENEWAL           11-12-2009

  REGISTERED AGENT       ORBE, STEFAN
  AGENT ADDRESS          1140 SE MORRISON ST, PORTLAND OR 97214

  PRINCIPAL PLACE        1140 SE MORRISON ST, PORTLAND OR 97214
  MAILING ADDRESS        1140 SE MORRISON ST, PORTLAND OR 97214

  MEMBER                 NONE LISTED

Filed by mail. Fee paid $100.00.`,
    source: 'Oregon Business Registry · entity search',
    surface: 'archive',
    url: 'registry.archive/oregon/entity/1188241-94',
    ownerEntityId: 'org.aion-group',
    mentions: [
      'org.aion-group',
      'person.stefan-orbe',
      'place.1140-se-morrison',
      'org.meridian-savings',
    ],
    fields: {
      Registry: '1188241-94',
      Agent: 'ORBE, STEFAN',
      Registered: '11-12-2008',
      Members: 'none listed',
    },
    amountCents: 10000,
    factId: 'fact.orbe-agent-of-record',
    reliability: 'deceptive',
    contradicts: ['art.morrison-directory'],
  },
  {
    id: 'art.orbe-agent-list',
    type: 'record',
    date: '2009-01-06',
    title: 'Registry search — agent: ORBE, STEFAN',
    body: `OREGON BUSINESS REGISTRY · SEARCH BY REGISTERED AGENT
11 results

  AION GROUP LLC                     ACTIVE     11-12-2008
  ASHLAND CROSS HOLDINGS LLC         ACTIVE     04-09-2008
  CANNERY ROW PROPERTIES LLC         INACTIVE   17-02-2006
  FOURTH & GLISAN LLC                ACTIVE     22-05-2007
  HARROW POINT LLC                   ACTIVE     30-10-2008
  KEELSON PARTNERS LLC               ACTIVE     14-11-2008
  LOWER DECK VENTURES LLC            INACTIVE   09-01-2006
  MERIDIAN COURT LLC                 ACTIVE     03-03-2007
  SADDLE BUTTE LLC                   ACTIVE     19-08-2008
  TERMINUS FOUR LLC                  ACTIVE     28-11-2008
  WESTBROOK CIVIC LLC                ACTIVE     12-06-2007

Registered agents accept service of process on behalf of a business. An agent is not an owner,
officer or member, and the registry holds no information about who instructed them.`,
    source: 'Oregon Business Registry · agent search',
    surface: 'archive',
    url: 'registry.archive/oregon/agent/orbe-stefan',
    ownerEntityId: 'person.stefan-orbe',
    mentions: ['person.stefan-orbe', 'org.aion-group'],
    fields: { Results: '11', Active: '9', 'Since 2008': '5' },
    factId: 'fact.orbe-agent-of-record',
  },
  {
    id: 'art.orbe-thread',
    type: 'forumPost',
    date: '2009-01-09T02:14',
    title: 'anyone know anything about registered agents in OR',
    body: `not a legal question exactly.

if you pull an agent search on a name and it comes back with eleven LLCs, five of them registered in
the back half of 2008, all with the agent address and the principal address the same, what is that.

i know the boring answer is "its a guy who does filings for people, thats his job, thats what an
agent is". im asking if theres a way to tell the boring answer from the other one without money.

three of them share a street address with a bank branch. thats probably also boring.

no replies needed if the answer is just "no".`,
    source: 'nullcache.org · thread 3341',
    surface: 'web',
    url: 'nullcache.org/thread/3341',
    ownerEntityId: null,
    mentions: ['person.stefan-orbe', 'org.aion-group', 'place.1140-se-morrison'],
    fields: { Thread: '3341', Replies: '0', Board: 'nullcache.org' },
    factId: 'fact.orbe-agent-of-record',
  },
  {
    id: 'art.archive-2001-ring',
    type: 'webPage',
    date: '2001-04-17',
    title: 'The Quiet Line — members',
    body: `                    T H E   Q U I E T   L I N E

               a webring for people who are listening

  [ prev ]  [ random ]  [ next ]  [ list all ]

  This ring has 9 sites. Membership is by invitation. If you have found
  this page and you were not invited, that is fine, you may read.

  We do not have a mailing list. We do not have a chat room. If you have
  something to say, say it on your own page and the ring will find it.

                        ( ring graphic )
              img.blackbird-hosting.net/aion_eye_01.gif

  Last updated 17 April 2001 · you are visitor 000212
  Best viewed 800x600`,
    source: 'Way Up Machine · geohost.com/Terminal/1104 · captured 17/04/2001',
    surface: 'archive',
    url: 'wayup.archive/2001/geohost.com/Terminal/1104',
    ownerEntityId: 'domain.geohost',
    mentions: ['domain.geohost', 'domain.blackbird', 'org.blackbird-hosting', 'org.aion-group'],
    fields: {
      Captured: '17/04/2001',
      Graphic: 'aion_eye_01.gif',
      Host: 'img.blackbird-hosting.net',
      Members: '9',
    },
    factId: 'fact.eye-predates-aion',
  },
  {
    id: 'art.blackbird-whois',
    type: 'record',
    date: '2009-01-12',
    title: 'Namewell — blackbird-hosting.net',
    body: `NAMEWELL WHOIS

  DOMAIN            blackbird-hosting.net
  CREATED           02-feb-1998
  UPDATED           02-feb-2008
  EXPIRES           02-feb-2018

  REGISTRANT        BLACKBIRD HOSTING CO
  ADDRESS           PO BOX 1140, PORTLAND OR
  EMAIL             (withheld)
  PHONE             (withheld)

  NAME SERVERS      ns1.blackbird-hosting.net
                    ns2.blackbird-hosting.net

  STATUS            clientTransferProhibited

Registered for twenty years in one payment. Renewed once, in 2008, for another ten.`,
    source: 'namewell.com/whois',
    surface: 'web',
    ownerEntityId: 'domain.blackbird',
    mentions: ['domain.blackbird', 'org.blackbird-hosting'],
    fields: {
      Created: '02-feb-1998',
      Expires: '02-feb-2018',
      Registrant: 'BLACKBIRD HOSTING CO',
      'PO Box': '1140',
    },
    factId: 'fact.eye-predates-aion',
  },
  {
    id: 'art.nullcache-eye-thread',
    type: 'forumPost',
    date: '2009-01-11T03:52',
    title: 'same gif on nine pages that have nothing to do with each other',
    body: `a model railroad page. a wedding page. two dead band pages. a page about a lighthouse. a page
that is one paragraph about a dog that died in 2002.

all nine load the same 4kb gif from img.blackbird-hosting.net. the file is called aion_eye_03.gif.

i went looking for 01 and 02 and 01 is still there. it is the same image at a different size and the
last-modified header on it says 1999.

i dont have a theory. i have a directory listing that shouldnt be readable and nine people who have
never met.

edit: 02 is a 404 but the referrer logs on my own page have been getting hits for it since november.`,
    source: 'nullcache.org · thread 3327',
    surface: 'web',
    url: 'nullcache.org/thread/3327',
    ownerEntityId: null,
    mentions: [
      'domain.blackbird',
      'org.blackbird-hosting',
      'domain.geohost',
      'org.aion-group',
      'person.don-ackerley',
      'person.karen-mabry',
    ],
    fields: {
      Thread: '3327',
      Replies: '1',
      Files: 'aion_eye_01.gif, aion_eye_03.gif',
      'Last-Modified': '1999',
    },
    factId: 'fact.eye-predates-aion',
  },
]

// ---------------------------------------------------------------------------
// The economy, which in January 2009 is a character.
//
// Twenty pages in a hundred. Nothing here is a clue. It is the pressure everybody in the world is
// under, and it is the reason a person who would not normally do a thing does it.
// ---------------------------------------------------------------------------

const economy: ArtifactInput[] = [
  {
    id: 'art.gwen-classified-cabinets',
    type: 'classified',
    date: '2009-01-04',
    title: 'Four-drawer filing cabinets (6), office that closed in December',
    body: `Six legal-size four-drawer cabinets, beige, keys for four of them. Also two desks, a
conference table that comes apart, and a coat rack.

The office closed on the 19th. I was the office manager and I have been told to clear it by the end
of the month, so everything goes, and I would rather it went to people than to a dumpster.

$40 each or $200 for all six. You will need a truck and a friend. The elevator works.

Buyer collects, SE, weekday evenings.`,
    source: 'TradePost · Office & Business',
    surface: 'web',
    url: 'tradepost.com/pdx/office/121455',
    ownerEntityId: 'person.gwen-sorrel',
    mentions: ['person.gwen-sorrel', 'org.tradepost'],
    fields: { Price: '$40 each / $200 all', Contact: '503-555-0129', Location: 'Portland, SE' },
    amountCents: 20000,
    factId: 'fact.gwen-office-closed',
  },
  {
    id: 'art.gwen-post-closed',
    type: 'forumPost',
    date: '2008-12-22T21:09',
    title: 'they closed us on a friday',
    body: `Nine of us. Friday the 19th, 4pm, a man none of us had met read from a piece of paper for
about ninety seconds and then stood by the door while we got our coats.

I have been the office manager for six years. I found out the lease had been ended in November. I
was signing for deliveries in December into an office that had already been given up.

Nobody has been unkind to me. That is somehow the part I keep going back over. Everybody was very
polite and the whole thing was decided somewhere else a month before anybody told me.

Anyway. If somebody needs a filing cabinet, I have six.`,
    source: 'Cluster · Portland',
    surface: 'web',
    url: 'cluster.com/pdx/they-closed-us-on-a-friday',
    ownerEntityId: 'person.gwen-sorrel',
    mentions: ['person.gwen-sorrel'],
    fields: { Author: 'gsorrel', Comments: '14' },
    factId: 'fact.gwen-office-closed',
  },
  {
    id: 'art.gwen-lease-notice',
    type: 'record',
    date: '2008-11-14',
    title: 'Notice of lease termination — suite 300',
    body: `NOTICE OF TERMINATION OF TENANCY

  PREMISES     1140 SE MORRISON ST, SUITE 300, PORTLAND OR
  TENANT       (redacted at request)
  EFFECTIVE    31 DECEMBER 2008
  REASON       MUTUAL AGREEMENT, EARLY SURRENDER

Landlord acknowledges surrender of the premises as of the effective date. Tenant shall remove all
personal property. Fixtures remain. Deposit applied against outstanding rent, no balance due either
party.

Executed 14 November 2008.`,
    source: 'Multnomah County · recorded documents',
    surface: 'archive',
    url: 'county.archive/multnomah/recorded/2008-11-14/morrison-suite-300',
    ownerEntityId: null,
    mentions: ['place.1140-se-morrison', 'person.gwen-sorrel'],
    fields: { Suite: '300', Effective: '31 December 2008', Executed: '14 November 2008' },
    factId: 'fact.gwen-office-closed',
  },
  {
    id: 'art.morrison-vacancy-listing',
    type: 'classified',
    date: '2009-01-08',
    title: 'Office space available — 1140 SE Morrison',
    body: `THREE FLOORS AVAILABLE · WILL DIVIDE

Ground floor occupied by an established financial tenant on a long lease. Floors two, three and four
available immediately, 3,100 sq ft each, open plan, original windows.

Building has a lobby directory, a freight elevator and a mail room. Signage rights negotiable.

Rents have moved. Bring us a number.

Broker: 503-555-0184`,
    source: 'TradePost · Commercial',
    surface: 'web',
    url: 'tradepost.com/pdx/commercial/121702',
    ownerEntityId: null,
    mentions: ['place.1140-se-morrison', 'org.meridian-savings', 'org.tradepost'],
    fields: { Floors: '2, 3, 4', 'Sq ft': '3,100 each', Ground: 'occupied, long lease' },
    factId: 'fact.morrison-vacancy',
  },
  {
    id: 'art.morrison-directory',
    type: 'record',
    date: '2009-01-10',
    title: 'Lobby directory — 1140 SE Morrison',
    body: `1140 SE MORRISON

  100   MERIDIAN SAVINGS & LOAN
  200   —
  300   —
  400   —

  MAIL ROOM, LOWER LEVEL, 24 HOUR ACCESS
  DELIVERIES TO REAR

Plastic letters on a felt board. Three of the four slots are empty and the felt behind them is
darker than the rest.`,
    source: 'Files · photographed, lobby board',
    surface: 'files',
    ownerEntityId: null,
    mentions: ['place.1140-se-morrison', 'org.meridian-savings', 'org.aion-group'],
    fields: { Occupied: '1 of 4', 'Mail room': '24 hour access' },
    factId: 'fact.morrison-vacancy',
  },
  {
    id: 'art.arcadia-pass-email',
    type: 'email',
    date: '2008-11-21T17:55',
    title: 'Re: Following up',
    body: `Lea,

Thanks for coming in, and apologies for the delay coming back to you — it has been a strange autumn
here as you can imagine.

We're going to pass. I want to be straightforward with you about why, because I don't think the
usual language helps anybody: it isn't the product and it isn't you. We have moved our own timeline
out by a year and we are not writing first cheques into anything right now. We wrote two in the
whole of 2008 and both were follow-ons.

If you raise again in twelve months, come back. I mean that as more than a courtesy.

Best,
David
Arcadia Ventures`,
    source: 'Mail · from Arcadia Ventures',
    surface: 'mail',
    ownerEntityId: 'org.arcadia-ventures',
    mentions: ['org.arcadia-ventures', 'person.lea-voss'],
    fields: { From: 'Arcadia Ventures', Decision: 'pass', Cheques2008: '2, both follow-on' },
    factId: 'fact.arcadia-passed',
  },
  {
    id: 'art.lea-runway-post',
    type: 'forumPost',
    date: '2008-11-30T23:40',
    title: 'counting months',
    body: `eleven meetings since september. one pass that was kind about it, nine that were slow, one
that never answered at all.

i have money until march if i stop paying myself in february, which i will.

the thing that gets me is that the product works. people use it. thats supposed to be the hard part
and its the part i finished.

not looking for advice. just wanted it written somewhere that isnt my own notebook.`,
    source: 'Cluster · leavoss',
    surface: 'web',
    url: 'cluster.com/leavoss/counting-months',
    ownerEntityId: 'person.lea-voss',
    mentions: ['person.lea-voss', 'org.arcadia-ventures'],
    fields: { Author: 'leavoss', Comments: '6' },
    factId: 'fact.arcadia-passed',
  },
  {
    id: 'art.storage-auction-article',
    type: 'webPage',
    date: '2009-01-06',
    title: 'Storage auctions double as households downsize',
    body: `The number of storage units sold at auction in the Portland metro area roughly doubled in
the last three months of 2008, according to figures compiled from three of the region's largest
operators.

Units go to auction when rent has gone unpaid for a set period, usually ninety days. Buyers bid on
the contents without a detailed inspection — the door is raised, the bidders look, the door comes
down.

"You are mostly buying furniture and boxes," said one regular buyer who asked not to be named
because he resells to dealers. "Once in a while you are buying somebody's whole life. Those are the
ones you don't enjoy."

Operators say the increase reflects households that moved and could not keep up, rather than an
increase in units rented. One large operator reported occupancy down four points year on year.`,
    source: 'columbia-register.com/business/storage-auctions',
    surface: 'web',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register', 'person.nora-kemp'],
    fields: { Section: 'Business', Byline: 'Staff report' },
    factId: 'fact.storage-auctions-up',
  },
  {
    id: 'art.nora-storage-lot',
    type: 'classified',
    date: '2009-01-07',
    title: 'Box of misc auto parts, Beaverton — $15 the lot',
    body: `Bought a storage unit at auction and I am now the owner of a box of car parts I know nothing
about.

There are two belts, a thing with a hose on it, some filters still in boxes, and about thirty small
things in bags. Some of the bags have numbers written on them. I looked up two of the numbers and
they were both Saab, so possibly it is all Saab, but I am guessing.

$15 for the box. I am not going to sort it and I am not going to post photos of each item, sorry.
Beaverton, near the library.`,
    source: 'TradePost · Auto parts',
    surface: 'web',
    url: 'tradepost.com/pdx/parts/121880',
    ownerEntityId: 'person.nora-kemp',
    mentions: ['person.nora-kemp', 'org.tradepost', 'vehicle.saab-900-black'],
    fields: { Price: '$15', Location: 'Beaverton', Origin: 'storage auction' },
    amountCents: 1500,
    factId: 'fact.storage-auctions-up',
  },
  {
    id: 'art.pap-used-parts-post',
    type: 'forumPost',
    date: '2009-01-05T19:20',
    title: 're: is anybody actually buying new parts right now',
    body: `im behind the counter so take this for what its worth.

we sold more used than new in november and again in december. thats never happened here and ive been
here eleven years. it isnt close either, its about sixty forty.

people arent fixing less. theyre fixing the same amount and asking me whats the cheapest thing that
will get them through. i had a guy in last week buy a used alternator for a car worth about four
hundred dollars because the car has to start on monday.

we've stopped stocking some new lines entirely. if you need something exotic order it early, im not
going to have it on the shelf like i used to.

--
raycott`,
    source: 'Cascade Import Owners · General',
    surface: 'web',
    url: 'cascadeimports.com/board/9741',
    ownerEntityId: 'handle.raycott',
    mentions: ['handle.raycott', 'person.raymond-cott', 'org.portland-auto-parts'],
    fields: { Author: 'raycott', Split: '60/40 used to new', Replies: '11' },
    factId: 'fact.parts-trade-down',
  },
  {
    id: 'art.pap-hours-sign',
    type: 'webPage',
    date: '2009-01-02',
    title: 'Portland Auto Parts — hours & location',
    body: `PORTLAND AUTO PARTS
3400 SE Powell Blvd · 503-555-0110

  Mon-Fri   7:30 - 6:00
  Saturday  8:00 - 4:00
  Sunday    CLOSED

Machine shop closed Saturdays as of January. We are sorry about this — the volume is not there and
we could not keep the second man on.

Will-call orders held 30 days. Used parts sold as-is, no returns, we will tell you honestly what we
think of them before you buy.`,
    source: 'portlandautoparts.com',
    surface: 'web',
    ownerEntityId: 'org.portland-auto-parts',
    mentions: ['org.portland-auto-parts'],
    fields: { Saturday: '8:00 - 4:00', 'Machine shop': 'closed Saturdays as of January' },
    factId: 'fact.parts-trade-down',
  },
  {
    id: 'art.register-cuts-note',
    type: 'webPage',
    date: '2008-10-19',
    title: 'A note to our readers',
    body: `Beginning next Sunday, The Columbia Register will no longer publish its Sunday magazine.

We have also reduced the size of our newsroom by nineteen positions, which is a fifth of it. Several
of the people who left have written for this paper for longer than most of you have lived in this
city.

We are not going to dress this up. Advertising revenue has fallen for eleven consecutive quarters
and fell again, harder, this autumn. The choices in front of us were bad ones and we made the ones
we thought left a daily newspaper standing in Portland.

Obituaries, public notices and the classified listings continue unchanged. They are, at the moment,
among the healthiest things we publish, which is its own kind of comment.

— The Editor`,
    source: 'columbia-register.com/note-to-readers',
    surface: 'web',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register'],
    fields: { Cut: '19 positions', Quarters: '11 consecutive declines' },
    factId: 'fact.register-cuts',
  },
  {
    id: 'art.register-classified-rates',
    type: 'webPage',
    date: '2009-01-01',
    title: 'Classified & notice rates, 2009',
    body: `THE COLUMBIA REGISTER · RATES EFFECTIVE 1 JANUARY 2009

  Line classified, per line, per day            $2.40
  Line classified, 7 days                       $12.60
  Death notice, up to 12 lines                  no charge
  Obituary, per column inch                     $18.00
  Photograph with obituary                      $25.00
  Public notice, per column inch, statutory     $14.60

Death notices remain free of charge and will continue to. Obituaries are written by the family and
are checked for length only.

Public notices are accepted from any party required by statute to publish one. We do not verify the
underlying facts of a public notice and the fee does not imply that we have.`,
    source: 'columbia-register.com/advertising/rates',
    surface: 'web',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register', 'org.hollis-funeral'],
    fields: { 'Death notice': 'no charge', Obituary: '$18.00 per column inch' },
    amountCents: 1800,
    factId: 'fact.register-cuts',
  },
]

// ---------------------------------------------------------------------------
// Portland, which is mostly not about any of this.
//
// Sixty-five pages in a hundred. A woman selling a kiln, a student whose band broke up, a man who
// has been building the same model railway for eleven years. These are not filler. They are the
// reason the one wrong thing lands, and each of them is written by the person who wrote it.
// ---------------------------------------------------------------------------

const ordinary: ArtifactInput[] = [
  {
    id: 'art.don-layout-page',
    type: 'webPage',
    date: '2008-09-02',
    title: "Don's N Scale Page — The Terminal District",
    body: `WELCOME TO THE TERMINAL DISTRICT

This is my layout. It is 4 feet by 9 feet in the spare room and it represents about a mile and a
half of the Columbia River waterfront as it looked around 1958, which is when I was eleven and used
to walk down there.

It is not finished. It has not been finished since 1998 and I expect it will not be finished, and I
have made my peace with this.

  THE LAYOUT     track plan, benchwork, the wiring under it
  STRUCTURES     the ice house, the two grain elevators, the diner
  ROLLING STOCK  everything I own, with what I paid for it
  THE PROTOTYPE  photographs of the real thing, 1954-1961
  LINKS          other layouts, and the Quiet Line ring

A note on the ice house: three people have now written to tell me the roof pitch is wrong. It is
wrong. I know it is wrong. I built it in 1999 from a photograph taken at the wrong angle and I am
not rebuilding it, it has become the thing I like most.

  you are visitor 004417 · last updated 2 September 2008
  best viewed 800x600`,
    source: 'geohost.com/Terminal/4417',
    surface: 'archive',
    url: 'wayup.archive/2008/geohost.com/Terminal/4417',
    ownerEntityId: 'person.don-ackerley',
    mentions: ['person.don-ackerley', 'domain.geohost'],
    fields: { Visitors: '004417', Updated: '2 September 2008', Scale: 'N' },
    factId: 'fact.don-railway',
  },
  {
    id: 'art.don-rolling-stock',
    type: 'document',
    date: '2008-12-14',
    title: 'Rolling stock inventory — 118 items',
    body: `THE TERMINAL DISTRICT · ROLLING STOCK
Kept since 1998. Prices are what I paid, not what anything is worth.

  LOCOMOTIVES
  GP9, road no. 202, repainted by me              1998   $34.00
  GP9, road no. 207, factory paint                2001   $52.00
  0-6-0 switcher, runs badly in reverse           1999   $41.00
  RS3, bought at the Salem show                   2004   $38.00

  FREIGHT (selected)
  40ft boxcar x 14, mixed roads                          $6-11 ea
  Reefer x 6, three of them the ice house yellow         $9 ea
  Flatcar with the crated load I made from a matchbox    —
  Caboose, wood, kitbashed from two others        2002   —

  118 items in total. My wife asked me once whether I would ever sell any of it and I said no and
  she said she thought so, and that was the whole conversation, and it was thirty years ago.`,
    source: 'geohost.com/Terminal/4417/stock.html',
    surface: 'web',
    ownerEntityId: 'person.don-ackerley',
    mentions: ['person.don-ackerley', 'domain.geohost'],
    fields: { Items: '118', Locomotives: '4', Since: '1998' },
    factId: 'fact.don-railway',
  },
  {
    id: 'art.don-guestbook',
    type: 'webPage',
    date: '2003-05-30',
    title: 'Sign my guestbook!',
    body: `THE TERMINAL DISTRICT GUESTBOOK

  30 May 2003 — Ken, Tacoma
  Nice layout. The grain elevators are very good. Where did you get the corrugated?

  11 Apr 2003 — (no name)
  the roof on the ice house is wrong

  02 Mar 2003 — Marjorie A.
  Don, it's Marjorie from the guild. Very impressed. Show Ruth.

  18 Jan 2003 — wespike
  found this looking for something else. my grandad had one of these in his basement. this is nice.
  sorry for the random message

  04 Dec 2002 — Ken, Tacoma
  Back again. Did you ever get the reverse loop wired?

  [ 4 older entries ]`,
    source: 'geohost.com/Terminal/4417/guestbook.html',
    surface: 'web',
    ownerEntityId: 'person.don-ackerley',
    mentions: ['person.don-ackerley', 'handle.wespike', 'person.wesley-pike', 'domain.geohost'],
    fields: { Entries: '9', 'Last signed': '30 May 2003' },
    factId: 'fact.geohost-guestbooks',
  },
  {
    id: 'art.mabry-wedding-page',
    type: 'webPage',
    date: '2007-09-03',
    title: 'Karen & Doug — August 14, 2007',
    body: `                 K A R E N   &   D O U G
                    August 14th, 2007

  Thank you to everybody who came. It rained in the morning and then
  it stopped at exactly the right moment, which Doug's mother says
  she arranged.

  THE PHOTOS      four pages, be patient, they are large
  THE TOASTS      Uncle Ray's is the long one
  THANK YOUS      we are getting to these, please be patient with us too

  We are going to keep this page up so people can get the photos.
  If the photos do not load please email and I will send them on a CD.

  you are visitor 002210 · best viewed 800x600`,
    source: 'geohost.com/Meadow/2210',
    surface: 'archive',
    url: 'wayup.archive/2007/geohost.com/Meadow/2210',
    ownerEntityId: 'person.karen-mabry',
    mentions: ['person.karen-mabry', 'person.doug-mabry', 'domain.geohost'],
    fields: { Married: '14 August 2007', Visitors: '002210' },
    factId: 'fact.mabry-wedding',
  },
  {
    id: 'art.mabry-thankyous',
    type: 'webPage',
    date: '2007-11-20',
    title: 'Thank yous (we know, we know)',
    body: `We said we were getting to these in September and it is now November.

They went out last week. All of them. If you did not get one, it is because we do not have your
address, not because we forgot you — email us and we will fix it, and we are sorry.

Doug wants it recorded that he wrote forty of them and I wrote sixty, and I want it recorded that
he wrote forty of them over eleven weeks.

That is the last update to this page. It has been a good year and we are going to go and have it
instead of typing about it.`,
    source: 'geohost.com/Meadow/2210/thanks.html',
    surface: 'web',
    ownerEntityId: 'person.karen-mabry',
    mentions: ['person.karen-mabry', 'person.doug-mabry', 'domain.geohost'],
    fields: { Updated: '20 November 2007', Note: 'last update to the page' },
    factId: 'fact.mabry-wedding',
  },
  {
    id: 'art.mabry-guestbook',
    type: 'webPage',
    date: '2003-08-02',
    title: 'Guestbook — 2 entries since 2007',
    body: `  09 Feb 2008 — Aunt Bev
  Karen the photos still work, I have shown them to everyone at church.

  14 Aug 2008 — Doug
  one year. the page is still here. hello future.

  This guestbook is provided free by GeoHost. GeoHost guestbooks were retired to new
  signups in 2003. Existing guestbooks continue to work.`,
    source: 'geohost.com/Meadow/2210/guestbook.html',
    surface: 'web',
    ownerEntityId: 'person.karen-mabry',
    mentions: ['person.karen-mabry', 'person.doug-mabry', 'domain.geohost'],
    fields: { Entries: '2', 'New signups': 'retired 2003' },
    factId: 'fact.geohost-guestbooks',
  },
  {
    id: 'art.doreen-kiln-classified',
    type: 'classified',
    date: '2009-01-03',
    title: 'Electric kiln, 7 cu ft, works perfectly',
    body: `Electric kiln, seven cubic feet, 240v, three-zone controller. I bought it new in
1994 and it has fired maybe four hundred loads and it has never once let me down.

Elements replaced 2006. Comes with the furniture — shelves, posts, a box of cones. I will throw in
the stand and about forty pounds of stoneware clay that I am not going to use.

$400. I know that is cheap. I would rather it went somewhere it will be used than sit in my garage
being a reproach.

You will need help and a proper truck, it is heavier than it looks. Doreen, 503-555-0193, SE
Woodstock. Evenings are best.`,
    source: 'TradePost · Arts & Crafts',
    surface: 'web',
    url: 'tradepost.com/pdx/arts/121390',
    ownerEntityId: 'person.doreen-halloway',
    mentions: ['person.doreen-halloway', 'org.tradepost'],
    fields: { Price: '$400', Contact: '503-555-0193', Bought: '1994' },
    amountCents: 40000,
    factId: 'fact.doreen-selling-kiln',
  },
  {
    id: 'art.doreen-guild-email',
    type: 'email',
    date: '2009-01-03T20:12',
    title: 'Not renewing this year',
    body: `Marjorie,

I am not renewing my membership this year and I wanted to tell you before you saw the list rather
than after.

It is my hands. It has been my hands for about two years and I have been very good at working around
it, and in November I dropped a bowl I had spent a week on, not because it slipped but because my
hand simply stopped, and I sat on the floor of the studio for a while and then I swept it up.

I can still throw small things on a good day. I cannot load a kiln. Loading a kiln is bending and
lifting and putting a shelf down flat with your arms extended and I cannot do the last one at all.

So the kiln is going and the membership is going. I will still come to the second Tuesdays if you
will have me without paying, and I will still judge the show, and I would like to teach the beginners
if there is ever anyone to teach.

Thirty-one years. Thank you for all of it.

Doreen`,
    source: 'Mail · Cascade Ceramics Guild',
    surface: 'mail',
    ownerEntityId: 'person.doreen-halloway',
    mentions: ['person.doreen-halloway', 'org.cascade-ceramics'],
    fields: { To: 'Cascade Ceramics Guild', Member: '31 years' },
    factId: 'fact.doreen-selling-kiln',
  },
  {
    id: 'art.guild-newsletter',
    type: 'webPage',
    date: '2009-01-12',
    title: 'Cascade Ceramics Guild — January newsletter',
    body: `CASCADE CERAMICS GUILD · FOUNDED 1978
January 2009

MEMBERSHIP. We are at 41, down from 58 two years ago. Dues are staying at $30 because raising them
now would be the wrong thing to do in the wrong year.

SECOND TUESDAYS continue at the church hall, 7pm. Bring something you are stuck on. The kiln at the
hall is available to members and the sign-up sheet is on the door.

WITH REGRET we note that Doreen Halloway is not renewing after thirty-one years. Doreen has judged
the spring show every year since 1991 and has agreed to judge it again, which tells you everything
about Doreen. She is selling her kiln; ask her, not me.

FOR SALE OR WANTED. A member is looking for a slab roller. Another has a wheel that needs a home.
Talk to each other, that is what the second Tuesday is for.`,
    source: 'geohost.com/SoHo/1978',
    surface: 'web',
    ownerEntityId: 'org.cascade-ceramics',
    mentions: ['org.cascade-ceramics', 'person.doreen-halloway', 'domain.geohost'],
    fields: { Members: '41', 'Two years ago': '58', Dues: '$30' },
    amountCents: 3000,
    factId: 'fact.cascade-guild-meets',
  },
  {
    id: 'art.guild-meeting-notice',
    type: 'classified',
    date: '2009-01-09',
    title: 'Ceramics guild — second Tuesdays, new members welcome',
    body: `Cascade Ceramics Guild meets the second Tuesday of every month, 7pm, at the church hall on
SE Steele. Thirty years running.

You do not need to be good. You do not need your own equipment. There is a kiln at the hall members
can sign up for and there is nearly always somebody who will show you how to centre.

$30 a year. Come to one first and see.`,
    source: 'TradePost · Community',
    surface: 'web',
    url: 'tradepost.com/pdx/community/121844',
    ownerEntityId: 'org.cascade-ceramics',
    mentions: ['org.cascade-ceramics', 'org.tradepost'],
    fields: { When: 'Second Tuesday, 7pm', Dues: '$30/year' },
    amountCents: 3000,
    factId: 'fact.cascade-guild-meets',
  },
  {
    id: 'art.wesley-band-post',
    type: 'webPage',
    date: '2008-11-16T01:30',
    title: 'so the fenner line is over',
    body: `nate is moving to seattle in january. he told us at practice on thursday, after practice,
in the parking lot, which is the correct place to tell people things like that.

nobody is angry. thats almost the annoying part. we all said the right things and helped him load
his kit and then i drove home and sat in the car outside my building for twenty minutes.

three years. one demo that we recorded ourselves in a basement in gresham over two weekends and that
i still think is good. eleven shows. one of them had ninety people at it and i have thought about
that show probably once a week since.

the demo is going to stay up. its four songs. the third one is the good one.

im not starting another band. im saying that now so that when i start another band in march you can
all tell me.`,
    source: 'geohost.com/SunsetStrip/8802',
    surface: 'web',
    ownerEntityId: 'person.wesley-pike',
    mentions: ['person.wesley-pike', 'org.fenner-line', 'handle.wespike', 'domain.geohost'],
    fields: { Band: 'The Fenner Line', Shows: '11', Demo: '4 songs' },
    factId: 'fact.fenner-line-ended',
  },
  {
    id: 'art.fenner-demo-page',
    type: 'webPage',
    date: '2008-04-22',
    title: 'THE FENNER LINE — demo (2008)',
    body: `THE FENNER LINE

four songs, recorded january and february 2008 in a basement in gresham
on borrowed equipment. mixed by us, which you can hear.

  1. HOLDING PATTERN            3:41
  2. SIX BLOCKS                 2:58
  3. THE FENNER LINE            5:12
  4. NOTHING FOR THE WINTER     4:04

wes - guitar, singing
dana - bass
nate - drums
theo - guitar, the noise on 3

shows are on the shows page. if there are no shows on the shows page
there are no shows.

we have no cds. we had forty and they are gone. if you want one, we
are sorry, and thank you for wanting one.`,
    source: 'geohost.com/SunsetStrip/8802/demo.html',
    surface: 'web',
    ownerEntityId: 'org.fenner-line',
    mentions: ['org.fenner-line', 'person.wesley-pike', 'domain.geohost'],
    fields: { Tracks: '4', Recorded: 'Jan-Feb 2008', CDs: 'all forty gone' },
    factId: 'fact.fenner-line-ended',
  },
  {
    id: 'art.fenner-last-show',
    type: 'classified',
    date: '2008-11-28',
    title: 'THE FENNER LINE — last show, Dec 6',
    body: `The Fenner Line, final show, Saturday December 6th. Doors 8, we are on at 9:30, $5.

Two other bands, both better than us.

This is genuinely the last one, our drummer is moving. Come if you came before. Come if you never
did, that is arguably worse but it is not too late.`,
    source: 'TradePost · Music & Events',
    surface: 'web',
    url: 'tradepost.com/pdx/music/119027',
    ownerEntityId: 'org.fenner-line',
    mentions: ['org.fenner-line', 'person.wesley-pike', 'org.tradepost'],
    fields: { Date: '6 December 2008', Door: '$5' },
    amountCents: 500,
    factId: 'fact.fenner-line-ended',
  },
  {
    id: 'art.wesley-shifts-post',
    type: 'forumPost',
    date: '2009-01-08T23:11',
    title: 'anyone else taking a term off',
    body: `sophomore, PSU. i have four shifts a week at a coffee place and the shifts are the part of
my week i can rely on, which is a sentence i did not expect to write about a coffee place.

tuition went up again. im not dropping out, im asking if anyone has done a term off and what
happened when they came back.

my mother thinks a term off becomes two terms off. i think my mother might be right, which is why im
asking strangers instead of her.`,
    source: 'Cluster · Portland',
    surface: 'web',
    url: 'cluster.com/pdx/anyone-else-taking-a-term-off',
    ownerEntityId: 'person.wesley-pike',
    mentions: ['person.wesley-pike', 'handle.wespike'],
    fields: { Author: 'wespike', Comments: '9' },
    factId: 'fact.wesley-student',
  },
  {
    id: 'art.wesley-selling-amp',
    type: 'classified',
    date: '2009-01-11',
    title: 'Guitar amp, 30w combo, works fine',
    body: `30 watt combo amp, solid state, one 12 inch speaker. Reverb works. There is a dent in the
grille cloth from a thing that happened at a show and I am not going to fix it.

$90 or best offer. It has been good to me. I need the ninety dollars more than I need a second amp.

Portland, near PSU, I can meet you somewhere with a bus stop.`,
    source: 'TradePost · Musical Instruments',
    surface: 'web',
    url: 'tradepost.com/pdx/instruments/122011',
    ownerEntityId: 'person.wesley-pike',
    mentions: ['person.wesley-pike', 'org.tradepost', 'org.fenner-line'],
    fields: { Price: '$90 obo', Location: 'Portland, near PSU' },
    amountCents: 9000,
    factId: 'fact.wesley-student',
  },
]

const ordinaryTwo: ArtifactInput[] = [
  {
    id: 'art.priya-cat-poster',
    type: 'classified',
    date: '2009-01-05',
    title: 'LOST CAT — SE Hawthorne / 30th — grey tabby, one ear',
    body: `MISSING SINCE FRIDAY JANUARY 2ND

Grey tabby, male, neutered, about 12 pounds. His left ear has a notch out of the top of it from
before I had him. He is chipped. He answers to Bhalu but he will not come to you, he will look at you
and then leave, that is just how he is.

He is an indoor cat and he got out through a window I opened for ten minutes. He has never been
outside in four years and he does not know how any of it works.

Please look in your garage, under your porch, in your shed. He will be somewhere enclosed and he will
not make a sound.

Priya, 503-555-0166. Any hour. I mean that.`,
    source: 'TradePost · Lost & Found',
    surface: 'web',
    url: 'tradepost.com/pdx/lostfound/121502',
    ownerEntityId: 'person.priya-raghunathan',
    mentions: ['person.priya-raghunathan', 'org.tradepost'],
    fields: { Missing: '2 January', Contact: '503-555-0166', Chipped: 'yes' },
    factId: 'fact.priya-cat-missing',
  },
  {
    id: 'art.priya-cat-post',
    type: 'forumPost',
    date: '2009-01-13T22:48',
    title: 'day eleven',
    body: `putting this here because i have run out of poles to staple to.

grey tabby, notch in the left ear, missing since the 2nd from around hawthorne and 30th. chipped, so
if anybody takes him to a vet i will know within a day, which is the thing i keep holding onto.

i work at an animal hospital. i have handed the flyer to about two hundred people including every
client we have seen in eleven days. i have called the two shelters every morning. i know exactly what
the odds are for an indoor cat in january and i have decided not to think about them.

if you are out walking, please just look under things.

thank you.`,
    source: 'Cluster · SE Portland',
    surface: 'web',
    url: 'cluster.com/pdx/se/day-eleven',
    ownerEntityId: 'person.priya-raghunathan',
    mentions: ['person.priya-raghunathan'],
    fields: { Day: '11', Comments: '23' },
    factId: 'fact.priya-cat-missing',
  },
  {
    id: 'art.priya-shelter-log',
    type: 'record',
    date: '2009-01-14',
    title: 'Found animal log — no match',
    body: `MULTNOMAH COUNTY · FOUND ANIMAL INTAKE
Week of 12 January

  INTAKE   SPECIES  DESCRIPTION                     FOUND            STATUS
  1140-A   dog      terrier mix, brown, no collar   SE Powell        held
  1141-A   cat      black, female, thin             NE Fremont       held
  1142-A   cat      orange tabby, male, collar       SE Division      claimed
  1143-A   dog      shepherd mix, older              Gresham          held
  1144-A   cat      grey/white, female, chipped      SE Belmont       claimed

No grey tabby male matching described notch. Enquiry logged, caller to be contacted on any intake
matching. Standing enquiries expire after 60 days.`,
    source: 'Multnomah County · animal services',
    surface: 'archive',
    url: 'county.archive/multnomah/animal/intake/2009-01-12',
    ownerEntityId: null,
    mentions: ['person.priya-raghunathan'],
    fields: { Week: '12 January', Match: 'none', 'Enquiry expires': '60 days' },
    factId: 'fact.priya-cat-missing',
  },
  {
    id: 'art.priya-clinic-page',
    type: 'webPage',
    date: '2008-08-01',
    title: 'Hawthorne Animal Hospital — our team',
    body: `OUR TEAM

Dr. Elena Marsh, DVM — practice owner since 1997. Small animal. Will talk to you about your rabbit
for forty-five minutes if you let her.

Dr. Tomás Beckley, DVM — Tuesdays, Thursdays and alternate Saturdays. Surgery.

Priya Raghunathan, CVT — certified veterinary technician. Priya does the bloodwork, the dentals, the
anaesthesia monitoring, and most of the actual holding of frightened animals. She has been with us
six years.

Marguerite — reception. Knows your pet's name and, eventually, yours.

We are a four-person practice and we intend to stay one.`,
    source: 'hawthorneanimal.com/team',
    surface: 'web',
    ownerEntityId: 'person.priya-raghunathan',
    mentions: ['person.priya-raghunathan'],
    fields: { Role: 'Certified veterinary technician', Since: '2002' },
    factId: 'fact.priya-vet-tech',
  },
  {
    id: 'art.priya-cvt-registry',
    type: 'record',
    date: '2008-07-01',
    title: 'Veterinary technician registry — renewal',
    body: `OREGON VETERINARY MEDICAL EXAMINING BOARD
CERTIFIED VETERINARY TECHNICIAN · REGISTRY EXTRACT

  RAGHUNATHAN, PRIYA
  CERTIFICATE      CVT-4471-B
  FIRST ISSUED     2002
  STATUS           ACTIVE, IN GOOD STANDING
  RENEWED          01-07-2008
  EXPIRES          30-06-2010
  CE HOURS         16 of 15 required

  DISCIPLINARY HISTORY   NONE`,
    source: 'Oregon veterinary board · public registry',
    surface: 'archive',
    url: 'board.archive/oregon-vet/cvt-4471-b',
    ownerEntityId: 'person.priya-raghunathan',
    mentions: ['person.priya-raghunathan'],
    fields: { Certificate: 'CVT-4471-B', Status: 'ACTIVE', 'First issued': '2002' },
    factId: 'fact.priya-vet-tech',
  },
  {
    id: 'art.ted-snowboard',
    type: 'classified',
    date: '2009-01-06',
    title: 'Snowboard + bindings, ridden twice, honestly',
    body: `156cm all-mountain board, bought new in 2004, ridden two days. Bindings included, boots are
size 10 and you can have those too if they fit you.

I am not going to tell you it is barely used and then have you turn up and find a wreck. It is
barely used. The base has one scratch. The topsheet is fine. It has been in a closet for four years
because I went twice, decided I preferred sitting in the lodge, and had the honesty to stop.

$120 for everything. Hillsboro. I will meet you in a parking lot on a Saturday.`,
    source: 'TradePost · Sporting Goods',
    surface: 'web',
    url: 'tradepost.com/pdx/sporting/121611',
    ownerEntityId: 'person.ted-bramble',
    mentions: ['person.ted-bramble', 'org.tradepost'],
    fields: { Price: '$120', Length: '156cm', Location: 'Hillsboro' },
    amountCents: 12000,
    factId: 'fact.ted-selling-board',
  },
  {
    id: 'art.ted-repost',
    type: 'classified',
    date: '2009-01-13',
    title: 'REPOST — snowboard, now $90, please',
    body: `Reposting. Nobody wants a snowboard in a recession, I have learned something.

$90. Same board, same two days on it, same closet.

I will also trade for something for a 98 pickup, it needs a wiper linkage and I have the part on
order but I would rather have the money back.`,
    source: 'TradePost · Sporting Goods',
    surface: 'web',
    url: 'tradepost.com/pdx/sporting/122098',
    ownerEntityId: 'person.ted-bramble',
    mentions: ['person.ted-bramble', 'org.tradepost', 'org.portland-auto-parts'],
    fields: { Price: '$90', Repost: 'yes' },
    amountCents: 9000,
    factId: 'fact.ted-selling-board',
  },
  {
    id: 'art.hal-crt',
    type: 'classified',
    date: '2009-01-10',
    title: 'FREE — 27 inch TV, works, heavy',
    body: `27 inch tube television. It works. The picture is good. It has two of the yellow-red-white
inputs on the back and one on the front behind a flap.

It is free because I bought a flat one for Christmas and my wife has given me until Sunday.

It weighs about a hundred and fifteen pounds. I am not exaggerating and I am sixty-eight and I am
not helping you carry it down the steps. Bring somebody young.

Gresham. First person here.`,
    source: 'TradePost · Free Stuff',
    surface: 'web',
    url: 'tradepost.com/pdx/free/121955',
    ownerEntityId: 'person.hal-ottoway',
    mentions: ['person.hal-ottoway', 'org.tradepost'],
    fields: { Price: 'Free', Weight: '~115 lb', Location: 'Gresham' },
    amountCents: 0,
    factId: 'fact.hal-crt',
  },
  {
    id: 'art.hal-crt-taken',
    type: 'classified',
    date: '2009-01-12',
    title: 'TAKEN — 27 inch TV',
    body: `Gone. Two young men with a van, took nine minutes, would not accept twenty dollars.

For the eleven other people who wrote to me: I am sorry, and it went to the first one. There will be
more of these, everybody is buying flat ones.`,
    source: 'TradePost · Free Stuff',
    surface: 'web',
    url: 'tradepost.com/pdx/free/122140',
    ownerEntityId: 'person.hal-ottoway',
    mentions: ['person.hal-ottoway', 'org.tradepost'],
    fields: { Status: 'TAKEN', Enquiries: '12' },
    factId: 'fact.hal-crt',
  },
  {
    id: 'art.meridian-branch-page',
    type: 'webPage',
    date: '2009-01-02',
    title: 'Meridian Savings & Loan — branches & hours',
    body: `MERIDIAN SAVINGS & LOAN
Serving Portland since 1961 · Member FDIC

  SE MORRISON        1140 SE Morrison St
  Lobby              Mon-Fri 9:00 a.m. - 5:00 p.m.
  ATM                24 hours, vestibule

  NE SANDY           2200 NE Sandy Blvd · Mon-Fri 9:00 - 5:00 · ATM 24 hours
  SW BARBUR          8814 SW Barbur Blvd · Mon-Fri 9:00 - 4:00 · ATM 24 hours
  GRESHAM            404 Main St · Mon-Thu 9:00 - 4:00 · No ATM

The vestibule at SE Morrison is open at all hours and does not require a card for entry. Please be
aware of your surroundings when using any machine after dark.

Telephone banking 1-800-555-9910, 24 hours.`,
    source: 'meridiansavings.com/branches',
    surface: 'web',
    ownerEntityId: 'org.meridian-savings',
    mentions: ['org.meridian-savings', 'place.1140-se-morrison'],
    fields: { Lobby: 'closes 5:00', ATM: '24 hours', Vestibule: 'no card required' },
    factId: 'fact.morrison-branch-hours',
  },
  {
    id: 'art.meridian-atm-notice',
    type: 'record',
    date: '2008-10-15',
    title: 'Vestibule notice — SE Morrison',
    body: `NOTICE TO CUSTOMERS

This vestibule is open 24 hours and is monitored by camera.

Daily ATM withdrawal limit is $500 unless you have arranged otherwise with the branch.

Deposits made after 5:00pm, on a weekend, or on a bank holiday are credited the next business day.

If a machine retains your card, telephone 1-800-555-9910. Do not wait at the machine.

A laminated card taped at eye level beside the door. The tape has gone yellow at the corners.`,
    source: 'Files · photographed, vestibule notice',
    surface: 'files',
    ownerEntityId: 'org.meridian-savings',
    mentions: ['org.meridian-savings', 'place.1140-se-morrison', 'account.meridian-4471'],
    fields: { 'Daily limit': '$500', Monitoring: 'camera', Access: '24 hours' },
    amountCents: 50000,
    factId: 'fact.morrison-branch-hours',
  },
  {
    id: 'art.eileen-service-note',
    type: 'webPage',
    date: '2008-12-01',
    title: 'Meridian — Meet your branch',
    body: `MEET YOUR BRANCH · SE MORRISON

Eileen Vasquez has been at this counter for nine years. Before Meridian she worked at a credit union
in Salem, and before that she taught fourth grade for two years and says the two jobs are more alike
than people think.

"Most of what I do is not banking," she says. "Somebody comes in about a fee and what they actually
want is for a person to look at their account with them for five minutes. That is the job."

Eileen opened 214 accounts last year, more than anybody else in the company, which we mention here
because she will not.

Come and see her. She is in Monday to Friday, and she is at the counter at nine.`,
    source: 'meridiansavings.com/community/meet-your-branch',
    surface: 'web',
    ownerEntityId: 'org.meridian-savings',
    mentions: ['person.eileen-vasquez', 'org.meridian-savings', 'place.1140-se-morrison'],
    fields: { Counter: 'SE Morrison', Years: '9', 'Accounts opened 2008': '214' },
    factId: 'fact.eileen-teller',
  },
  {
    id: 'art.account-opening-slip',
    type: 'record',
    date: '2009-01-06T09:02',
    title: 'New account — teller worksheet',
    body: `MERIDIAN SAVINGS & LOAN · NEW ACCOUNT WORKSHEET
BRANCH: SE MORRISON

  ACCOUNT          CHECKING ····4471
  OPENED           06-01-2009  09:02
  OPENING DEPOSIT  $75.00  CASH
  NAME             RASK, OWEN T
  ADDRESS          (as presented)
  ID PRESENTED     TWO FORMS, SIGHTED
  TELLER           E VASQUEZ

  IN PERSON        YES
  SIGNATURE CARD   ON FILE

Note in the margin, ballpoint: "asked for the ATM card same day — told him 7-10 business days."`,
    source: 'Meridian Savings · branch systems',
    surface: 'archive',
    url: 'meridian.archive/branch/morrison/new-accounts/2009-01-06',
    ownerEntityId: 'org.meridian-savings',
    mentions: [
      'org.meridian-savings',
      'person.eileen-vasquez',
      'person.owen-rask',
      'account.meridian-4471',
      'place.1140-se-morrison',
    ],
    fields: {
      Account: '····4471',
      Opened: '06-01-2009 09:02',
      Teller: 'E VASQUEZ',
      ID: 'two forms',
    },
    amountCents: 7500,
    factId: 'fact.eileen-teller',
  },
  {
    id: 'art.snow-article',
    type: 'webPage',
    date: '2008-12-27',
    title: 'A week the city stopped',
    body: `Portland does not do this. That is what everybody said, standing in the street on the
Sunday, and it is true — the city owns a number of snowplows appropriate to a city that gets snow
once every few years, and last week it got snow every day.

Buses stopped. The airport closed and then opened and then closed. Deliveries did not arrive, which
meant grocery shelves emptied in an order that surprised people: bread first, then milk, then, for
reasons nobody has explained, tortillas.

Two hundred and forty vehicles were towed from snow routes. The city says it will be lenient about
storage fees and has so far been lenient about some of them.

The thaw came Christmas Eve. What it revealed was a lot of broken branches, a number of cars parked
where their owners did not park them, and a city that has quietly agreed never to speak of the
Tuesday when a man skied down Burnside.`,
    source: 'columbia-register.com/city/snow-week',
    surface: 'web',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register'],
    fields: { Towed: '240 vehicles', Thaw: 'Christmas Eve' },
    factId: 'fact.december-snow',
  },
  {
    id: 'art.snow-cluster-thread',
    type: 'forumPost',
    date: '2008-12-21T14:03',
    title: 'road report thread — post what you can see',
    body: `im on 39th. 39th is passable if you have any weight in the back. clinton is not.

people keep asking if the buses are running. the buses are running the way a rumour runs.

if you have a hill between you and where you are going, you do not have a route, you have a plan.

post your street. i will keep a list at the top.

  UPDATED 2pm
  39th - passable with care
  clinton - no
  hawthorne - sanded, ok
  belmont - one lane, both directions, everybody being very polite about it
  ankeny - fine, its flat
  powell - fine
  burnside downtown - fine, and there was a man on skis`,
    source: 'Cluster · Portland',
    surface: 'web',
    url: 'cluster.com/pdx/road-report-thread',
    ownerEntityId: null,
    mentions: ['place.1822-se-39th', 'place.2118-se-ankeny'],
    fields: { Updated: '2pm', Comments: '87' },
    factId: 'fact.december-snow',
  },
  {
    id: 'art.snow-tow-total',
    type: 'record',
    date: '2009-01-05',
    title: 'Snow route removals — season total',
    body: `CITY OF PORTLAND · BUREAU OF TRANSPORTATION
SNOW ROUTE ENFORCEMENT · DECEMBER 2008

  VEHICLES REMOVED                240
  RECOVERED BY OWNER              196
  UNRECOVERED AT 05-01-2009        44
  STORAGE WAIVED (HARDSHIP)        61

Unrecovered vehicles accrue storage at the posted daily rate and become eligible for lien sale after
thirty days. Owners of record are notified by mail to the registered address.

Where a plate could not be fully read at removal, the vehicle is held under a partial-plate record
and the owner is not notified. Fourteen vehicles are currently held on partial plates.`,
    source: 'Columbia Register · public notices',
    surface: 'archive',
    url: 'register.archive/notices/2009-01-05/snow-route-season-total',
    ownerEntityId: null,
    mentions: ['org.columbia-register', 'vehicle.saab-900-black'],
    fields: { Removed: '240', Unrecovered: '44', 'Partial plate, no notice': '14' },
    factId: 'fact.december-snow',
  },
]

const ordinaryThree: ArtifactInput[] = [
  {
    id: 'art.hollis-about',
    type: 'webPage',
    date: '2008-06-11',
    title: 'Hollis & Vane — about our firm',
    body: `HOLLIS & VANE
FUNERAL DIRECTORS · 910 NE FREMONT ST · SINCE 1931

Arthur Hollis and Peter Vane opened this firm in 1931 in a building that is still the front half of
the building we occupy. The third generation runs it now.

We are not part of a group. We have not been bought. When you telephone at three in the morning the
person who answers is one of four people and all four of them live within a mile of here.

  ARRANGEMENTS        what happens, in order, with the costs written down
  OUR PRICE LIST      complete, on one page, as the law requires and as we would anyway
  OBITUARY NOTICES    we will help you write one and we will not charge you for it
  DIRECTIONS

A word about cost. It has been a hard year and people are asking us questions they used to be
embarrassed to ask. Please ask them. A simple cremation with no service is $795 and we will treat you
exactly as we treat everybody else.`,
    source: 'hollisandvane.com',
    surface: 'web',
    ownerEntityId: 'org.hollis-funeral',
    mentions: ['org.hollis-funeral'],
    fields: { Founded: '1931', Generation: 'third', 'Simple cremation': '$795' },
    amountCents: 79500,
    factId: 'fact.hollis-vane-family',
  },
  {
    id: 'art.hollis-notices-page',
    type: 'webPage',
    date: '2009-01-05',
    title: 'Hollis & Vane — recent notices',
    body: `NOTICES IN OUR CARE

  MORAN, Julia B.        4 December 2008        service held
  OKONKWO, Adaeze        11 December 2008       service held
  RASK, Owen T.          19 December 2008       no service at family request
  FERRIS, Alan J.        27 December 2008       service held
  LINDQVIST, Marta       2 January 2009         arrangements pending

Where a family has asked for no service or no notice, we say so and no more.

Notices are placed with The Columbia Register on the family's behalf. The Register does not charge
for a death notice and we do not add anything to the cost of an obituary.`,
    source: 'hollisandvane.com/notices',
    surface: 'web',
    ownerEntityId: 'org.hollis-funeral',
    mentions: [
      'org.hollis-funeral',
      'person.owen-rask',
      'person.julia-moran',
      'person.adaeze-okonkwo',
      'org.columbia-register',
    ],
    fields: { 'Rask, Owen T.': '19 December 2008 · no service at family request' },
    factId: 'fact.hollis-vane-family',
  },
  {
    id: 'art.ray-thermostat-reply',
    type: 'forumPost',
    date: '2006-03-14T20:15',
    title: 're: new guy, 91 900 with 210k on it',
    body: `welcome.

gauge or thermostat: its the thermostat, and its the thermostat about ninety percent of the time when
it reads low and never moves. a bad gauge usually reads wrong in an interesting way, a stuck open
thermostat reads boring and low forever. eleven dollars, half an hour, do it before winter.

parts: come see me. im at the counter at the place on powell, mon to sat. bring the car, dont bring a
part number you got off a forum, i will look it up properly and half the time theres a cheaper number
that fits.

one more thing since youre new. write down what you do to it and when. in four years youll be trying
to remember if you changed that pump and you wont be able to, and youll change it again.

--
raycott`,
    source: 'Cascade Import Owners · Introductions',
    surface: 'web',
    url: 'cascadeimports.com/board/8814/2',
    ownerEntityId: 'handle.raycott',
    mentions: [
      'handle.raycott',
      'person.raymond-cott',
      'handle.saabman81',
      'person.marc-deleon',
      'org.portland-auto-parts',
      'vehicle.saab-900-black',
    ],
    fields: { Author: 'raycott', 'In reply to': 'saabman81' },
    factId: 'fact.ray-answers-everything',
  },
  {
    id: 'art.ray-profile',
    type: 'webPage',
    date: '2009-01-14',
    title: 'Cascade Import Owners — member: raycott',
    body: `  MEMBER          raycott
  REGISTERED      04 February 2002
  POSTS           2,411
  LOCATION        Portland OR
  OCCUPATION      parts counter

  SIGNATURE
  --
  raycott
  ask me before you order it

  RECENT ACTIVITY
  re: is anybody actually buying new parts right now          05 Jan 2009
  re: 900 rear wheel bearing, is it really pressed            02 Jan 2009
  re: what oil in the cold                                    28 Dec 2008
  re: whats this connector (photo)                            27 Dec 2008
  re: parts wanted thread — january                           22 Dec 2008

  2,411 posts and 2,388 of them are replies.`,
    source: 'Cascade Import Owners · member profile',
    surface: 'web',
    url: 'cascadeimports.com/member/raycott',
    ownerEntityId: 'handle.raycott',
    mentions: ['handle.raycott', 'person.raymond-cott', 'org.portland-auto-parts'],
    fields: { Posts: '2,411', Replies: '2,388', Registered: '04 February 2002' },
    factId: 'fact.ray-answers-everything',
  },
  {
    id: 'art.39th-rental-listing',
    type: 'classified',
    date: '2007-08-14',
    title: 'SE 39th — upper unit of duplex, 1 bed',
    body: `Upper unit, one bedroom plus a room the last tenant used as an office, hardwood, gas heat.
Shared driveway. Off-street parking for one car, and there is street parking, but 39th is a snow
route and they do tow.

$690 plus utilities. First, last, and $400 deposit. No smoking, cat considered.

Available September 1. 1822 SE 39th.`,
    source: 'TradePost · Housing',
    surface: 'web',
    url: 'tradepost.com/pdx/housing/72244',
    ownerEntityId: null,
    mentions: ['place.1822-se-39th', 'org.tradepost'],
    fields: { Rent: '$690', Address: '1822 SE 39th Ave', Note: 'snow route, they do tow' },
    amountCents: 69000,
    factId: 'fact.marc-lives-39th',
  },
  {
    id: 'art.39th-directory',
    type: 'record',
    date: '2008-09-01',
    title: 'Corvid Directory — 1822 SE 39th Ave',
    body: `CORVID DIRECTORY · REVERSE ADDRESS

  1822 SE 39TH AVE, PORTLAND OR 97214

  UNIT      LISTED AS                 TELEPHONE
  UPPER     DELEON M                  503-555-0148
  LOWER     (unlisted)                —

Listings are compiled from published telephone directories and public records. A listing may be out
of date. Corvid does not verify occupancy.`,
    source: 'corvid.com/directory',
    surface: 'web',
    url: 'corvid.com/directory/reverse/1822-se-39th-ave',
    ownerEntityId: null,
    mentions: ['place.1822-se-39th', 'person.marc-deleon'],
    fields: { Unit: 'UPPER', Listed: 'DELEON M', Telephone: '503-555-0148' },
    factId: 'fact.marc-lives-39th',
  },
  {
    id: 'art.marc-tradepost-profile',
    type: 'webPage',
    date: '2009-01-04',
    title: 'TradePost — seller: mdeleon',
    body: `  SELLER        mdeleon
  MEMBER SINCE  November 2006
  LOCATION      Portland, SE
  CONTACT       503-555-0148

  ACTIVE LISTINGS
  Saab 900 — parts wanted                          reposted 04 Jan
  Snow tires, 15in, set of four, off a Saab        02 Jan

  CLOSED LISTINGS
  Weight bench                                     Nov 2008, sold
  Two office chairs                                Oct 2008, sold
  Amp and speakers                                 Sep 2008, sold
  Ladder, 24ft extension                           Aug 2008, sold

  FEEDBACK   9 positive, 0 negative
  "showed up when he said he would" · "car was exactly as described" · "fine"`,
    source: 'tradepost.com/seller/mdeleon',
    surface: 'web',
    ownerEntityId: 'person.marc-deleon',
    mentions: [
      'person.marc-deleon',
      'org.tradepost',
      'vehicle.saab-900-black',
      'place.1822-se-39th',
    ],
    fields: { Seller: 'mdeleon', Contact: '503-555-0148', Feedback: '9 positive' },
    factId: 'fact.marc-phone-number',
  },
  {
    id: 'art.corvid-listing-deleon',
    type: 'record',
    date: '2008-11-01',
    title: 'Corvid Directory — DELEON M',
    body: `CORVID DIRECTORY · RESIDENTIAL

  DELEON M
  1822 SE 39TH AVE
  PORTLAND OR 97214
  503-555-0148

  Listed since 2006. Also appears in the 2007 and 2008 printed directories.

  DID YOU MEAN
  DELEON A · Gresham
  DE LEON R · Beaverton
  DELEONE M J · Vancouver WA`,
    source: 'corvid.com/directory',
    surface: 'web',
    url: 'corvid.com/directory/listing/deleon-m',
    ownerEntityId: 'person.marc-deleon',
    mentions: ['person.marc-deleon', 'place.1822-se-39th'],
    fields: { Telephone: '503-555-0148', 'Listed since': '2006' },
    factId: 'fact.marc-phone-number',
    reliability: 'mistaken',
    contradicts: ['art.39th-rental-listing'],
  },
  {
    id: 'art.parts-callback-note',
    type: 'record',
    date: '2008-11-22',
    title: 'Counter callback list — Saturday',
    body: `CALL WHEN IN — SATURDAY

  BRAMBLE       503-555-0157   wiper linkage, pickup, IN
  DELEON        503-555-0148   fuel pump 900, used, IN. also handle surround, IN
  HALLOWAY      503-555-0193   battery grp 24, IN
  MABRY         503-555-0121   filters, NOT IN, tuesday

Ray's handwriting on the back of a parts invoice, pinned to a corkboard behind the counter.
"DELEON" is underlined twice, with "will pick up sat" written beside it.`,
    source: 'Files · photographed, parts counter',
    surface: 'files',
    ownerEntityId: 'org.portland-auto-parts',
    mentions: [
      'org.portland-auto-parts',
      'person.raymond-cott',
      'person.marc-deleon',
      'person.ted-bramble',
      'person.doreen-halloway',
      'person.doug-mabry',
    ],
    fields: { Deleon: '503-555-0148', Note: 'will pick up sat' },
    factId: 'fact.marc-phone-number',
  },
  {
    id: 'art.ankeny-listing',
    type: 'classified',
    date: '2006-05-30',
    title: 'SE Ankeny — studio and one bedroom, small building',
    body: `Eight-unit building on SE Ankeny, built 1926, radiators, original floors, a laundry in the
basement with two machines and a chair somebody left there in about 1990.

Apartment 4 available, one bedroom, second floor, back of the building, quiet. Windows face the
parking area, which is not a view but it is dark at night, which people care about more.

$625. Cat considered. No parking included, but Ankeny is flat and there is always something on the
street.`,
    source: 'TradePost · Housing',
    surface: 'web',
    url: 'tradepost.com/pdx/housing/48119',
    ownerEntityId: null,
    mentions: ['place.2118-se-ankeny', 'org.tradepost'],
    fields: { Rent: '$625', Unit: 'Apartment 4', Built: '1926' },
    amountCents: 62500,
    factId: 'fact.lea-lives-ankeny',
  },
  {
    id: 'art.lea-cluster-profile',
    type: 'webPage',
    date: '2009-01-15',
    title: 'leavoss — all posts',
    body: `  leavoss · Portland, OR · SE Ankeny · joined March 2006
  Building something. Ask me about it in a year.

  ALL POSTS, NEWEST FIRST — 47

  15 Jan   ok now im annoyed                              0 comments
  14 Jan   third night                                    1
  13 Jan   is it normal to photograph a car               4
  09 Jan   nothing, still                                 0
  02 Jan   a year in which the product works              2
  30 Nov   counting months                                6
  21 Nov   eleven meetings                                3
  02 Nov   shipped the thing nobody asked for             1
  [ older ]

  Profile is public. Comments are open. There is no way to see who has read a post
  and I have looked.`,
    source: 'cluster.com/leavoss/posts',
    surface: 'web',
    url: 'cluster.com/leavoss/posts',
    ownerEntityId: 'person.lea-voss',
    mentions: ['person.lea-voss', 'place.2118-se-ankeny', 'vehicle.grey-sedan'],
    fields: { Joined: 'March 2006', Posts: '47', Location: 'SE Ankeny' },
    factId: 'fact.lea-lives-ankeny',
  },
  {
    id: 'art.nokora-forum-serial',
    type: 'forumPost',
    date: '2007-11-30T13:22',
    title: 're: does anyone else s phone put junk in the picture file',
    body: `its not junk, its EXIF, every camera does it. what you are seeing on the N90 specifically is
that it writes the camera body serial as well as the usual date and exposure stuff.

most phones dont do the serial. nokora does it on the N-series because the camera module gets
serviced separately from the handset and they wanted the module traceable.

practical upshot: two photos with the same body serial came off the same physical handset. doesnt
matter who owned it, doesnt matter what number was in it, doesnt matter if it got wiped. same camera.

you can strip it on a computer. you cannot turn it off on the phone, ive looked, its not in the menu
and it isnt in the service menu either.

people upload straight off the phone constantly and have no idea any of this is in there.`,
    source: 'nullcache.org · thread 2904',
    surface: 'web',
    url: 'nullcache.org/thread/2904',
    ownerEntityId: null,
    mentions: ['device.nokora-n90'],
    fields: { Thread: '2904', Replies: '6', Key: 'same serial = same physical handset' },
    factId: 'fact.nokora-writes-serial',
  },
  {
    id: 'art.grey-sedan-note',
    type: 'record',
    date: '2009-01-14T23:10',
    title: 'Note on the back of an envelope',
    body: `grey sedan again
        no front plate
        oregon, starts with 4
        opposite the parking area, engine off, lights off
        11:40 mon
        10:15 tue
        9:50 wed

  not the same as the black one on 39th — different car, wrote that down
  so I stop wondering`,
    source: 'Files · scanned, envelope',
    surface: 'files',
    ownerEntityId: 'person.lea-voss',
    mentions: [
      'vehicle.grey-sedan',
      'person.lea-voss',
      'place.2118-se-ankeny',
      'vehicle.saab-900-black',
    ],
    fields: { Vehicle: 'grey sedan, no front plate', Plate: 'Oregon, begins 4', Nights: '3' },
    factId: null,
  },
  {
    id: 'art.tradepost-about',
    type: 'webPage',
    date: '2008-02-14',
    title: 'TradePost — about',
    body: `TradePost is a classified listing site for the Portland metro area. It is run by two people
and a server in a closet and it will stay that way.

Listing is free. It will remain free. We take no commission and we do not handle payment, which
means we cannot help you if a deal goes wrong — meet in a public place, bring somebody, and do not
wire money to anybody, ever, for any reason.

We do not verify listings. We remove listings that are reported and obviously fraudulent, usually
within a day, sometimes not.

We have 41,000 active listings, which is up about a third on last year, and we have thought about
what that means.`,
    source: 'tradepost.com/about',
    surface: 'web',
    ownerEntityId: 'org.tradepost',
    mentions: ['org.tradepost'],
    fields: { Listings: '41,000 active', 'Year on year': 'up ~33%', Fee: 'none' },
    factId: null,
  },
]

// ---------------------------------------------------------------------------
// The rest of the surfaces.
//
// A world that only exists on the web is a website. These are the same ordinary lives arriving
// through the mail, the message list, the ledger, the camera roll and the terminal — mostly because
// that is where things actually arrive, and partly because a player who has learned to search one
// surface should keep being rewarded for trying another.
// ---------------------------------------------------------------------------

const elsewhere: ArtifactInput[] = [
  {
    id: 'art.msg-ray-pickup',
    type: 'sms',
    date: '2008-11-21T09:14',
    title: 'Message — 503-555-0110',
    body: `Pump is in. Its the used one, its clean, I put it aside with your name on it.

Handle surround came in black not grey, thats all they make now. Say the word and I send it back.

Counter till 4 sat. Ask for Ray.`,
    source: 'Messages · 503-555-0110',
    surface: 'msg',
    ownerEntityId: 'org.portland-auto-parts',
    mentions: [
      'org.portland-auto-parts',
      'person.raymond-cott',
      'person.marc-deleon',
      'vehicle.saab-900-black',
    ],
    fields: { From: '503-555-0110', Received: '21/11/2008 09:14' },
    factId: 'fact.marc-owns-saab',
  },
  {
    id: 'art.msg-wireless-topup',
    type: 'sms',
    date: '2008-12-04T11:32',
    title: 'Message — MERIDIAN',
    body: `MERIDIAN WIRELESS: $25.00 applied to account ending 5520. New balance $31.40. Airtime expires
04/03/2009. Reply BAL any time for your balance. Msg rates may apply.`,
    source: 'Messages · MERIDIAN',
    surface: 'msg',
    ownerEntityId: 'org.meridian-wireless',
    mentions: ['org.meridian-wireless', 'device.nokora-n90', 'person.marc-deleon'],
    fields: { Account: 'ending 5520', Balance: '$31.40', Expires: '04/03/2009' },
    amountCents: 3140,
    factId: 'fact.phone-was-marcs',
  },
  {
    id: 'art.msg-cat-sighting',
    type: 'sms',
    date: '2009-01-11T18:02',
    title: 'Message — 503-555-0188',
    body: `priya theres a grey cat under the porch at 3021. i cant see the ear. it wont come out and i
dont want to scare it further under

im leaving food. come when you can, ill be up`,
    source: 'Messages · 503-555-0188',
    surface: 'msg',
    ownerEntityId: null,
    mentions: ['person.priya-raghunathan'],
    fields: { Received: '11/01/2009 18:02' },
    factId: 'fact.priya-cat-missing',
  },
  {
    id: 'art.msg-guild-reminder',
    type: 'sms',
    date: '2009-01-12T17:00',
    title: 'Message — CASCADE GUILD',
    body: `Reminder: guild meets tomorrow, 2nd Tuesday, 7pm, church hall on Steele. Bring something youre
stuck on. Kiln signup sheet is on the door. -M`,
    source: 'Messages · CASCADE GUILD',
    surface: 'msg',
    ownerEntityId: 'org.cascade-ceramics',
    mentions: ['org.cascade-ceramics'],
    fields: { When: 'Tuesday 7pm' },
    factId: 'fact.cascade-guild-meets',
  },
  {
    id: 'art.msg-mabry-filters',
    type: 'sms',
    date: '2008-11-25T16:41',
    title: 'Message — Doug',
    body: `filters arent in till tuesday. guy said theyve stopped stocking half of what they used to

im going to do your mums car saturday instead. tell her not to drive it in the meantime, its the
heater not the engine, shell be fine, shell just be cold`,
    source: 'Messages · Doug',
    surface: 'msg',
    ownerEntityId: 'person.doug-mabry',
    mentions: ['person.doug-mabry', 'person.karen-mabry', 'org.portland-auto-parts'],
    fields: { From: 'Doug' },
    factId: null,
  },
  {
    id: 'art.mail-guild-reply',
    type: 'email',
    date: '2009-01-04T08:31',
    title: 'Re: Not renewing this year',
    body: `Doreen,

I read your message twice and then I went and made tea and then I read it again.

Of course you will come to the second Tuesdays. Nobody is going to take money from you at the door
after thirty-one years, and if anybody tries I will personally throw them out of a guild I founded.

Judge the spring show. Teach the beginners — we will find you beginners, I will put a notice in the
newsletter and in the classifieds and I will make them sound very appealing.

I am sorry about your hands. I am not going to say anything else about that because you did not ask
me to and because you would hate it.

Tuesday.

Marjorie`,
    source: 'Mail · Cascade Ceramics Guild',
    surface: 'mail',
    ownerEntityId: 'org.cascade-ceramics',
    mentions: ['org.cascade-ceramics', 'person.doreen-halloway'],
    fields: { From: 'Cascade Ceramics Guild', 'In reply to': 'Not renewing this year' },
    factId: 'fact.doreen-selling-kiln',
  },
  {
    id: 'art.mail-pap-newsletter',
    type: 'email',
    date: '2009-01-02T07:00',
    title: 'Portland Auto Parts — January',
    body: `HAPPY NEW YEAR FROM ALL OF US ON POWELL

A few things for January.

THE MACHINE SHOP is now closed Saturdays. We did not want to do this. The Saturday volume has not
been there since the summer and we could not keep the second man on a day that does not pay for him.
Weekday turnaround is unchanged.

USED PARTS. We are carrying more of them and we are being careful about what we take in. If you are
breaking a car, call first, we are choosy now in a way we did not use to be.

WILL-CALL orders are held thirty days. We have a shelf of orders from November that nobody has come
for and we would rather telephone you than restock them.

THE COUNTER is Ray, most days. He would like it said that you can email the counter and that this is
better for everybody than telephoning at four o'clock on a Friday.

3400 SE Powell · 503-555-0110`,
    source: 'Mail · parts@portlandautoparts.com',
    surface: 'mail',
    ownerEntityId: 'org.portland-auto-parts',
    mentions: ['org.portland-auto-parts', 'person.raymond-cott'],
    fields: { 'Machine shop': 'closed Saturdays', 'Will-call': 'held 30 days' },
    factId: 'fact.parts-trade-down',
  },
  {
    id: 'art.mail-register-notice-confirm',
    type: 'email',
    date: '2008-12-20T11:04',
    title: 'Your notice has been received',
    body: `Thank you. We have received a death notice submitted on behalf of the family by Hollis & Vane
Funeral Directors.

  NAME          RASK, OWEN T
  RUNS          Sunday 21 December, daily edition and online
  LENGTH        4 lines
  CHARGE        None. The Columbia Register does not charge for death notices.

An obituary is a longer piece written by the family and is charged by the column inch. If the family
would like to place one later, there is no time limit and we will help with the wording.

Corrections: classifieds@columbia-register.com, or telephone the desk before 4pm.`,
    source: 'Mail · The Columbia Register',
    surface: 'mail',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register', 'org.hollis-funeral', 'person.owen-rask'],
    fields: { Runs: '21 December', Length: '4 lines', Charge: 'none' },
    amountCents: 0,
    factId: 'fact.hollis-vane-family',
  },
  {
    id: 'art.mail-psu-billing',
    type: 'email',
    date: '2009-01-07T06:15',
    title: 'Winter term balance — payment due 20 January',
    body: `A balance of $1,842.00 remains on your student account for winter term. Payment is due
20 January. Registration for spring term will be held if a balance remains after that date.

PAYMENT PLANS. A three-instalment plan is available for a $30 enrolment fee. Applications must be
made before the due date and cannot be applied retroactively.

TUITION for the 2008-09 year increased by 6.8 percent over 2007-08 as approved in June.

EMERGENCY LOANS of up to $500 are available through the office of the dean of students for
students facing an unexpected shortfall. These are loans and they are repayable.

Do not reply to this address.`,
    source: 'Mail · Portland State University',
    surface: 'mail',
    ownerEntityId: null,
    mentions: ['person.wesley-pike'],
    fields: { Balance: '$1,842.00', Due: '20 January', 'Tuition increase': '6.8%' },
    amountCents: 184200,
    factId: 'fact.wesley-student',
  },
  {
    id: 'art.mail-cluster-digest',
    type: 'email',
    date: '2009-01-14T07:00',
    title: 'Cluster — 3 new comments on your posts',
    body: `THREE PEOPLE REPLIED TO YOU

  on "counting months"
  > this is the most honest thing ive read on here in a year. march is further away than it feels
    right now, for what thats worth.

  on "counting months"
  > have you looked at the state loan program. its not much and its slow but its real money.

  on "is it normal to photograph a car"
  > write down the plate every time. even a partial. three partials that agree is worth more than
    one you think you remember.

Reply on the site. Turn these off in settings.`,
    source: 'Mail · Cluster',
    surface: 'mail',
    ownerEntityId: null,
    mentions: ['person.lea-voss', 'vehicle.grey-sedan'],
    fields: { Comments: '3', Posts: '2' },
    factId: 'fact.lea-lives-ankeny',
  },
  {
    id: 'art.mail-tradepost-digest',
    type: 'email',
    date: '2009-01-11T06:00',
    title: 'TradePost — saved search: "saab"',
    body: `NEW THIS WEEK MATCHING "saab"

  Box of misc auto parts, Beaverton — $15 the lot            07 Jan
  Snow tires, 15in, set of four, off a Saab                  02 Jan
  Saab 900 — parts wanted (reposted)                         04 Jan
  '89 900 turbo, not running, for parts or project — $600    09 Jan
  Saab dealer service manuals, 1985-1993, three volumes      10 Jan

Manage your saved searches, or turn this email off, from your account page. We send these once a
week and we will never send them more often than that.`,
    source: 'Mail · TradePost',
    surface: 'mail',
    ownerEntityId: 'org.tradepost',
    mentions: ['org.tradepost', 'vehicle.saab-900-black', 'person.marc-deleon', 'person.nora-kemp'],
    fields: { 'Saved search': 'saab', Matches: '5' },
    factId: null,
  },
  {
    id: 'art.bank-fee-schedule',
    type: 'document',
    date: '2009-01-01',
    title: 'Schedule of fees, effective 1 January 2009',
    body: `MERIDIAN SAVINGS & LOAN
SCHEDULE OF FEES

  Monthly maintenance, checking            $4.00
  Waived with minimum daily balance of     $300.00
  Overdraft, per item                      $32.00
  Maximum overdraft items per day          4
  Returned item                            $32.00
  Stop payment                             $30.00
  ATM, Meridian machines                   No charge
  ATM, other machines                      $2.50
  Statement copy, per statement            $5.00
  Account research, per hour               $25.00
  Early account closure, within 90 days    $25.00

Daily ATM withdrawal limit is $500. Point-of-sale limit is $1,000. Limits may be changed at the
branch on request and identification.

Deposits of cash made in person are available the next business day. Deposits of $5,000 or more may
be held longer at our discretion.`,
    source: 'Bank · account documents',
    surface: 'bank',
    ownerEntityId: 'org.meridian-savings',
    mentions: ['org.meridian-savings', 'account.meridian-4471'],
    fields: { 'ATM daily limit': '$500', Maintenance: '$4.00', Overdraft: '$32.00' },
    amountCents: 400,
    factId: 'fact.morrison-branch-hours',
  },
  {
    id: 'art.bank-hold-notice',
    type: 'record',
    date: '2009-01-12T14:22',
    title: 'Deposit receipt — cash',
    body: `MERIDIAN SAVINGS & LOAN
SE MORRISON BRANCH

  ACCOUNT      CHECKING ····4471
  DATE         12/01/2009  14:22
  DEPOSIT      CASH                    $900.00
  AVAILABLE    NEXT BUSINESS DAY

  TELLER       E VASQUEZ

Cash deposited in person is available the next business day. Deposits of $10,000 or more in cash are
reported as required by law; this deposit is below that threshold and no report is made.

Keep this receipt.`,
    source: 'Bank · deposit receipt',
    surface: 'bank',
    ownerEntityId: 'org.meridian-savings',
    mentions: [
      'org.meridian-savings',
      'account.meridian-4471',
      'person.eileen-vasquez',
      'person.owen-rask',
      'place.1140-se-morrison',
    ],
    fields: { Deposit: '$900.00 CASH', Teller: 'E VASQUEZ', Reported: 'below threshold' },
    amountCents: 90000,
    factId: 'fact.eileen-teller',
  },
  {
    id: 'art.bank-terms',
    type: 'document',
    date: '2009-01-06',
    title: 'Personal checking — terms and conditions',
    body: `MERIDIAN SAVINGS & LOAN · PERSONAL CHECKING
TERMS AND CONDITIONS

1. OPENING. Accounts are opened in person at a branch on presentation of two forms of
identification, at least one bearing a photograph. We keep a record of what was presented. We do not
keep a copy.

2. THE CARD. An ATM card is ordered at opening and posted to the address of record within seven to
ten business days. It cannot be collected at the branch. A card posted to an address of record and
not returned to us is treated as delivered.

3. STATEMENTS are issued monthly to the address of record. If a statement is returned undelivered
twice, the account is flagged and the branch will attempt to contact you.

4. DORMANCY. An account with no customer-initiated activity for twelve months is dormant. Dormant
accounts are reported to the state after the statutory period.

5. DEATH OF AN ACCOUNT HOLDER. On notice of death, the account is frozen pending presentation of
letters or a small-estate affidavit. Notice must be given to us; we do not learn of it otherwise.

Member FDIC.`,
    source: 'Bank · account documents',
    surface: 'bank',
    ownerEntityId: 'org.meridian-savings',
    mentions: ['org.meridian-savings', 'account.meridian-4471', 'person.owen-rask'],
    fields: { Card: '7-10 business days, posted', Opening: 'in person, two forms of ID' },
    factId: null,
  },
  {
    id: 'art.bank-atm-receipt-loose',
    type: 'transaction',
    date: '2009-01-08T19:41',
    title: 'ATM receipt, left in the vestibule bin',
    body: `  MERIDIAN SAVINGS & LOAN
  SE MORRISON  ATM 04

  08/01/09        19:41
  CARD  ************0219

  WITHDRAWAL           $40.00
  FEE                   $0.00
  BALANCE              $61.14

  THANK YOU

Folded once. There are eleven more in the bin and the bin is not emptied often.`,
    source: 'Photos · vestibule',
    surface: 'bank',
    ownerEntityId: null,
    mentions: ['org.meridian-savings', 'place.1140-se-morrison'],
    fields: { Withdrawal: '$40.00', Balance: '$61.14', Machine: 'ATM 04' },
    amountCents: 4000,
    factId: 'fact.morrison-branch-hours',
  },
  {
    id: 'art.photo-icehouse',
    type: 'photo',
    date: '2008-09-01T15:10',
    title: 'icehouse_final.jpg',
    body: `A model ice house photographed at eye level with the camera resting on the layout itself, so
the horizon is where a person standing in the street would see it. Scratch-built from styrene, the
boards scribed one at a time. The roof pitch is visibly too shallow.

Somebody has put a tiny figure on the loading dock, leaning on nothing, doing nothing.`,
    source: 'geohost.com/Terminal/4417/photos',
    surface: 'phone',
    ownerEntityId: 'person.don-ackerley',
    mentions: ['person.don-ackerley', 'domain.geohost'],
    fields: { Scale: 'N (1:160)', Built: '1999', Note: 'roof pitch wrong, kept anyway' },
    factId: 'fact.don-railway',
  },
  {
    id: 'art.photo-kiln',
    type: 'photo',
    date: '2009-01-03T14:55',
    title: 'kiln_for_sale.jpg',
    body: `A seven cubic foot electric kiln in a garage, lid propped open on its counterweight. The
interior brick is stained the colours brick goes after four hundred firings. Shelves stacked against
the wall to the left, posts in a coffee can.

Taped inside the lid is an index card, handwritten, columns of dates and cone numbers going back
years. The most recent line is November.`,
    source: 'TradePost · listing photo',
    surface: 'phone',
    ownerEntityId: 'person.doreen-halloway',
    mentions: ['person.doreen-halloway', 'org.tradepost'],
    fields: { Size: '7 cu ft', Firings: '~400', 'Last logged firing': 'November' },
    factId: 'fact.doreen-selling-kiln',
  },
  {
    id: 'art.photo-last-show',
    type: 'photo',
    date: '2008-12-06T21:48',
    title: 'lastshow.jpg',
    body: `Four people on a low stage under two coloured lights, shot from the floor with a flash that
has caught the drummer and lost everybody else. The room is maybe a third full.

Somebody at the front has both arms up. Somebody else, closer to the camera, is looking at the bar.`,
    source: 'geohost.com/SunsetStrip/8802/photos',
    surface: 'phone',
    ownerEntityId: 'person.wesley-pike',
    mentions: ['person.wesley-pike', 'org.fenner-line', 'domain.geohost'],
    fields: { Show: '6 December 2008', Note: 'last show' },
    factId: 'fact.fenner-line-ended',
  },
  {
    id: 'art.voicemail-shelter',
    type: 'call',
    date: '2009-01-14T09:12',
    title: 'Voicemail — 2 new',
    body: `MESSAGE 1 · 14/01 09:12 · 0:22
"Hi, this is Multnomah County animal services returning your call. We have logged a standing enquiry
for a grey tabby, male, notched left ear. We have nothing matching this morning. We will call you on
any intake that matches. You do not need to keep calling us every day, although I understand why you
are. Take care."

MESSAGE 2 · 14/01 11:40 · 0:09
"Priya it's me, nothing under the porch, it was a possum. Sorry. Call me."`,
    source: 'Phone · Voicemail',
    surface: 'phone',
    ownerEntityId: 'person.priya-raghunathan',
    mentions: ['person.priya-raghunathan'],
    fields: { Messages: '2', 'Standing enquiry': 'logged' },
    factId: 'fact.priya-cat-missing',
  },
  {
    id: 'art.term-whois-aion',
    type: 'record',
    date: '2009-01-13T01:20',
    title: '$ whois aion-group.com',
    body: `$ whois aion-group.com

   Domain Name: AION-GROUP.COM
   Registrar: NAMEWELL INC
   Creation Date: 11-dec-2008
   Updated Date: 11-dec-2008
   Expiration Date: 11-dec-2009

   Registrant Organization: AION GROUP LLC
   Registrant Street: 1140 SE MORRISON ST
   Registrant City: PORTLAND
   Registrant State: OR
   Registrant Email: settlements@aion-group.com

   Admin Name: ORBE, STEFAN
   Admin Email: settlements@aion-group.com

   Name Server: NS1.AION-GROUP.COM
   Name Server: NS2.AION-GROUP.COM

$ dig +short ns1.aion-group.com
$ 

Nameservers are inside the domain they serve and neither one answers. The domain was registered for
one year, which is the shortest term Namewell sells.`,
    source: 'Terminal · whois',
    surface: 'term',
    ownerEntityId: 'domain.aion-group',
    mentions: [
      'domain.aion-group',
      'org.aion-group',
      'person.stefan-orbe',
      'place.1140-se-morrison',
    ],
    fields: {
      Created: '11-dec-2008',
      Term: '1 year',
      Admin: 'ORBE, STEFAN',
      Nameservers: 'do not resolve',
    },
    factId: null,
  },
  {
    id: 'art.term-dig-geohost',
    type: 'record',
    date: '2009-01-13T01:26',
    title: '$ dig geohost.com',
    body: `$ dig +short geohost.com
198.51.100.24

$ dig +short img.blackbird-hosting.net
198.51.100.24

$ 

Same address. GeoHost pages and the ring graphic they load are served from one machine, which is not
strange on its own — a lot of things were parked together in 1998 and never moved.

$ curl -sI img.blackbird-hosting.net/aion_eye_01.gif
HTTP/1.1 200 OK
Content-Type: image/gif
Content-Length: 4102
Last-Modified: Tue, 09 Nov 1999 04:11:52 GMT`,
    source: 'Terminal · dig',
    surface: 'term',
    ownerEntityId: null,
    mentions: ['domain.geohost', 'domain.blackbird', 'org.blackbird-hosting'],
    fields: { 'geohost.com': '198.51.100.24', 'img.blackbird-hosting.net': '198.51.100.24' },
    factId: 'fact.geohost-guestbooks',
  },
  {
    id: 'art.term-grep-manuals',
    type: 'record',
    date: '2009-01-15T02:40',
    title: '$ grep -ri serial manuals/',
    body: `$ grep -ri "serial" manuals/ | head

manuals/nokora_n90_en.txt:61: the serial number of the camera unit in your handset.
manuals/nokora_n90_en.txt:62: The camera serial is written for service purposes and cannot be
manuals/nokora_n90_en.txt:64: with the photograph if you send it, upload it, or copy it to a
manuals/nokora_n90_en.txt:71: SETTINGS > PHOTOS > SAVE CAMERA INFO   always on
manuals/meridian_atm_en.txt:14: machine serial is printed on the receipt footer
manuals/kiln_7cf.txt:3:  serial 94-7711, elements replaced 2006

$ exiftool -Serial photos/*.JPG 2>/dev/null
photos/IMG_0087.JPG : XJ18172
photos/IMG_0098.JPG : XJ18172
photos/IMG_0113.JPG : XJ18172
photos/IMG_0114.JPG : XJ18172`,
    source: 'Terminal · grep',
    surface: 'term',
    ownerEntityId: null,
    mentions: ['device.nokora-n90', 'org.meridian-savings', 'person.doreen-halloway'],
    fields: { Serial: 'XJ18172', Frames: '4 of 4 match' },
    factId: 'fact.nokora-writes-serial',
  },
  {
    id: 'art.term-ls-files',
    type: 'record',
    date: '2009-01-15T02:31',
    title: '$ ls -la',
    body: `$ ls -la

total 184
drwxr-xr-x   contacts.txt          412   14 jan 22:09
drwxr-xr-x   manuals/                    01 dec  2007
drwxr-xr-x   photos/                     15 jan 02:14
-rw-r--r--   receipts/                   04 dec  2008
-rw-r--r--   ticket_3rd_ash.jpg   88104   15 jan 01:52
-rw-r--r--   envelope_scan.jpg    61220   14 jan 23:14
-rw-r--r--   cibles.enc            2048   14 jan 22:14

$ 

Seven entries. Three of them were written after ten o'clock last night.`,
    source: 'Terminal · ls',
    surface: 'term',
    ownerEntityId: null,
    mentions: ['place.sw-3rd-ash-garage', 'person.lea-voss'],
    fields: { Entries: '7', 'Written after 22:00': '3' },
    factId: null,
  },
  {
    id: 'art.files-guild-roster',
    type: 'document',
    date: '2009-01-12',
    title: 'guild_roster_2009.txt',
    body: `CASCADE CERAMICS GUILD — MEMBERS 2009
41 paid. Roster kept by the secretary. Do not circulate outside the guild.

  ABERNATHY, J      2004    paid
  BRUNO, C          1996    paid
  CHAU, M           2007    paid
  DELACROIX, R      1988    paid, life
  HALLOWAY, D       1978    NOT RENEWING — founding-era, judge of the spring show
  IWATA, K          2002    paid
  KEMP, N           2008    paid
  LINDQVIST, A      1999    paid
  MARSH, E          2005    paid
  [ 32 more ]

Note at the bottom in different handwriting: "Doreen is still judging. Do not take her off the list,
just move her to the honorary column, I will explain at the meeting."`,
    source: 'Files · guild_roster_2009.txt',
    surface: 'files',
    ownerEntityId: 'org.cascade-ceramics',
    mentions: ['org.cascade-ceramics', 'person.doreen-halloway', 'person.nora-kemp'],
    fields: { Paid: '41', 'Halloway, D': '1978, not renewing' },
    factId: 'fact.cascade-guild-meets',
  },
  {
    id: 'art.files-parts-receipt',
    type: 'transaction',
    date: '2008-11-22T11:08',
    title: 'receipts/pap_40122.jpg',
    body: `  PORTLAND AUTO PARTS
  3400 SE POWELL BLVD
  503-555-0110

  22/11/08  11:08   REG 1   RAY

  ORD-40122  WILL CALL
  1  FUEL PUMP ASM USED 900 N/T    189.00
  1  HANDLE SURROUND DRV BLK        25.00
                        SUBTOTAL   214.00
                        TAX          0.00
                        TOTAL      214.00
                        CASH       220.00
                        CHANGE       6.00

  USED PARTS SOLD AS IS
  NO RETURNS ON ELECTRICAL
  THANK YOU

Somebody has written "900" on the top edge in pen and circled it.`,
    source: 'Files · receipts',
    surface: 'files',
    ownerEntityId: 'person.marc-deleon',
    mentions: [
      'person.marc-deleon',
      'org.portland-auto-parts',
      'person.raymond-cott',
      'vehicle.saab-900-black',
    ],
    fields: { Order: 'ORD-40122', Total: '$214.00', Paid: 'CASH' },
    amountCents: 21400,
    factId: 'fact.marc-owns-saab',
  },
  {
    id: 'art.m-nullcache-post',
    type: 'forumPost',
    date: '2008-12-30T04:51',
    title: 'if you were given a number with no name attached',
    body: `hypothetical.

somebody gives you a way to reach them that is not a phone number, not an email, not a handle on
anything. one letter. they tell you when to use it and they tell you what happens if you use it
wrong, and the second part is the part they spend the most time on.

is there a name for that arrangement. i assume there is a name for it and that the name is old.

im not in trouble. im asking because ive agreed to it and i would like to know what ive agreed to.`,
    source: 'nullcache.org · thread 3298',
    surface: 'web',
    url: 'nullcache.org/thread/3298',
    ownerEntityId: null,
    mentions: ['person.m'],
    fields: { Thread: '3298', Replies: '2' },
    factId: null,
  },
  {
    id: 'art.files-m-note',
    type: 'document',
    date: '2009-01-13',
    title: 'A card in the back of the contacts file',
    body: `  M

  no number. do not look for one.
  M gets in touch.

  if it has been more than nine days, it is because
  it is supposed to have been more than nine days.

  do not write anything else down about this
  and then, in different ink, underneath:
  wrote it down anyway`,
    source: 'Files · loose card',
    surface: 'files',
    ownerEntityId: null,
    mentions: ['person.m', 'person.owen-rask'],
    fields: { Contact: 'no number', Interval: 'nine days' },
    factId: null,
  },
]

// ---------------------------------------------------------------------------
// January 2009, which is a character in this game.
//
// Twenty pages in a hundred should be economically interesting, and none of them should be a clue.
// This is the pressure everyone in the world is under. It is why a bank opens an account for cash
// without asking twice, why a storage unit gets sold with somebody's life in it, and why a person
// who would not normally do a thing does it.
// ---------------------------------------------------------------------------

const pressure: ArtifactInput[] = [
  {
    id: 'art.foreclosure-notices',
    type: 'record',
    date: '2009-01-13',
    title: 'Public notices — trustee sales',
    body: `THE COLUMBIA REGISTER · PUBLIC NOTICES · 13 JANUARY 2009
NOTICE OF DEFAULT AND ELECTION TO SELL

Fourteen notices in today's column. Each recites the same statutory language, the same reference to
the same body of law, and a different address.

  SE 87TH AVE          sale 14 APR 2009    default since JUN 2008
  NE KILLINGSWORTH      sale 14 APR 2009    default since MAY 2008
  SE FLAVEL ST          sale 21 APR 2009    default since JUL 2008
  N LOMBARD ST          sale 21 APR 2009    default since APR 2008
  [ 10 more ]

The grantor may cure the default at any time prior to five days before the sale by paying the entire
amount then due, together with costs and attorney fees.

Notices are placed by trustees as statute requires. The newspaper is paid by the column inch to
print them and does not verify them.`,
    source: 'Columbia Register · public notices',
    surface: 'archive',
    url: 'register.archive/notices/2009-01-13/trustee-sales',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register'],
    fields: { Notices: '14', Column: 'Trustee sales', Verification: 'none' },
    factId: 'fact.foreclosure-notices-up',
  },
  {
    id: 'art.foreclosure-article',
    type: 'webPage',
    date: '2009-01-11',
    title: 'The longest column in the paper',
    body: `The public notice column of this newspaper carried 214 trustee's sale notices in December. In
December 2007 it carried 71.

The column is set in six point type at the back of the classifieds and almost nobody reads it, which
is a strange thing to say about the most reliable economic indicator this newspaper publishes. It is
also, at $14.60 a column inch, one of the few parts of the paper that is growing.

The staff who set the column have started to recognise the streets. "You see three on one block and
you know something happened to that block," said one. "A plant closed, or a builder went under and
sold twenty of them to the same kind of buyer at the same time."

There is a mechanism in the statute for curing a default up to five days before the sale. A trustee
who has been doing this for nineteen years estimates that fewer than one in ten do.`,
    source: 'columbia-register.com/business/notice-column',
    surface: 'web',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register'],
    fields: { 'Dec 2008': '214 notices', 'Dec 2007': '71 notices', Rate: '$14.60/inch' },
    amountCents: 1460,
    factId: 'fact.foreclosure-notices-up',
  },
  {
    id: 'art.pawn-page',
    type: 'webPage',
    date: '2009-01-09',
    title: 'Powell Loan & Trade — what we are buying',
    body: `WHAT WE ARE BUYING THIS MONTH

  TOOLS            yes, always, especially cordless with two batteries
  INSTRUMENTS      yes
  CAR AUDIO        yes
  GAME CONSOLES    yes, current generation only
  TELEVISIONS      flat only. We cannot sell tube televisions. We are sorry.
  JEWELLERY        NOT AT PRESENT
  GOLD             by weight only, at the counter, with identification

We have stopped taking jewellery. We have four cases of it and it is not moving and we would be
taking your ring knowing we cannot sell it, which is not a thing we want to do.

A loan is thirty days plus a thirty day grace. We would much rather you came back for your things
than that we sold them. Most people do come back. Fewer than last year, but most.

Identification required on every transaction, no exceptions, and we report as required.`,
    source: 'powellloan.com',
    surface: 'web',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { Jewellery: 'not at present', Loan: '30 days + 30 grace', ID: 'required' },
    factId: 'fact.pawn-volume',
  },
  {
    id: 'art.pawn-post',
    type: 'forumPost',
    date: '2009-01-10T20:30',
    title: 're: whats it actually like running a pawn shop right now',
    body: `ill answer honestly because the honest answer isnt what people expect.

buying is easy. buying has never been easier. i could fill this building twice over by friday.

selling is the entire problem. the people who used to buy from me are the people now selling to me.
thats the whole business model gone in about eight months and there is nothing clever i can do
about it.

the other thing nobody asks about. the stuff coming in has changed. it used to be a guy pawning a
drill to get to friday. now its wedding rings and its tools somebody has used for thirty years, and
they explain it to me, and i have to stand there and take it and give them forty dollars.

ive stopped taking jewellery. thats a business decision and its also not.`,
    source: 'Cluster · Portland',
    surface: 'web',
    url: 'cluster.com/pdx/running-a-pawn-shop-right-now',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { Comments: '31' },
    factId: 'fact.pawn-volume',
  },
  {
    id: 'art.gwen-job-post',
    type: 'classified',
    date: '2009-01-13',
    title: 'Office manager, 6 years, available immediately',
    body: `Office manager, six years in my last position, available now.

Payroll for nine, accounts payable and receivable, vendor contracts, the lease, the insurance, the
phone system, the coffee, and every single thing nobody else wanted to learn how to do.

I have done a job where I was the only person who knew where anything was, and I did it well, and I
would like to do it again for somebody who is still going to be there in June.

References from the owner, who I am on good terms with. The company closed in December. That is the
whole story and I am happy to tell it in an interview.

Portland metro. 503-555-0129.`,
    source: 'TradePost · Jobs Wanted',
    surface: 'web',
    url: 'tradepost.com/pdx/jobs/122076',
    ownerEntityId: 'person.gwen-sorrel',
    mentions: ['person.gwen-sorrel', 'org.tradepost'],
    fields: { Experience: '6 years', Available: 'immediately', Contact: '503-555-0129' },
    factId: 'fact.gwen-office-closed',
  },
  {
    id: 'art.arcadia-page',
    type: 'webPage',
    date: '2009-01-02',
    title: 'Arcadia Ventures',
    body: `ARCADIA VENTURES

Early-stage. Pacific Northwest. Two partners, one fund, no associates — if you meet with us you meet
with the people who decide.

  PORTFOLIO      eleven companies, four exited, two closed
  CHEQUE SIZE    $250k - $1.5m
  STAGE          seed and pre-seed

A NOTE ON 2009. We are not writing first cheques at the moment and we do not expect to before the
second half of the year. We would rather say that here than say it to you across a table after you
have spent three weeks preparing.

If you are raising now, we will still meet you, and we will still tell you what we think, and you
should understand that a meeting is not a process.`,
    source: 'arcadiaventures.com',
    surface: 'web',
    ownerEntityId: 'org.arcadia-ventures',
    mentions: ['org.arcadia-ventures'],
    fields: { Portfolio: '11 companies', 'First cheques': 'paused', Partners: '2' },
    factId: 'fact.arcadia-passed',
  },
  {
    id: 'art.morrison-assessment',
    type: 'record',
    date: '2009-01-02',
    title: 'Property record — 1140 SE Morrison St',
    body: `MULTNOMAH COUNTY ASSESSOR · PROPERTY RECORD

  SITUS          1140 SE MORRISON ST, PORTLAND OR 97214
  ACCOUNT        R284119
  USE            COMMERCIAL, MIXED
  BUILT          1926
  FLOORS         4
  SQ FT          12,400

  ASSESSED VALUE
  2006           $1,410,000
  2007           $1,530,000
  2008           $1,545,000
  2009           $1,180,000

  TAXES          PAID IN FULL, 2008
  EXEMPTIONS     NONE

Assessed value fell 23.6 percent for 2009. Appeals must be filed by 31 December of the tax year.
No appeal is recorded.`,
    source: 'Multnomah County · assessor',
    surface: 'archive',
    url: 'county.archive/multnomah/assessor/r284119',
    ownerEntityId: null,
    mentions: ['place.1140-se-morrison', 'org.meridian-savings'],
    fields: { '2008': '$1,545,000', '2009': '$1,180,000', Change: '-23.6%' },
    amountCents: 118000000,
    factId: 'fact.morrison-vacancy',
  },
  {
    id: 'art.register-classified-volume',
    type: 'webPage',
    date: '2009-01-14',
    title: 'Classifieds — this week',
    body: `THE COLUMBIA REGISTER · CLASSIFIEDS

  FOR SALE — HOUSEHOLD              412 listings
  FOR SALE — TOOLS & EQUIPMENT      288
  AUTOMOTIVE — PARTS                204
  JOBS WANTED                       191
  JOBS OFFERED                       46
  HOUSING — FOR RENT                377
  HOUSING — WANTED                   58
  LOST & FOUND                       31
  PUBLIC NOTICES                    see back page

Jobs wanted has now run longer than jobs offered for nineteen consecutive weeks. We set them in the
same point size and we are not going to start doing anything else with that.`,
    source: 'columbia-register.com/classifieds',
    surface: 'web',
    ownerEntityId: 'org.columbia-register',
    mentions: ['org.columbia-register'],
    fields: { 'Jobs wanted': '191', 'Jobs offered': '46', Weeks: '19 consecutive' },
    factId: 'fact.register-cuts',
  },
  {
    id: 'art.storage-lien-notice',
    type: 'record',
    date: '2009-01-08',
    title: 'Notice of lien sale — self storage',
    body: `NOTICE OF PUBLIC SALE OF PERSONAL PROPERTY

Notice is given that the undersigned will sell at public auction the personal property described
below to satisfy a lien for unpaid rent and charges.

  UNIT   LAST KNOWN OCCUPANT   CONTENTS AS OBSERVED FROM THE DOOR
  B-114  (name withheld)       household goods, boxes, a bicycle
  B-207  (name withheld)       tools, automotive parts, boxes marked
  C-018  (name withheld)       furniture, boxes, a piano
  C-141  (name withheld)       boxes only

Sale 24 January, 10am, on site. Cash only. Contents sold as a lot, sight seen from the doorway only.
Occupant may redeem at any time before the sale by paying all sums due.

The operator makes no representation as to the contents of any unit.`,
    source: 'Columbia Register · public notices',
    surface: 'archive',
    url: 'register.archive/notices/2009-01-08/storage-lien-sale',
    ownerEntityId: null,
    mentions: ['org.columbia-register', 'person.nora-kemp'],
    fields: { Units: '4', Sale: '24 January', Terms: 'cash, sight seen from doorway' },
    factId: 'fact.storage-auctions-up',
  },
  {
    id: 'art.pap-second-man',
    type: 'record',
    date: '2008-12-30',
    title: 'Note on the machine shop door',
    body: `MACHINE SHOP
CLOSED SATURDAYS FROM JANUARY

Weekday turnaround is unchanged. Drums and rotors in by ten, out by four, same as always.

Below, on a separate sheet taped up beside it, in different handwriting:

  Dave finished on the 24th after nine years. If you knew him and you
  are in on a weekday, the counter has his number and he would like
  to hear from you. He is not looking for sympathy, he is looking for
  work, and he is very good.`,
    source: 'Files · photographed, machine shop door',
    surface: 'files',
    ownerEntityId: 'org.portland-auto-parts',
    mentions: ['org.portland-auto-parts', 'person.raymond-cott'],
    fields: { 'Machine shop': 'closed Saturdays', Note: 'second man finished 24 December' },
    factId: 'fact.parts-trade-down',
  },
  {
    id: 'art.bus-service-change',
    type: 'webPage',
    date: '2009-01-04',
    title: 'January service change',
    body: `SERVICE CHANGES EFFECTIVE SUNDAY 4 JANUARY

  DISCONTINUED
  Line 88 (Sellwood shuttle) — last day 3 January
  Line 96 (industrial district evening) — last day 3 January

  REDUCED
  Line 14, 15, 20, 71, 75 — evening frequency 20 min to 30 min after 7pm
  Line 4 — Sunday service ends 9pm instead of 11pm

  UNCHANGED
  All weekday peak service

We know what these changes mean for people who depend on the evening trips. We held them as long as
we could. Ridership is up and revenue is down, which is a sentence that should not be possible and
is the situation we are in.

Printed timetables are at the transit centre and at branch libraries, where available.`,
    source: 'Transit · service changes',
    surface: 'web',
    url: 'portlandtransit.org/service-changes/january-2009',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { Discontinued: '2 lines', Reduced: '6 lines', Effective: '4 January' },
    factId: 'fact.bus-cuts',
  },
  {
    id: 'art.bus-cut-post',
    type: 'forumPost',
    date: '2009-01-06T22:14',
    title: 'the 96 is gone and i work nights',
    body: `they cut the 96. that was the evening industrial line. i finish at eleven.

the replacement is a forty minute walk or the 4 which now stops running at nine on sundays so it is
not a replacement, it is a different problem.

i am not angry at the transit people. ridership is up and money is down, ive read the notice, i
understand the arithmetic. im posting because i have looked at this from every angle for two days and
the answer keeps being that i need a car, and the reason i take the bus is that i cannot afford a car.

if anybody is out that way at eleven pm on a weeknight i will pay for gas.`,
    source: 'Cluster · Portland',
    surface: 'web',
    url: 'cluster.com/pdx/the-96-is-gone-and-i-work-nights',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { Line: '96', Comments: '18' },
    factId: 'fact.bus-cuts',
  },
  {
    id: 'art.library-hours-notice',
    type: 'webPage',
    date: '2009-01-05',
    title: 'Branch hours, January',
    body: `BRANCH HOURS EFFECTIVE 5 JANUARY

  Tue-Thu    10:00 - 6:00
  Fri-Sat    10:00 - 5:00
  Sun-Mon    CLOSED

Branches were open Mondays until this month and open until 8pm on Tuesdays and Thursdays until
November. Central Library hours are unchanged.

WHAT HAS NOT CHANGED. Holds, interlibrary loan, the computers, the newspapers, and the room at the
back that anybody may use for any purpose during opening hours without asking.

Computer sessions are one hour with a second hour if nobody is waiting, and there is nearly always
somebody waiting, which was not true two years ago.`,
    source: 'Library · hours & locations',
    surface: 'web',
    url: 'countylibrary.org/hours',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { Closed: 'Sunday, Monday', 'Computer session': '1 hour' },
    factId: 'fact.library-hours',
  },
  {
    id: 'art.library-post',
    type: 'forumPost',
    date: '2009-01-07T13:55',
    title: 'PSA the library computers are full every day now',
    body: `if you need to use a library computer for anything that matters, a form, an application, an
interview thing, go at ten when they open. by eleven there is a list and by two the list is an hour
long.

it was never like this. i have been going for four years to use the scanner.

everyone is applying for jobs. thats what its for now. there is a man who comes in at ten every day
with a folder and sits at station 6 and works through it and leaves at eleven when his hour is up,
and comes back the next day.

theyve also cut mondays. so its the same number of people in five days instead of six.`,
    source: 'Cluster · Portland',
    surface: 'web',
    url: 'cluster.com/pdx/library-computers-are-full-now',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { Comments: '12' },
    factId: 'fact.library-hours',
  },
  {
    id: 'art.don-club-newsletter',
    type: 'webPage',
    date: '2008-11-08',
    title: 'Columbia Division — November bulletin',
    body: `COLUMBIA DIVISION · NOVEMBER

MEETING is the third Saturday at the church hall, 1pm, doors at noon for setup. Bring a module if you
have one, bring a chair if you can, the hall has run out.

LAYOUT TOUR. Six homes on the December tour. Don Ackerley has opened the Terminal District again,
which he has done every year since 2001 and which is always the one people talk about afterwards.
Don asks that you do not touch the ice house.

CLINIC: soldering feeders without melting your ties. Bring your own iron.

FOR SALE at the meeting: an estate lot, N and HO mixed, from a member who died in September. His
family have asked that it go to the division rather than to a dealer, and they have asked for nothing
for it, and we are going to give them something for it anyway.

DUES remain $18. They have been $18 since 1996.`,
    source: 'geohost.com/Depot/1963',
    surface: 'web',
    ownerEntityId: null,
    mentions: ['person.don-ackerley', 'domain.geohost'],
    fields: { Meeting: 'third Saturday', Dues: '$18 since 1996', Tour: '6 homes' },
    amountCents: 1800,
    factId: 'fact.don-railway',
  },
  {
    id: 'art.hollis-price-list',
    type: 'document',
    date: '2008-06-11',
    title: 'General price list',
    body: `HOLLIS & VANE · GENERAL PRICE LIST
Effective 1 June 2008. You may take this list with you.

  Basic services of funeral director and staff        $1,395
  Transfer of remains to funeral home                   $295
  Embalming                                             $595
  Other preparation                                     $195
  Use of facilities, viewing, per day                   $295
  Use of facilities, ceremony                           $395
  Hearse                                                $295
  DIRECT CREMATION, no ceremony, container provided      $795
  IMMEDIATE BURIAL, no ceremony, casket not included     $995
  Forwarding of remains to another funeral home       $1,195

Cremation is available through a third-party crematory and we will tell you which one.

You are not required to buy anything you do not want. You may buy a casket elsewhere and we will
accept it without charge and without comment. The law requires us to say that. We would say it.`,
    source: 'hollisandvane.com/prices',
    surface: 'web',
    ownerEntityId: 'org.hollis-funeral',
    mentions: ['org.hollis-funeral'],
    fields: { 'Direct cremation': '$795', 'Basic services': '$1,395' },
    amountCents: 79500,
    factId: 'fact.hollis-vane-family',
  },
  {
    id: 'art.ray-oil-thread',
    type: 'forumPost',
    date: '2008-12-28T18:40',
    title: 're: what oil in the cold',
    body: `whatever the book says, in the weight the book says, changed when the book says.

i know thats a boring answer. here is the less boring version. in weather like the last two weeks a
thicker oil is not protecting you better, it is taking longer to get to the top of the engine, and
the top of the engine is where the wear happens in the first thirty seconds.

if it has been sitting outside at twenty degrees, start it and let it idle thirty seconds and then
drive it gently for five minutes. do not sit there for ten minutes warming it up, thats not helping
and its washing your bores with fuel.

and for the fourth time this month: no, you cannot mix it with the stuff in the bottle from the
place on 82nd. i dont know whats in it. neither do they.

--
raycott`,
    source: 'Cascade Import Owners · General',
    surface: 'web',
    url: 'cascadeimports.com/board/9655',
    ownerEntityId: 'handle.raycott',
    mentions: ['handle.raycott', 'person.raymond-cott'],
    fields: { Author: 'raycott', Replies: '19' },
    factId: 'fact.ray-answers-everything',
  },
  {
    id: 'art.wesley-shift-swap',
    type: 'classified',
    date: '2009-01-14',
    title: 'Will take your shift — mornings, SE/downtown',
    body: `Barista, two years, will cover any morning shift you do not want, any day, including the 5am
open which I know is why you are reading this.

I can do register, bar, and I can close out a till without the manager. I have my own black shirt.

Not looking for a job, I have one, I am looking for extra shifts. Text is faster than email.

This is not a scam and I am not going to ask you for anything. I am a sophomore and tuition is due
on the twentieth.`,
    source: 'TradePost · Jobs Wanted',
    surface: 'web',
    url: 'tradepost.com/pdx/jobs/122183',
    ownerEntityId: 'person.wesley-pike',
    mentions: ['person.wesley-pike', 'org.tradepost'],
    fields: { Experience: '2 years', Available: 'mornings, any day' },
    factId: 'fact.wesley-student',
  },
]

// ---------------------------------------------------------------------------
// Pages that exist because the sites they are on would have had them.
//
// The links page is the one that matters. The eye chain had three traces and no reason for anybody
// to start pulling on it — a whois and two nullcache threads are things you find after you are
// already suspicious. Don is not suspicious. Don is a retired man explaining, in the friendliest
// possible way, that he was given a graphic in 2001 and told to swap it for a newer one in 2004,
// and he names the file both times. Seven years before the company that the file is named after.
// ---------------------------------------------------------------------------

const later: ArtifactInput[] = [
  {
    id: 'art.don-links-page',
    type: 'webPage',
    date: '2004-08-19',
    title: 'The Terminal District — links',
    body: `LINKS

Other people's layouts, mostly better than mine. If your page has moved, write to me and I will fix
it, I check these about once a year and things move.

  Ken's Tacoma waterfront (N)       the reason I built the grain elevators
  The Cascade Division roster       everything anybody has ever owned, catalogued
  Marjorie's tile and clay page     not trains, but she signed my guestbook first
  Bridges of the lower Columbia     photographs, 1911-1958, an enormous amount of work

THE QUIET LINE

I have been in this ring since 2001. A man wrote to me and said he liked the ice house and would I
join, and I said what is it, and he said it is nine people who are listening, which I did not
understand then and do not now. There is no mailing list and nobody has ever asked me for anything.

You put their graphic on your page and it links to the next one along. Mine was aion_eye_01.gif
until 2004, when a note came round asking everybody to change it to aion_eye_03.gif, which is the
same eye at a better size. I never saw an 02 and I did not ask.

  <img src="http://img.blackbird-hosting.net/aion_eye_03.gif">

If you are reading this because you are in the ring and you cannot remember the address of the
graphic, that is it, and you are welcome.

  back to the front page · last updated 19 August 2004`,
    source: 'geohost.com/Terminal/4417/links.html',
    surface: 'web',
    ownerEntityId: 'person.don-ackerley',
    mentions: [
      'person.don-ackerley',
      'domain.geohost',
      'domain.blackbird',
      'org.blackbird-hosting',
      'org.aion-group',
    ],
    fields: {
      'In the ring since': '2001',
      Graphic: 'aion_eye_01.gif until 2004, then aion_eye_03.gif',
      Host: 'img.blackbird-hosting.net',
      'Saw an 02': 'no',
    },
    factId: 'fact.eye-predates-aion',
  },
  {
    id: 'art.don-prototype-page',
    type: 'webPage',
    date: '2007-03-11',
    title: 'The Terminal District — the prototype',
    body: `THE PROTOTYPE

Photographs of the real waterfront, 1954 to 1961, which is the period I model. Most of these are
mine, taken with my father's camera when I was between eleven and eighteen. A few are from the
historical society and are marked.

  The ice house from the water, 1956          the only good photograph I ever took
  Grain elevator no. 2 under construction     1954, three frames
  The diner at the end of the spur            1958, and it was already closing
  Switching the north lead, winter            1959
  The same view, 1961, everything gone

A word about the last one. I went back with the same camera and stood in the same place four years
later and there was nothing there at all. I did not understand at eighteen why I wanted a photograph
of nothing. I have spent fifty years building the something back, four feet by nine, in the spare
room, and I understand it now.`,
    source: 'geohost.com/Terminal/4417/prototype.html',
    surface: 'web',
    ownerEntityId: 'person.don-ackerley',
    mentions: ['person.don-ackerley', 'domain.geohost'],
    fields: { Period: '1954-1961', Photographs: '31' },
    factId: 'fact.don-railway',
  },
  {
    id: 'art.mabry-photos',
    type: 'webPage',
    date: '2007-09-03',
    title: 'The photos — page 1 of 4',
    body: `THE PHOTOS · PAGE 1 OF 4

These are big. If you are on a modem, be patient, or write to me and I will post you a CD.

  01  getting ready, upstairs at my mother's
  02  Doug and his brother, outside, before
  03  the rain, which lasted forty minutes
  04  it stopping, which Doug's mother arranged
  05  walking in
  06  the vows, from too far back, sorry
  07  the vows, from the right place, my cousin took this one
  08  coming out
  09  everybody outside squinting
  10  the cake, before
  11  the cake, after

  [ page 2 ]  [ page 3 ]  [ page 4 ]  [ back to the front page ]

61 photographs in total and I am not sorry about a single one of them.`,
    source: 'geohost.com/Meadow/2210/photos.html',
    surface: 'web',
    ownerEntityId: 'person.karen-mabry',
    mentions: ['person.karen-mabry', 'person.doug-mabry', 'domain.geohost'],
    fields: { Photographs: '61', Pages: '4' },
    factId: 'fact.mabry-wedding',
  },
  {
    id: 'art.guild-show-page',
    type: 'webPage',
    date: '2009-01-12',
    title: 'The spring show — call for entries',
    body: `CASCADE CERAMICS GUILD · SPRING SHOW
Entries close 14 March. The show hangs 4 April.

  CATEGORIES     functional · sculptural · surface · under two years working
  ENTRY          two pieces per member, $5 the pair, and the $5 goes on the wine
  JUDGING        one judge, one afternoon, written comments for every entry

Doreen Halloway judges again, as she has since 1991. She writes a paragraph on every single piece,
including the ones that are not good, and members have been known to keep them.

THE UNDER TWO YEARS CATEGORY was added in 2003 because beginners kept not entering. Fourteen people
entered it last year and four of them had never shown anything anywhere.

If you are thinking about entering and you are talking yourself out of it, enter.`,
    source: 'geohost.com/SoHo/1978/show.html',
    surface: 'web',
    ownerEntityId: 'org.cascade-ceramics',
    mentions: ['org.cascade-ceramics', 'person.doreen-halloway', 'domain.geohost'],
    fields: { Entries: 'close 14 March', Judge: 'Doreen Halloway, since 1991', Fee: '$5' },
    amountCents: 500,
    factId: 'fact.cascade-guild-meets',
  },
  {
    id: 'art.cascade-board-rules',
    type: 'webPage',
    date: '2006-01-04',
    title: 'Board rules — read before posting',
    body: `CASCADE IMPORT OWNERS · BOARD RULES

1. Say what car you have. Year, model, whether it is a turbo. Half the questions here cannot be
answered without it and we will only ask.

2. Search first. Then post anyway if the search did not answer it — an old thread that nearly
answers a question is not the same as an answer, and we would rather have the duplicate.

3. No selling in the technical forums. There is a classifieds forum. Use it.

4. Be careful giving advice about brakes, fuel and steering. If you are not sure, say you are not
sure. Somebody is going to drive on what you tell them.

5. Nobody here is a dealer and nobody here is paid. Ray works a parts counter and answers about
forty questions a week on his own time, and if he tells you to bring the car in it is because the
part number depends on something you have not mentioned.

6. This board has been running since 2001 on a machine in somebody's spare room. If it is slow, it
is slow. It has never been down for more than a day.`,
    source: 'cascadeimports.com/board/rules',
    surface: 'web',
    ownerEntityId: null,
    mentions: ['person.raymond-cott', 'handle.raycott', 'org.portland-auto-parts'],
    fields: { Running: 'since 2001', Rules: '6' },
    factId: 'fact.ray-answers-everything',
  },
  {
    id: 'art.pap-used-list',
    type: 'webPage',
    date: '2009-01-12',
    title: 'Used parts — what is on the shelf',
    body: `USED PARTS · UPDATED WEEKLY · CALL TO HOLD

We did not used to have this page. We do now, and it is the busiest page on this site.

  ALTERNATORS      14 on the shelf, most common applications
  STARTERS         9
  FUEL PUMPS       6, two of them European
  WINDOW MOTORS    11
  MIRRORS          about thirty, bring the old one
  WHEELS, STEEL    a great many, $15 each
  RADIATORS        4
  ECU / MODULES    ask. We test what we can and we tell you what we could not test.

Everything here came off a car and we will tell you which car and how many miles were on it if we
know. Sold as is. No returns on electrical, which is not us being difficult, it is that we cannot
tell whether it failed on your bench or ours.

If you are breaking a car and it is clean, telephone before you drive out here. We are choosy now.`,
    source: 'portlandautoparts.com/used',
    surface: 'web',
    ownerEntityId: 'org.portland-auto-parts',
    mentions: ['org.portland-auto-parts', 'person.raymond-cott'],
    fields: { Updated: 'weekly', Terms: 'sold as is, no returns on electrical' },
    factId: 'fact.parts-trade-down',
  },
  {
    id: 'art.clinic-hours',
    type: 'webPage',
    date: '2008-08-01',
    title: 'Hawthorne Animal Hospital — hours & emergencies',
    body: `HOURS

  Mon-Fri   8:00 - 6:00
  Saturday  9:00 - 2:00
  Sunday    closed

AFTER HOURS. We are not an emergency hospital. If something is wrong at two in the morning, go to
the emergency hospital on SE Powell — they are open all night, every night, and they are good.

WHAT TO DO FIRST. Telephone us. A great many things that feel like emergencies are not, and a great
many things that do not feel like emergencies are. We would much rather talk to you for four minutes
than have you sit up all night deciding.

COSTS. Ask us what something will cost before we do it. We will tell you, we will not be offended,
and if there is a cheaper way that is nearly as good we will say so. It has been a hard year and we
have had this conversation a great deal and it is not an awkward one for us.`,
    source: 'hawthorneanimal.com/hours',
    surface: 'web',
    ownerEntityId: null,
    mentions: ['person.priya-raghunathan'],
    fields: { Saturday: '9:00 - 2:00', 'After hours': 'not an emergency hospital' },
    factId: 'fact.priya-vet-tech',
  },
  {
    id: 'art.library-computers',
    type: 'webPage',
    date: '2009-01-05',
    title: 'Using the computers',
    body: `COMPUTERS AT THE BRANCHES

Sessions are one hour. A second hour is available if nobody is waiting, and at most branches
somebody is waiting.

  SIGN UP        at the desk, with a library card, or as a guest with any identification
  PRINTING       10 cents a page, black and white, pay at the desk
  SAVING         bring a disk or a USB stick. Nothing you save on the machine survives the session.
  HELP           ask. Staff will help you with a form or an application and will not read it.

APPLYING FOR WORK. Every branch has staff who will sit with you and help with an online
application, a resume, or an email account. You do not need an appointment and you do not need to
explain why. This is the single most requested thing we do.

WHAT WE CANNOT DO. We cannot extend a session when somebody is waiting, however important the thing
is. We are sorry. It is the only fair rule we have found.`,
    source: 'countylibrary.org/computers',
    surface: 'web',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { Session: '1 hour', Printing: '10 cents a page' },
    factId: 'fact.library-hours',
  },
  {
    id: 'art.transit-fares',
    type: 'webPage',
    date: '2009-01-04',
    title: 'Fares, effective 4 January',
    body: `FARES

  Adult, 2 zones            $1.75
  Adult, all zones          $2.05
  Honored citizen           $0.85
  Youth                     $1.35
  Day pass, all zones       $4.75
  Monthly, all zones       $76.00

Fares rose 5 cents in September and are not rising again this year.

TRANSFERS are good for two hours in the direction of travel and are good on any line. Keep it where
you can reach it.

IF YOU CANNOT PAY. Tell the operator. Operators are not required to refuse you and most of them do
not. We would rather you got where you were going.`,
    source: 'portlandtransit.org/fares',
    surface: 'web',
    ownerEntityId: null,
    mentions: ['org.columbia-register'],
    fields: { 'Adult, all zones': '$2.05', Monthly: '$76.00', Transfer: '2 hours' },
    amountCents: 205,
    factId: 'fact.bus-cuts',
  },
  {
    id: 'art.tradepost-safety',
    type: 'webPage',
    date: '2008-09-30',
    title: 'Meeting somebody — please read this',
    body: `WE DO NOT HANDLE MONEY AND WE CANNOT HELP YOU IF A DEAL GOES WRONG

That is not us avoiding responsibility, it is the actual situation, and you should plan around it.

  MEET IN PUBLIC. A car park with people in it. Not a house, not at night, not the first time.
  BRING SOMEBODY. For anything above about a hundred dollars, or anything you are unsure about.
  CASH, IN PERSON, AT THE HANDOVER. Nothing else.
  NEVER WIRE MONEY. Never, to anybody, for any reason, no matter what the reason is.
  NEVER ACCEPT A CHEQUE FOR MORE THAN THE PRICE. This is always a fraud. Always.

If somebody will not meet you in public, will not talk on the telephone, or is in a hurry and wants
you to be in a hurry too, walk away. You will lose a sale. You will not lose anything else.

WE REMOVE listings that are reported and obviously fraudulent, usually within a day, sometimes not.
We are two people. Report things anyway — it works more often than you would think.`,
    source: 'tradepost.com/safety',
    surface: 'web',
    ownerEntityId: 'org.tradepost',
    mentions: ['org.tradepost'],
    fields: { Rule: 'cash, in person, in public', 'Wire money': 'never' },
    factId: null,
  },
]

export const artifacts: ArtifactInput[] = [
  ...saab,
  ...alibi,
  ...phone,
  ...filings,
  ...economy,
  ...ordinary,
  ...ordinaryTwo,
  ...ordinaryThree,
  ...elsewhere,
  ...pressure,
  ...later,
]
