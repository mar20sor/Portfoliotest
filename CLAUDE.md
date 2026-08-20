# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A hand-written, dependency-free portfolio site (`site/`) for Marvin Sorhaindo, a
product designer. Plain HTML/CSS/JS, no framework, no build step, no
`package.json`. English-only (French support was removed — see below). The
rest of the repo root (`README.md`, `CONVERSATION.md`) is project
documentation, not code — see "Pushing to origin" below for what else used
to live here and no longer does.

## Commands

There is no build, no bundler, no package manager, no linter, and no test
suite — none is configured, and none should be introduced without reason; the
project's whole premise is zero dependencies.

To preview the site locally (required — ES modules do not work under
`file://`):

```bash
cd site
python3 -m http.server 8000   # or: python -m http.server 8000
# open http://localhost:8000
```

To publish: the site is fully static and hash-routed, so no server
configuration is needed. Point GitHub Pages / Netlify / Vercel at the `site/`
directory directly (no build command, publish directory = `site`).

## Architecture

Single-page app, single HTML file (`site/index.html`), everything else
injected by JS into `<main>`. No routes exist on the server — all navigation
is client-side.

- **`site/js/content.js`** — all site copy, English only. This is the file to
  edit for 99% of content changes. Key exports: `SITE` (identity/contact
  links), `MEDIA` (Contra CDN base URLs, still used for the Constraints
  gallery images), `UI` (interface strings), `HERO`, `PROJECTS` (array of case
  studies/side projects), `PAGES` (editorial pages: about, the "2-year gap"
  essay). Until `8592e3b` each entry had parallel `fr: {}`/`en: {}` blocks;
  that split is gone — see "French removal" below.
- **`site/js/app.js`** — router, static UI-string application
  (`applyStaticI18n()`; no more language switching — see below), visitor
  name-input sanitization, SVG poster generator, page-building functions
  (`pageHome`, `pageList`, `pageCase`, `pageEditorial`), footer, scroll-spy,
  loader/preloading, app bootstrap. Numbered section comments inside the file
  mark each concern — grep for `\d+\)` in the section-comment headers to jump
  around.
- **`site/css/styles.css`** — design tokens (`:root`) + 13 numbered sections.
  Two runtime themes, switched by `app.js` setting `data-theme` on `<html>`
  per route: `brand` (blue background, home/lists) and `light` (white
  background, case studies — long-form reading). Everything below the token
  block reads through `var(...)`; there are no hardcoded colors elsewhere.
- **`site/assets/img/`** — case study figures, extracted from the source PDFs,
  as WebP with a PNG `<picture>` fallback.
- **`site/assets/media/`** — Lottie JSON animations (rendered client-side by
  the `dotlottie-wc` web component, loaded from the `unpkg.com` CDN — see
  `index.html`), plus `constraint-limit.mp4`/`.jpg`, the Constraints case
  study's hero video (local, not Contra — see below).
- **`site/assets/icons/`** — small SVGs downloaded verbatim from Figma (never
  hand-authored) for the Constraints "sentence builder" widget: constraint-type
  icons, the diamond-stack illustration layers, the drawer chevron, and the
  task-checkbox checkmark.

### Content model (`content.js`)

Each entry in `PROJECTS` has `slug`, `kind` (`'work'` or `'side'` — drives
routing and the work/side split on the home page), `sections[]` (each with
`id`/`label`/`title`/`body[]`), and an optional `media` object keyed by
paragraph index (`0`, `2`, ...) to interleave images/video/Lottie after a
specific paragraph — this preserves a specific narrative order rather than
grouping all media at the end. Each media item's `type` is `'lottie'`,
`'video'`, or `'image'`; lottie/video items with a bare `id` (no `src`)
resolve against `MEDIA.videoBase`/`imageBase` (the Contra CDN); items with an
explicit `src` are read from `assets/media/` in this repo instead (currently
just the Constraints hero video). Image items may carry `frOnly: true` (the
source PDF annotation only ever existed in French — now shown with a
permanent "Figure annotated in French" note, since French removal left no
other language to fall back to) and/or `altImage` (an English re-export, once
one exists, to replace the `frOnly` figure). A `design`-section-only `builder`
field renders an interactive sentence-builder widget after the section's
mockup figure (`constraintBuilderMarkup()`/`setupConstraintBuilder()` in
`app.js`), deliberately outside the `media` pipeline — see the CSS comment
next to `.constraint-builder` for why. The same section also has a
`lottieCarousel` field (an array of `{ src, label }`), rendered right after
the section's first paragraph by `lottieCarouselMarkup()`/
`setupLottieCarousel()` — a single-panel-at-a-time viewer (click a label,
see its animation) rather than the static `media` grid, so it also stays
outside the `media` pipeline.

