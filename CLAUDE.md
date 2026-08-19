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
one exists, to replace the `frOnly` figure).

### French removal (commit `8592e3b`, merged to `main`)

The site was originally bilingual (`fr:`/`en:` blocks per content entry,
`state.lang` in `app.js`, a header language switcher, a `t()` lookup helper).
That was fully removed: `content.js` entries are now flat English objects,
`app.js` has no language state, and `applyStaticI18n()` just writes `UI`
strings directly with no lookup layer. All the original French copy is
archived verbatim in `french-translation.md` at the repo root — kept for
reference but deliberately excluded from every push to `origin` (see
"Pushing to origin" below).

### Routing (`app.js`, section 7)

Hash-based (`#/work/<slug>`, `#/side/<slug>`, `#/about`, `#/gap`), parsed by
`parseRoute()`/`routeKey()`. Chosen deliberately over path-based routing so
the site needs zero server configuration and works identically on GitHub
Pages, Netlify, or a plain folder — see the comment block above `parseRoute`
for the reasoning. `routeKey()` strips the in-page anchor (`#/work/x#mapping`)
so anchor navigation doesn't get treated as a route change.

## Security

- The CSP `<meta>` tag in `index.html` is the single source of truth for
  every allowed external origin. Any new external asset (font, CDN script,
  image host) must be added there or it will be silently blocked by the
  browser — check this first if something loads locally-added but not when
  deployed. Current external origins: `fonts.googleapis.com`/`.gstatic.com`
  (Raleway), `unpkg.com`/`cdn.jsdelivr.net` (`dotlottie-wc` + its WASM
  runtime), `media.contra.com` (Constraints project video/images).
- The visitor's first name (entered in the "portal" at load) goes through
  `cleanName()` — character whitelist + length cap — and is inserted via
  `textContent` only, never `innerHTML`. See `app.js` section 2.

## Fragile external dependencies

- **Constraints project's 3 gallery (mockup) images**: hosted on Contra
  (`media.contra.com`), not versioned in this repo. If that project is
  deleted/renamed on Contra, or the CDN changes URLs, these break silently.
  The hero video is no longer on this list — it was moved to a local asset
  (`assets/media/constraint-limit.mp4`) so it always renders; see the
  `.cs__hero-media` comment in `styles.css` for why the frame background is
  `#e9e1f9` (sampled from the video's own poster frame, to hide the
  letterboxing from a portrait video in a 16:9 box).
- **Raleway font**: loaded from Google Fonts — the only other external
  origin besides Contra and the Lottie CDN; couldn't be self-hosted in this
  sandboxed dev environment.

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

## Before making non-trivial changes, read

- `README.md` — quick start, file map, "how do I change X" (in French).
- `CONVERSATION.md` — full decision log: why each deviation from the
  original brief was made, known accessibility trade-offs, and an ordered
  TODO list (§5) of what's still blocking publication. Written in French.
- `Portfolio PRD for Claude.md` — the original brief.
- `videos/README.md` — documents the Lottie source files and the fallback
  Python/Cairo renderer (`videos/lottie_render.py`) used when a Lottie can't
  be played via `dotlottie-wc` directly.
