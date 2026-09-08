# Day 01 — Acceptance criteria

Each item maps to an automated test. `E` = `tests/e2e/day01.spec.ts`, `U` = `tests/unit/*`.

## Entry

1. `E` `/` renders `YOU WAKE UP IN 2009.` with a `WAKE UP` button and no game chrome.
2. `E` The landing route ships no game bundle (verified by the absence of the desktop DOM).
3. `E` `WAKE UP` navigates to `/play` and the HALCYON boot console runs.
4. `E` Boot completes and the HALCYON desktop, menu bar and dock appear.
5. `E` Ember Messenger opens by itself with a message from `unknown_`: _"You have 30 days."_
6. `E` `READ_ME.txt` appears on the desktop and opens in Files.

## Apps

7. `E` Corvid Mail, Meridian Savings, Halcyon Browser and the phone overlay all open from the dock.
8. `E` Windows drag, stack by z-order, focus on click, and close.
9. `U` Window positions clamp to the usable viewport and cascade on open.

## The web

7a. `E` The bookmarks bar carries `aion-group.com` from before the player woke up.
7b. `E` The obituary is reachable by links alone — bookmark, section nav, then headline.
7c. `E` Back and forward are a real history stack.
7d. `U` An unknown host renders a period error page that offers the directory.
7e. `U` Every `nav` and `link` on every page resolves to a page that exists, in both variants.
7f. `U` Every page is reachable without typing a URL — no islands.
7g. `U` The address bar forgives `http://`, `www.`, a trailing slash and stray case.

## Icons

7h. `U` No emoji appears in the authored copy or the dock, at any presentation.
7i. `E` Desktop and Files show a drawn icon per file type — document, sealed, folder.

## Investigation

10. `E` Pinning evidence from Mail, Bank and the Browser fills the evidence tray.
11. `U` Pinning the same evidence twice is idempotent.
12. `E` The Investigation Board opens from the tray, evidence is selectable, and a claim asserts.
13. `U` A claim needs its exact evidence set — extra selections are `INSUFFICIENT`.
14. `U` Claim `c4` is always `REFUSED` and lands on the record even when "supported".

## Recall

15. `E` A Recall query returns an authored memory with a confidence label.
16. `U` Each retrieval costs exactly 9 integrity and floors at 24.
17. `U` Below 78 integrity confidence degrades one step; below 52 it becomes `FRACTURED`.
18. `U` An unmatched query returns "No recollection." and never invents an outcome.

## Money

19. `E` Buying the Nokora N90 on TradePost costs $60.00 and shows in the bank ledger.
20. `E` Posting it for resale settles at +$340.00 and the balance reaches $717.82.
21. `U` All balances are integer cents; no float arithmetic reaches the ledger.

## Temporal

22. `U` At `temporalShift >= 2` `columbia-register.com/business` resolves to the altered variant.
23. `E` The Day 01 summary reports that a page changed once the shift threshold is crossed.

## Gate and end

24. `U` `canEndDay` is false until all five beats (`readme, marc, recall, money, claim`) are true.
25. `E` `End day 01` appears in the menu bar only after the fifth beat.
26. `E` Ending the day closes every window, shows the surveillance cliffhanger, then the summary.
27. `E` The summary shows balance, quota, coherence, claims on record and the watcher line.
28. `E` `CONTINUE YOUR TIMELINE` reaches the save/auth/entitlement boundary at `/account`.

## Persistence

29. `U` A `schemaVersion: 0` snapshot migrates forward without loss.
30. `U` Replaying the event log from the initial state reproduces the snapshot byte-for-byte.
31. `E` Reloading mid-day restores the timeline from IndexedDB.

## Dialogue and consequence

34. `U` A choice's reply answers the question that was asked.
35. `U` `advances: false` holds the conversation, leaving the other option open.
36. `U` A choice can set a world flag.
37. `E` "Where were you last night?" is absent until `e6` is pinned, then present.
38. `U` Talking Lea out of her post removes `e9` from the page, making `c5` unprovable.
39. `U` A flag-driven variant outranks a shift-driven one, and is not reported as drift.

## What the day remembers

40. `U` The summary reports deeds, and describes a losing trade as a loss.
41. `U` The unknown mail escalates with `heat`.
42. `U` It counts the characters typed into Notes and never quotes them.
43. `U` It counts the watchlist; adding a name raises heat and removing it does not undo that.

## Sound

44. `U` Muting persists, notifies subscribers, and prevents any AudioContext being constructed.
45. `U` Nothing throws where there is no Web Audio at all.
46. `U` Only startup and the day-end sting run longer than 0.7s.

## Non-negotiables

32. `E` No SaaS shell, sidebar, KPI cards or `Phone / Business / Timeline` nav exists anywhere in
    the playing surface.
33. `U` `engine/` and `content/` import no framework, network or platform module.