A section may also carry: `intro` (array of sentences, joined with `<br>`
inside a single `<p>`, rendered right under the section title, before
`body[]` — independent of the paragraph-indexed `media`/`lottieCarousel`
system so it survives edits to `body`); `list` (array of strings rendered as
a bulleted `<ul class="cs-sec__list">`, right after `intro` — note the global
reset (`ul,ol { list-style: none }` in `styles.css`) strips bullets by
default, so `.cs-sec__list` explicitly restores `list-style: disc`);
`mockups` (array of `{ image, caption }`, rendered via `figureFor()` inside a
`.cs-mockups` wrapper — stacked full-width, no `.figure__frame`
border/padding/background, unlike the default boxed-frame figure treatment);
and `helpers` (`{ title, body }`, rendered as a single `<p><strong>title</strong><br>body</p>`
after `s.builder`, followed by `s.lottieCarousel` if present — this is where
the carousel now lives, no longer tied to `body[0]`). See "Constraints case
study restructure" below for the full picture of how these fit together on
that one project.

### French removal (commit `8592e3b`, merged to `main`)

The site was originally bilingual (`fr:`/`en:` blocks per content entry,
`state.lang` in `app.js`, a header language switcher, a `t()` lookup helper).
That was fully removed: `content.js` entries are now flat English objects,
`app.js` has no language state, and `applyStaticI18n()` just writes `UI`
strings directly with no lookup layer. All the original French copy is
archived verbatim in `french-translation.md` at the repo root — kept for
reference but deliberately excluded from every push to `origin` (see
"Pushing to origin" below).

### Case study layout (`pageCase()`, `app.js`)

For a project with `sections[]`, the sticky sidenav (`.cs-nav`) spans the
*whole* page, not just the process steps: its first entry is "Overview",
pointing at the intro/hero block itself (`id="sec-overview"`), which is
nested inside the same width-constrained column as the process sections
rather than sitting in its own separate `.wrap`. This keeps the intro and the
sections visually the same width (modeled on
rachelchen.tech/projects/openai). `setupCaseBehaviours()`'s scroll-spy and
progress bar select `#sec-overview, .cs-sec` together, so the overview block
is just the first tracked "section". Projects with no `sections[]` skip this
whole nav — the intro renders alone in its own `.wrap`, as before.

### Routing (`app.js`, section 7)

Hash-based (`#/work/<slug>`, `#/side/<slug>`, `#/about`, `#/gap`), parsed by
`parseRoute()`/`routeKey()`. Chosen deliberately over path-based routing so
the site needs zero server configuration and works identically on GitHub
Pages, Netlify, or a plain folder — see the comment block above `parseRoute`
for the reasoning. `routeKey()` strips the in-page anchor (`#/work/x#mapping`)
so anchor navigation doesn't get treated as a route change.

### View transitions and `afterSwap` (`render()`, `app.js`)

`render()` swaps `<main>`'s content inside `document.startViewTransition()`
and waits on `updateCallbackDone` before running `afterSwap()` (which wires up
every page's event listeners — widget interactivity, scroll-spy, outside-click
handlers, etc.). If a second navigation fires while a transition is still
animating, the browser aborts the first transition and rejects its
`updateCallbackDone` with `InvalidStateError` — harmless-looking console noise,
but without a rejection handler `afterSwap()` would silently never run for
that render pass, leaving the new page's listeners unattached. `render()`
passes `afterSwap` as both the resolve *and* reject handler for exactly this
reason — don't remove the second argument.

### Lottie carousel and `dotlottie-wc` sizing (`lottieCarouselMarkup()`, `app.js`)

