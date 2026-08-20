# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A hand-written, dependency-free portfolio site (`site/`) for Marvin Sorhaindo, a
product designer. Plain HTML/CSS/JS, no framework, no build step, no
`package.json`. English-only (French support was removed — see below). The
rest of the repo root (PDFs, `Portfolio PRD for Claude.md`, `README.md`,
`CONVERSATION.md`) is source material and project documentation, not code.

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
- **Embed URL format.** Figma's official `Partager > Intégrer` link shape:
  `https://www.figma.com/embed?embed_host=share&url=<url-encoded file URL>`.
  Verified as a *direct* top-level navigation (loads the real canvas, no
  login wall — the file is link-shared).
- **`frame-src` had to be added to the CSP `<meta>` tag (`index.html`).**
  Without an explicit `frame-src`, CSP falls back to `default-src 'self'`,
  which silently blocks framing *any* external origin — this would have
  broken the embed on the real deployed site regardless of any other
  factor, not just in local testing. Added `frame-src
  https://www.figma.com;` alongside the other directives. If you add a
  second embeddable origin later, extend this list rather than widening it
  to `https:` generally.
- **Still not fully visually confirmed end-to-end.** Even after the CSP fix
  (no more CSP violations in the console), the iframe never finished
  painting during this session's local testing — the automated test browser
  tab timed out / became unresponsive while Figma's canvas was loading, and
  `performance.getEntriesByType('resource')` showed only a handful of
  `initiatorType: 'iframe'` resource loads before that. This looks like a
  WebGL/GPU-compositing constraint specific to the sandboxed browser-
  automation environment used for testing, not a code defect — but that's
  an inference, not a confirmation. **Check this on the real deployed URL in
  an ordinary browser before considering it done**; if it's still broken
  there, fall back to a static image export like the one it replaced.

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
  `www.figma.com` (`frame-src` only — the live Figma embed in the
  Constraints "See more" drawer, see "Constraints case study restructure"
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
- **The live Figma embed (Constraints "See more" drawer) *is* a new fragile
  dependency** — unlike everything else on this list, it's not a static
  asset but a live, unversioned third-party canvas: if the source Figma file
  is deleted, renamed, or its link-sharing is turned off, the embed breaks
  with no local fallback. Its actual rendering also isn't fully confirmed
  yet — see "Constraints case study restructure" above.
- **Raleway and Roboto fonts**: loaded from Google Fonts — the only other
  external origin besides Contra and the Lottie CDN; couldn't be
  self-hosted in this sandboxed dev environment.

## Pushing to origin

Several files are intentionally kept out of `origin` while remaining fully
tracked in local branch history and present on disk: `CLAUDE.md`,
`CONVERSATION.md`, `README.md`, `Portfolio PRD for Claude.md`,
`french-translation.md`, and the 4 source PDFs. Never `git push` a branch
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

## Before making non-trivial changes, read

- `README.md` — quick start, file map, "how do I change X" (in French).
- `CONVERSATION.md` — full decision log: why each deviation from the
  original brief was made, known accessibility trade-offs, and an ordered
  TODO list (§5) of what's still blocking publication. Written in French.
- `Portfolio PRD for Claude.md` — the original brief.
- `videos/README.md` — documents the Lottie source files and the fallback
  Python/Cairo renderer (`videos/lottie_render.py`) used when a Lottie can't
  be played via `dotlottie-wc` directly.
