# Claude Design handoff — visual source of truth

`2009.dc.html` is the exported prototype from Claude Design. `support.js` is the generic
Claude Design runtime it needs to render (template compiler for `sc-if` / `sc-for` /
`style-hover`); it contains no project content.

These files are **reference only**. They are not built, imported or shipped. The production
implementation lives in `app/`, `components/`, `engine/` and `content/`, and recreates this
prototype's visual output pixel-for-pixel while replacing its internal structure with a real
event-sourced engine.

Where a value in the production CSS looks arbitrary (`23px` menu bar, `11.5px` titlebar text,
`#ecece8` window body), it was taken from this file.