Only the active panel's `dotlottie-wc` gets a real `src` attribute up front;
the other three carry the same URL as `data-src` instead, and
`setupLottieCarousel()`'s tab click handler promotes `data-src` to `src` the
first time a panel is actually shown. This isn't just lazy-loading —
`dotlottie-wc` has a `freezeOnOffscreen` behavior that, if it initializes
its `<canvas>` while its own panel is still `hidden` (zero-size), leaves
that canvas stuck at the raw HTML default of 300×150px forever, even after
`hidden` is later removed: the result is a small bitmap stretched to fill a
much bigger box, i.e. visibly blurry/pixelated. Giving it a real `src` only
once its panel is unhidden avoids ever creating the canvas at the wrong
size. Don't move `src` back into the initial markup for panels other than
index 0 without re-testing this. Non-Blocking panels also enlarge their
`dotlottie-wc` to 140% (`position: absolute`, clipped by
`.lottie-carousel__stage`'s `overflow: hidden`) rather than using a CSS
`transform: scale()`, so the crop redraws at a genuinely higher resolution
instead of stretching an already-rendered bitmap — same
blur-avoidance principle, different half of the problem.

### Constraint-builder diamond stack (`.cbuild__illu-layer`, `styles.css`; `constraintBuilderMarkup()`/`setupConstraintBuilder()`, `app.js`)

The illustration shows one diamond `<img>` per selected task (up to
`cfg.maxTasks`, 4), toggled via the `hidden` attribute in `updatePreview()`.
Two non-obvious things about how it's positioned:

- **`[hidden]` needs an explicit override.** `.cbuild__illu-layer` sets
  `display: block` (needed for the `rotate(45deg)` diamond shape to render at
  all). An *author* rule always wins over the UA `[hidden] { display: none }`
  rule, even at equal specificity — so without
  `.cbuild__illu-layer[hidden] { display: none; }` right after it, all 4
  diamonds render regardless of `hidden`, permanently, no matter how many
  tasks are checked. This bit us once already; don't drop that override rule.
- **The visible group re-centers itself, it doesn't just grow from a fixed
  base.** Each diamond's `top` is `var(--illu-base)` plus a fixed 7% step per
  slot (`--illu-layer--slot0..3`), and `--illu-base` is a `calc()` on
  `.cbuild__illu-graphic` driven by `--illu-count` (kept in sync with
  `vals.tasks.length` via `illuGraphic.style.setProperty('--illu-count', …)`
  in `updatePreview()`). This means the whole visible stack stays centered on
  the same pivot for any task count — 1 task centers on the pivot, 4 tasks
  spread symmetrically around it — instead of always anchoring the
  bottom-most diamond and only growing upward as more tasks are added (which
  is what a naive `top: fixed-per-slot` scheme does, and used to visually
  drift the stack away from the "Limit" bracket line as the count changed).
- **z-index is explicit and inverted from DOM order.** slot0 (visually the
  topmost diamond in the stack) gets the highest `z-index`; slot3 the lowest.
  Without this, default paint order (DOM order, no stacking context override)
  puts the visually *bottom* diamond on top, since it's the last `<img>` in
  the markup — the opposite of the intended "top card of the stack is in
  front" look.

### Constraints case study restructure (`content.js`, `moreDrawerMarkup()`/`embedFor()`/`setupMoreDrawerEmbeds()`, `app.js`)

The "Process" section's two former sub-sections ("Mapping the 24 constraints",
"Benchmark") now live inside a `moreDrawer` field (`{ label, items: [{ title,
body[], image|embed, caption }] }`), collapsed behind one `<details
class="figure-drawer cs-more">` at the end of the section rather than as
separate nav entries. Two things worth knowing if you touch this:

- **An item can render an `<img>` (via `figureFor()`) or a live Figma canvas
  (via `embedFor()`, if it has `embed` instead of `image`) — never both.**
  `embedFor()` wraps an `<iframe>` in a `.cs-more__embed` box sized by
  `aspect-ratio` (not a fixed height), so it stays proportional at any column
  width.
- **The iframe's `src` is deferred, not set in the initial markup.** An
  `<iframe>` created inside a closed `<details>` (`display: none` by default)
  never fires its network request, even after the `<details>` is later
  opened — unlike an `<img>`, which loads its resource regardless of
  visibility. `embedFor()` therefore renders `data-embed-src` instead of
  `src`, and `setupMoreDrawerEmbeds()` (called for every case-study route,
  wired in the router) listens for each `.cs-more`'s `toggle` event and
  promotes `data-embed-src` → `src` the first time it opens — this also
  means visitors who never expand the drawer never load Figma's embed at
  all. Don't move `src` back into `embedFor()`'s initial markup without
  re-testing this.
