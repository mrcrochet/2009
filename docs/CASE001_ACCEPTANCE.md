# Case 001 — Acceptance criteria

Each item maps to an automated test. `E` = `tests/e2e/*.spec.ts`, `U` = `tests/unit/*`.

## Entry

1. `E` `/` renders `HE NEVER CAME HOME.` with an `OPEN THE CASE` link and no game chrome.
2. `E` The landing route ships no game bundle (verified by the absence of the desktop DOM).
3. `E` `OPEN THE CASE` navigates to `/play` and the NOVA boot console runs.
4. `E` Boot completes and the workstation desktop, menu bar and dock appear.
5. `E` Dispatch opens by itself with a message from an unknown handle about the 22:51 sync.
6. `E` `CASE_24-118.txt` appears on the desktop and opens in Files.

## Applications

7. `E` The dock holds exactly the nine applications this case declares, plus the handset.
8. `E` Relay Mail, Devices, Orbit and the handset overlay all open from the dock.
9. `E` Windows drag, stack by z-order, focus on click, and close.
10. `U` Window positions clamp to the usable viewport and cascade on open.
11. `U` An application the case declares and this build does not have renders as a window that
    says so, rather than crashing the desktop.

## Sources

12. `E` The handset is locked, and opens only with the passcode recovered from the laptop image.
13. `E` A locked handset shows a lock screen — not its thread, its roll or its contacts.
14. `U` Nothing off a locked source is recorded as discovered, on any tab.
15. `E` The forensic recovery offer says the purchase is real and takes no money inside the
    fiction.

## Documents

16. `E` A spreadsheet renders as a table, with grouped figures and the comment left in a cell.
17. `E` A recording has a transport, and its transcript is legible before anything is played.
18. `U` A recording's waveform is derived from its id, so a replay draws what the session drew.
19. `E` A sealed file does not preview what is inside it; the console's key opens it, and it
    becomes a scan.
20. `E` `Space` holds the selected document up over the machine; `Escape` puts it down.
21. `U` Quick Look refuses a document this case does not hold, and a frame off a locked source.
22. `U` No emoji appears in the authored copy or the dock, at any presentation.
23. `E` Desktop and Files show a drawn icon derived from each document's nature.

## The photo viewer

24. `E` The viewer holds nothing until a source is open, then holds every frame off it.
25. `E` The viewer carries the extraction — including that IMG_2214 has no location block.
26. `E` The contact sheet answers the arrow keys, and selection and focus travel together.

## The web

27. `E` Every page is reachable without typing a URL — no islands.
28. `U` Every `nav` and `link` on every page resolves to a page that exists, in every variant.
29. `E` Back and forward are a real history stack.
30. `U` The address bar forgives `http://`, `www.`, a trailing slash and stray case.
31. `E` An address the case never authored still resolves, as a corpus page.
32. `U` An unknown host renders an in-period error page that offers the directory.

## The world

33. `E` One search reaches every surface at once, and its counts say the world is larger than the
    question.
34. `E` Opening a result arrives at the document, not merely at the application that holds it.
35. `E` The Directory holds only what this machine has read, and grows as the inbox is read.
36. `U` Discovery ids are the ids the projection builds — the search can never hold a document
    the player has demonstrably read and deny it.
37. `U` No fact in the corpus rests on a single trace, and the world stays mostly ordinary.

## Investigation

38. `E` Pinning evidence from Mail, Files and the handset fills the evidence tray.
39. `U` Pinning the same evidence twice is idempotent.
40. `E` The Investigation Board opens from the tray, evidence is selectable, and a claim asserts.
41. `U` A claim needs its exact evidence set — extra selections are `INSUFFICIENT`.
42. `U` Claim `c3` is always `REFUSED` and lands on the record even when "supported".
43. `U` The reducer refuses to pin evidence behind a service this investigation was not granted.
44. `U` No sound claim needs evidence behind a paid service.

## The relay

45. `E` The relay is not available until the process has been found and the line opened.
46. `U` Asking costs signal even when nothing useful comes back, and the budget is the case's
    whole allowance.
47. `U` What comes back is an immutable snapshot, rendered as text and never as markup.
48. `U` A kept line carries its provenance and is never selectable for a claim.
49. `U` Every refusal the route can produce has an authored line; none of the server's own
    wording reaches the player.

## Gate and end

50. `U` The report gate is shut until `statement`, `claire` and `claim` have all fired.
51. `E` The gate stays shut until every beat has fired, and its hints name this case's people.
52. `E` Filing the report closes every window, shows the surveillance cliffhanger, then the card.
53. `U` The card reports deeds — what was pinned, filed, opened, written and carried in.
54. `E` `SAVE THIS INVESTIGATION` reaches the save/auth/entitlement boundary at `/account`.

## Persistence

55. `U` Replaying the event log from the initial state reproduces the snapshot exactly.
56. `U` A v13 save migrates forward without losing anything a report would cite.
57. `U` A save written by the product this repository used to be is quarantined, never reshaped.
58. `E` Reloading mid-session restores the investigation from IndexedDB.

## Dialogue and consequence

59. `U` A choice's reply answers the question that was asked.
60. `U` `advances: false` holds the conversation, leaving the other option open.
61. `U` A choice can set a world flag, and a flagged page variant changes at the same address.
62. `E` Telling Vale you are looking changes his firm's site, and the report says you did it.

## Accessibility

63. `U` Opening the board or the report card moves focus in, traps Tab and returns it to the
    opener.
64. `E` `Ctrl+\``, `Ctrl+D`, `Ctrl+E`and`Ctrl+K` reach windows, dock, tray and search.
65. `E` At phone width one window is foregrounded at a time and the dock is a task switcher.
66. `U` `prefers-reduced-motion` reaches the JavaScript: the beats still happen, the waiting does
    not.

## Sound

67. `U` Muting persists, notifies subscribers, and prevents any AudioContext being constructed.
68. `U` Nothing throws where there is no Web Audio at all.
69. `U` No audio file ships; every sound is generated at runtime.

## Non-negotiables

70. `E` No SaaS shell, sidebar, KPI cards or permanent `Cases / Devices / Evidence` navigation
    exists anywhere in the playing surface.
71. `U` `engine/` and `content/` import no framework, network or platform module.
72. `U` No route, component or authored line carries a token from the product this repository
    used to be.
