# Claude Design handoff — 2009

> **Superseded by the pivot.** This is the handoff for **2009**, the product this repository used
> to be (see `docs/ARCHIVE_2009.md`). It is no longer the visual source of truth: UNLISTED's
> workstation is NOVA, and its visual language is a separate piece of work still to be done.
>
> What is still worth reading here is the *mechanics* the handoff specified — window behaviour,
> the dock, the phone as an object, the density of a real OS rather than a dashboard. Those
> carried across the cut intact and are still the standard. The palette, the chrome and every
> word of the copy did not.

`2009.dc.html` is the exported prototype from Claude Design. `support.js` is the generic
Claude Design runtime it needs to render (template compiler for `sc-if` / `sc-for` /
`style-hover`); it contains no project content.

These files are **reference only**. They are not built, imported or shipped. The production
implementation lives in `app/`, `components/`, `engine/` and `content/`, and recreates this
prototype's visual output pixel-for-pixel while replacing its internal structure with a real
event-sourced engine.

Where a value in the production CSS looks arbitrary (`23px` menu bar, `11.5px` titlebar text,
`#ecece8` window body), it was taken from this file.