- **Embed URL format: `embed.figma.com/design/{file-key}`, not the
  `www.figma.com/embed?embed_host=share&url=...` snippet from Figma's own
  `Partager > Intégrer` button.** The latter *does* load the real canvas
  (direct top-level navigation, no login wall — the file is link-shared) but
  silently ignores the `page-selector` query param: tested both formats
  side by side in a real iframe, and the legacy one always redirects
  internally to a URL with `page-selector=0` baked in regardless of what
  value you pass it, so the page-switcher dropdown never renders. Confirmed
  working (dropdown shows, labeled with the page name) only with
  `https://embed.figma.com/design/{file-key}/{title}?node-id=...&embed-host=...&page-selector=true`
  — see [developers.figma.com/docs/embeds/embed-figma-file](https://developers.figma.com/docs/embeds/embed-figma-file/).
- **`frame-src` in the CSP `<meta>` tag (`index.html`) needs BOTH Figma
  domains.** `https://www.figma.com` (the top-level page some flows still
  redirect through) *and* `https://embed.figma.com` (what the iframe `src`
  actually points at now) — without an explicit `frame-src`, CSP falls back
  to `default-src 'self'`, which silently blocks framing any external
  origin. If you add a second embeddable origin later, extend this list
  rather than widening it to `https:` generally.
- **Confirmed working end-to-end**, including the page-selector dropdown,
  by loading the actual deployed markup (drawer opened, iframe `src`
  promoted) in a real browser tab and screenshotting the result — not just
  checking for the absence of CSP console errors.

### moreDrawer rich body items, `s.list` cards, and nav renumbering (`content.js`; `drawerBodyParagraph()`/`moreDrawerMarkup()`, `app.js`; `.cs-tag`/`.cs-sec__cards`, `styles.css`) — session 12

- **`moreDrawer.items[].body` items can now be a plain string (unchanged,
  renders as `<p>`) or an object.** `{ intro, tags: [{color, label, text}] }`
  renders the intro `<p>` followed by a `<ul class="cs-tag-list">` of
  color-coded inline badges (`.cs-tag--green/purple/red` — literal hex values
  copied from the source Figma node, not tied to the site's `--accent`
  tokens, since they're a one-off legend not a reusable palette).
  `{ intro, list: [...] }` renders the intro `<p>` followed by a plain
  `<ul class="cs-sec__list">` sub-list. Dispatched by the new
  `drawerBodyParagraph()` helper — keep using it (not a hand-rolled `<p>`)
  for any future drawer item that needs either shape.
- **`s.list` changed shape: `string[]` → `{title, body}[]`, rendered as a
  4-up `.cs-sec__cards` grid instead of a bullet list.** Checked before
  changing it: `s.list` was used by exactly one section (Constraints/design)
  in the whole of `content.js`, so this wasn't a breaking change elsewhere —
  if a future case study wants a plain bullet list again, don't reuse `list`
  for it without re-checking that assumption still holds.
- **`.cs-sec__card-title` must be written `.cs-sec__card .cs-sec__card-title`
  (specificity 0,2,0), not `.cs-sec__card-title` alone (0,1,0).** The generic
  `.cs-sec p { margin-bottom: var(--s4) }` (0,1,1) also matches this `<p>`
  and otherwise wins, reintroducing a 16px gap under the title the rule was
  meant to remove. Same trap as the `.cbuild__preview-title` case already
  documented further down this file — check `.cs-sec p`'s specificity before
  trusting a bare class selector to override it anywhere inside `.cs-sec`.
- **Sidebar nav numbering: "Overview" now gets `01` instead of no number**,
  and every `c.sections[i]` badge shifted from `i+1` to `i+2` to stay
  sequential. This lives in the *shared* `pageCase()` nav-building code, so
  it applies to every case study with `sections`, not just Constraints —
  intentional, for a consistent numbering scheme site-wide. Section `title`
  strings (the in-page `<h2>`, e.g. `"1. Process"`) are separate static text
  and were updated by hand to match (`"1. Process"` → `"2. Process"` etc.);
  they don't derive from the nav index, so a new section's `title` number
  must be kept in sync manually.
- **Constraints case study now has a 4th section, `id: 'takeaways'`**, using
  `intro` (not `body`) for its two-line reflection — `intro` already joins
  its array items with a real `<br>` after escaping each one individually,
  which was exactly what the requested two-sentence paragraph needed, with
  no renderer changes.

### Constraint-builder card sizing (`.cbuild__card`, `styles.css`)

The card is intentionally *not* full-width inside `.cbuild__frame`: `width:
60%; margin-inline: auto;`, with every font-size/padding/gap/icon-size
declaration inside `.cbuild__card` pre-multiplied by the same ~0.6–0.7 scale
factor (see the comment above `.cbuild__card`) rather than left at the
widget's original Figma-fidelity sizes. **`zoom` was tried first and
rejected** — it's the obvious one-property way to scale a whole subtree
(font, padding, icons, layout all at once), but a block element with `width:
auto` inside a `zoom`ed ancestor still resolves to 100% of the *available*
width via the normal shrink-to-fit algorithm once its content's natural
width exceeds that available space (true here: `.cbuild__sentence` wants to
be wide). Confirmed empirically — `getBoundingClientRect().width` stayed
exactly equal to the frame's inner width regardless of the `zoom` value.
Hence the manual per-declaration scaling instead, which is layout-correct
(no reserved-but-unused whitespace) and handles the widget's dynamic height
(day-picker drawer expanding/collapsing) natively.

`.cbuild__layout`'s `grid-template-columns` ratio (`5fr 3.5fr` as of this
writing) was tuned, not guessed: the goal was the bottom-right recap
sentence ("Marc Tremblay will be limited to the task Care - Floor 2 from
Monday to Friday.") wrapping to exactly 2 lines. Equal columns (`4fr 4fr`)
achieve that too but push the left column's fields onto 4 lines instead of
2; `5fr 3.5fr` was the narrowest right column that still gets 2 lines on the
recap without over-squeezing the left side — if you change the recap
sentence's default values (`builder.default` in `content.js`), re-check line
count with the browser rather than assuming the ratio still holds.

`.cbuild__break` (an empty `<span class="cbuild__break">` with `flex-basis:
100%; height: 0;`) forces "the task [...] from [...]" onto its own line
inside `.cbuild__sentence` regardless of container width, rather than
relying on the flex-wrap's natural (width-dependent) break point.

### Components showcase widget (`componentsShowcaseMarkup()`/`setupComponentsShowcase()`, `app.js`; `.ccomp__*`, `styles.css`)

A second, independent widget below the rule-builder in the Constraints case
study (`builder.components` in `content.js`): four standalone fields
(Physicians, Constraint type, Tasks, Period) that each open/close on their
own — not a composed sentence like the rule-builder above them. Figma
sources: node 52:1781 ("Components", frame appearance and background image —
`assets/img/components-showcase-bg.jpg`, distinct from the rule-builder's own
background) and node 21:797 ("Interactive components", open/close/hover
behavior); node 58:2890/58:2870 for the pill designs described below.

- **Panels are positioned absolutely, not with CSS Grid.** `.ccomp__grid` is
  just a `position: relative` sizing box; each `.ccomp__panel` is `position:
  absolute` with its own `left`/`top` (all at `top: 5%`, one row —
  `left: 1% / 37% / 55% / 79%` for Physicians/Constraint/Tasks/Period). These
  percentages aren't arbitrary or Figma-derived: they were widened from an
  earlier, tighter 1/24/50/75 spread specifically to leave room for the
  Physicians trigger's pill row (see below), sized against each trigger's
  *measured* worst-case pixel width with this demo's data (4 physicians, 3
  groups, 4 tasks, 3 shifts) — if you add more items to any of those lists
  in `content.js`, re-measure rather than assuming the spacing still holds.
- **`.ccomp__body` is `position: absolute` on every panel, not just its
  closed trigger.** This looks redundant at first (why not let it sit in
  normal flow under the trigger?) but it's load-bearing: `.ccomp__panel` has
  no explicit width (shrink-to-fit, since it's absolutely positioned), so a
  body that's wider than its own trigger — the 300px-wide `.ccomp__body` vs.
  e.g. a ~225px Tasks trigger — would otherwise become the panel's widest
  in-flow child and inflate the *closed* trigger's footprint the moment the
  panel opens, overlapping whatever panel sits to its right even when the
  trigger alone had enough clearance. Confirmed by testing: with the body
  still in normal flow, opening Tasks alone (no pills) pushed into Period
  despite spacing that was already sized for Tasks' pill row. Physicians/
  Constraint/Tasks open their body left-aligned under the trigger (`left:
  0`); Period overrides to `right: 0` instead (see next point).
  `@media (max-width: 860px)` resets `.ccomp__body` back to `position:
  static` for every panel, since the mobile layout is a plain stacked column
  (see below) where this whole absolute-positioning scheme doesn't apply.
- **Period's body is right-anchored, not left.** At `left: 79%`, a
  left-anchored 300px body would overflow the frame's right edge on
  narrower desktop widths (verified near the 860px breakpoint). Anchoring
  its `.ccomp__body` to `right: 0` instead makes it open leftward off the
  trigger, which stays inside the frame at any width the absolute-position
  layout applies to.
- **Cross-category pills (node 58:2890/58:2870).** The Physicians and Tasks
  triggers each cover two tabs sharing one field (Physicians/Groups,
  Tasks/Shifts — see `tabs()`/`switchTab` pattern, shared with the physician
  tab-count pills). Their trigger label
  (`physicianTriggerLabel()`/`taskTriggerLabel()`) normally just describes
  whichever tab is active, but the moment *both* tabs have a selection, the
  plain-text label is replaced by real pill markup instead
  (`physicianTriggerHTML()`/`taskTriggerHTML()`, `pillHTML()`) so neither
  selection is hidden behind the other. Two different shapes, matching the
  two source nodes exactly rather than a single generic pattern:
  - **Tasks** (node 58:2870): two flat, independent pills side by side
    (`.ccomp__pillrow`) — "N Tasks ×" and "N Shifts ×".
  - **Physicians** (node 58:2890): a *nested* structure, not a flat row —
    `.ccomp__pillgroup` is the light wrapper that visually contains
    everything: the bare "N Total" text (physicians selected + the `size`
    of each selected group — a fixed illustrative number per group in
    `content.js`, not a real roster; the Figma mock itself shows "223
    Total" against 4 named physicians in the whole file), the two solid
    accent pills ("N Physicians ×", "N Groups ×"), and a final bare "×"
    that clears both at once. Don't flatten this back into a row of
    sibling pills — the nesting is what makes "Total" read as a sum of the
    two pills next to it rather than a third independent value.
  - Each pill's "×" (`data-pill-remove`) fully clears that category
    (`vals.physicians = []`, etc.) regardless of the "at least one must stay
    checked" rule that applies to manual checkbox toggling in the list —
    an explicit clear is allowed to go to zero. Clicks are intercepted with
    `stopPropagation()` so they don't also toggle the trigger's own
    open/close (delegated on `.ccomp__trigger-value`, since the pills are
    rebuilt via `innerHTML` on every `refresh()` rather than diffed).
  - **Switching to the *other*, empty tab must not look like the selection
    was cleared.** `physicianTriggerLabel()`/`taskTriggerLabel()` used to
    look only at the active tab's own list, so switching e.g. Physicians →
    Groups when Groups was still empty showed a bare "Select groups"
    placeholder even though physicians were still selected underneath.
    Fixed via a shared `dualCategoryTriggerLabel()` helper: if the active
    tab's list is empty but the *other* one isn't, it falls back to
    describing that other list instead of the placeholder.
- **Tab-to-complete in both search boxes** (`setupSearchField()`, shared by
  Physicians and Tasks): Enter already accepted the ghost autocomplete
  suggestion (node 21:496); Tab now does the same, but only when a
  suggestion is actually showing — `preventDefault()` is conditional on
  `computeGhostSuggestion()` returning something, so Tab still moves focus
  normally the rest of the time instead of ever trapping the keyboard.
- **Mobile fallback (`@media (max-width: 860px)`).** The whole
  absolute-position scheme assumes a comfortably wide frame; below the
  breakpoint `.ccomp__grid` becomes a plain `flex-direction: column` stack
  and every `.ccomp__panel`/`.ccomp__body` reverts to `position: static`,
  same as the rule-builder's own mobile behavior.
- **Pill-remove hover states (`.ccomp__pill-remove:hover`).** Three colors,
  not one — the cross's background needs to read differently depending on
  what it sits on: `rgba(55,20,149,.12)` on light backgrounds (Tasks/Shifts
  pills, the bare "Total"-clearing `×`), `#533EB5` on the solid accent pills
  (Physicians/Groups, `#6f69d5` fill) — a color picked specifically to land
  between the pill's own fill and the brand dark purple `#371495`, since
  both endpoints were tried and rejected (`#655FCB` nearly matched the pill
  fill and vanished; `#371495` read as too dark against it).
- **The bare "Total"-clearing `×` needed `align-self: stretch`
  (`.ccomp__pillgroup > .ccomp__pill-remove`).** `.ccomp__pillgroup` uses
  `align-items: center`, so unlike the nested `.ccomp__pill`s (which stretch
  themselves internally) this lone cross only took its own content height —
  measured 14px against 21.6px for its siblings, so its hover fill visibly
  fell short of matching height. Scoped to the direct-child selector so it
  doesn't affect the nested per-category crosses, which already match.
- **Numeric trigger labels are pills too, not just names.**
  `dualCategoryTriggerLabel()` returns `{ text, word }` instead of a plain
  string: `word` (the category name, already identical to the `scope`
  `pillHTML()` expects) is only set when `text` is the numeric form ("3
  physicians selected"), never for the ≤2-item name form, where a pill
  would be nonsensical. `physicianTriggerHTML()`/`taskTriggerHTML()` wrap
  the text in `pillHTML()` whenever `word` is present, even when only one of
  the two tabs (Physicians/Groups, Tasks/Shifts) has a selection — matching
  the pill treatment already used once *both* tabs are active.
- **Group options show their member count in parentheses** ("Floor 2 team
  (6)") via `taskCheckboxRows()` — shared by all four list bodies
  (Physicians/Groups/Tasks/Shifts) — appending `(${item.size})` only when
  `item.size` is set, which today is true only for `cfg.groups` entries in
  `content.js`; harmless no-op for the other three lists.
- **Physicians dropdown list hover is a distinct, darker purple
  (`#ddd0fa`)**, not the `#f1ecfc` every other listbox in the widget uses —
  scoped via `.ccomp__panel[data-role="physician-panel"] .ccomp__list
  li:hover` rather than changing the shared rule, so Tasks/Shifts/Constraint/
  Period keep the lighter default.
- **`.ccomp__trigger` overrides its inherited padding to a uniform `6px`**
  (was `6px 25px 6px 11px`, inherited from `.cbuild__select`/
  `.cbuild__trigger` — sized for a chevron in *absolute* position, the
  rule-builder's own pattern). Here the chevron is a real flex child
  (`fieldChevron`, appended last in every trigger's markup), so the
  asymmetric padding just left a 25px dead gap after it; symmetric padding
  puts it flush against the edge, matching the 6px on the text side.

### SoundCloud case study visuals (`content.js`; `s.stats`/`pageCase()`, `app.js`)

Imported the design/research visuals from the live `marvinsrd.com/en/
soundcloud-project` page into this case study — while keeping *this*
project's own layout system (the shared `.stats`/`.figure`/`.cs-mockups`
components), not copying the source page's own bespoke styling.

- **New optional section field `stats`** (`{ n, l }[]`, same shape as the
  project-level `stats` used for the header's "Impacts" numbers) — renders
  via a new `.stats--sec` modifier (smaller `font-size` on `.stat__n`,
  tighter `margin-block`, no "Impacts" heading) right after a section's
  paragraphs, before `mockups`/`image`. Used to pull numbers that used to
  sit only in prose (survey stats in Research, mission-success numbers in
  Testing) out into cards, matching the source page's "component boxes"
  treatment without introducing a whole new visual language.
- **Research section's `mockups`** are the two SUS-calculation slides from
  the source page (`soundcloud-sus-calc`, `soundcloud-sus-scale`, exported
  and converted to the repo's webp+png pair convention). Their captions
  deliberately don't restate the exact SUS number: the slide reads "SUS
  Score = 69,27" but the case study's own body text says "69.57" — a
  rounding discrepancy already present in the source material, not
  introduced here. Repeating the number in the caption would visibly
  contradict the paragraph right above it.
- **Solution section's `image`** (`soundcloud-solution-design`) is the
  actual redesigned artist-page mockup from the source page — this section
  was text-only before.

### Header height sync (`syncHeadHeight()`, `app.js`)

`--head-h` (design token, `styles.css`) is read by `.cs-nav`'s sticky
positioning and by `scrollToSection()`'s scroll offset. It used to be two
hand-maintained guesses (82px desktop / 72px mobile) that didn't quite match
`#site-head`'s real rendered height at either breakpoint, which showed up as
a visible gap between the sticky header and the case-study sidenav on
mobile. `syncHeadHeight()` (called once at boot in `start()`, since
`#site-head` is part of the static shell and never replaced by the router)
attaches a `ResizeObserver` to `#site-head` and writes its real `offsetHeight`
into `--head-h` as an inline style on `<html>` — inline always beats the
stylesheet value, and the observer re-fires on every layout change (breakpoint
switch, font load, content change), so the two hardcoded fallback values in
`styles.css` now only matter for the very first paint before JS runs.

### Constraints card thumbnail (`.card__media video`, `styles.css`; `projectCard()`, `app.js`)

The home page grid card for "Scheduling constraints" is the only card whose
`cardMedia()` output is a `<video>` (see "Content model" above — it's driven
by `heroMedia`, not the PDF-figure/poster fallback used by every other
project). Its styling deviates from the rest of `.card__media` in three
ways, all scoped so they can't leak onto other cards:

- **`object-fit: contain`, not `cover`.** The source video is portrait
  (narrower than the card's landscape box), so `cover` would crop it instead
  of showing it whole — same reasoning as `.cs__hero-media` on the case
  study page itself (see "Fragile external dependencies" below).
- **Background color scoped via `data-slug`.** `projectCard()` stamps
  `data-slug="${p.slug}"` on the card `<a>` specifically so
  `.card[data-slug="constraints"] .card__media` can carry the `#e9e1f9`
  letterbox-matching background without affecting the shared
  `rgba(0,0,0,.12)` used by every other card's media box.
- **`clip-path: inset(0 0 4% 0)` crops a border baked into the source
  video.** The `constraint-limit.mp4` file itself has a faint horizontal
  line near the bottom edge of its own frame (visible on inspection, not a
  playback/encoding artifact) — since the video fills its box's full height
  under `object-fit: contain` (letterboxed left/right only, not top/bottom),
  clipping 4% off the bottom removes exactly that line and reveals the
  matching `#e9e1f9` background behind it. If the source video is ever
  re-exported without that border, this clip-path can likely be removed.

## Security

- The CSP `<meta>` tag in `index.html` is the single source of truth for
  every allowed external origin. Any new external asset (font, CDN script,
  image host) must be added there or it will be silently blocked by the
  browser — check this first if something loads locally-added but not when
  deployed. Current external origins: `fonts.googleapis.com`/`.gstatic.com`
  (Raleway, plus Roboto — loaded only for the constraint-builder widget, to
  match its Figma source — both pulled from the same stylesheet link in
  `index.html`), `unpkg.com`/`cdn.jsdelivr.net` (`dotlottie-wc` + its WASM
  runtime), `media.contra.com` (Constraints project video/images),
  `www.figma.com` and `embed.figma.com` (`frame-src` only — the live Figma
  embed in the Constraints "See more" drawer, see "Constraints case study restructure"
  below).
- The visitor's first name (entered in the "portal" at load) goes through
  `cleanName()` — character whitelist + length cap — and is inserted via
  `textContent` only, never `innerHTML`. See `app.js` section 2.
- **Deviation:** the original brief said the name should live "in a
  variable, not a database" and disappear on reload (see the comment block
  above `cleanName()` in `app.js`). Session 7 added `localStorage`
  persistence with a 1-hour expiry (`readStoredVisitor()`/
  `writeStoredVisitor()`, section 9) at explicit user request, so a reload
  within the hour doesn't re-ask. It's a short whitelisted string, on the
  visitor's own machine, never transmitted — the comment block documents
  this as a conscious trade-off against the brief's stricter wording, not an
  oversight.

## Fragile external dependencies

- **Constraints project's Solution-section mockups are local now, not
  Contra.** The old 3-image Contra gallery (`media.contra.com`) was replaced
  with 2 locally-hosted images (`s.mockups` in `content.js`, exported from
  Figma) — no longer a fragile dependency. The hero video is likewise local
  (`assets/media/constraint-limit.mp4`); see the `.cs__hero-media` comment in
  `styles.css` for why the frame background is `#e9e1f9` (sampled from the
  video's own poster frame, to hide the letterboxing from a portrait video
  in a 16:9 box). `media.contra.com` remains in the CSP `img-src`/`media-src`
  only because other projects may still reference it — grep `content.js` for
  `MEDIA.` before assuming it's fully unused.
- **The live Figma embed (Constraints "See more" drawer) *is* a fragile
  dependency** — unlike everything else on this list, it's not a static
  asset but a live, unversioned third-party canvas: if the source Figma file
  is deleted, renamed, or its link-sharing is turned off, the embed breaks
  with no local fallback. Confirmed rendering correctly (canvas + working
  page-selector dropdown) as of the `embed.figma.com` URL fix — see
  "Constraints case study restructure" above.
- **Raleway and Roboto fonts**: loaded from Google Fonts — the only other
  external origin besides Contra and the Lottie CDN; couldn't be
  self-hosted in this sandboxed dev environment.

## Pushing to origin

`CLAUDE.md`, `CONVERSATION.md`, and `README.md` are intentionally kept out
of `origin` while remaining fully tracked in local branch history and
present on disk (verified against `origin/main`, 2026-08-20 — none of the
three are there). Never `git push` a branch
directly if it contains new commits — use the disposable-branch pattern
instead: branch off as `push-temp`, `git rm --cached` each excluded file
(this untracks it from the commit without deleting it from disk), commit,
`git push origin push-temp:<real-branch> --force`, then switch back to the
real branch (deleting the few leftover untracked copies `git checkout`
complains about) and `git branch -D push-temp`. This keeps the real branch's
own history/working tree untouched — only the disposable branch's snapshot
ever reaches `origin`.

**Deviation, session 5→6.** At some point after session 5, a commit titled
"Push snapshot: exclude internal docs, source PDFs, and
french-translation.md" removed `CLAUDE.md`, `CONVERSATION.md`, `README.md`,
`Portfolio PRD for Claude.md`, `french-translation.md`, and the 4 source PDFs
from `main` itself (both locally and on `origin`), rather than only from a
disposable push branch — so unlike what this section describes, they briefly
stopped existing in local history too. Session 6 recreated `CLAUDE.md` and
`CONVERSATION.md` from their last known content (git history, commit
`3e9e84a`) and committed the update to `main` locally only — *not* pushed to
`origin`, per the convention above. If you're starting a session and these
files look "new" instead of "modified" against `origin/main`, this is why;
the push-temp method above is still the right one for any future push that
should reach `origin` while these files remain present.

**`Portfolio PRD for Claude.md`, `french-translation.md`, and the 4 source
PDFs were never recreated after that session-6 incident and no longer exist
in this repo at all** (checked directly, 2026-08-20) — only `CLAUDE.md`,
`CONVERSATION.md`, and `README.md` currently exist among the files this
section lists. Their content may still be recoverable from git history
before the session-5→6 incident if ever needed; they're not treated as a
blocker for anything since nothing in the live site depends on them.

**Deviation #2 (same mistake, recurred before 2026-08-20).** The
`push-temp` pattern was skipped again — a "Push snapshot: exclude internal
docs" commit (`d3a6127`) was made directly on a real feature branch
(`interactive-components`) rather than on a disposable one, stripping
`CLAUDE.md`/`CONVERSATION.md` from that branch's own history. That branch
was later merged into `main` (bringing the strip with it), so both files
disappeared from `main` too, locally and on `origin` — this is why they had
to be recreated *again* this session, this time from commit `be7f991` (the
last commit before the strip, still reachable as an ancestor of the merge).
**If you are about to run the doc-exclusion step, double- and triple-check
you are on a disposable branch (`push-temp` or equivalent) before running
`git rm --cached` on these files and committing — never on `main` or a
named feature branch directly.** This has now happened twice.

## Before making non-trivial changes, read

- `README.md` — quick start, file map, "how do I change X" (in French).
- `CONVERSATION.md` — full decision log: why each deviation from the
  original brief was made, known accessibility trade-offs, and an ordered
  TODO list (§5) of what's still blocking publication. Written in French.
- `videos/README.md` — documents the Lottie source files and the fallback
  Python/Cairo renderer (`videos/lottie_render.py`) used when a Lottie can't
  be played via `dotlottie-wc` directly.

(`Portfolio PRD for Claude.md`, the original brief, no longer exists in
this repo — see the deviation notes above.)
