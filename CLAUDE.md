# CLAUDE.md

Guidance for Claude Code in this repo. (Trimmed 2026-08-21 — full history was in CONVERSATION.md, removed by user for context size; git history has the rest if needed.)

## What this is

Dependency-free portfolio site (`site/`) for Marvin Sorhaindo, product designer. Plain HTML/CSS/JS, no framework/build/package.json. English-only (French removed, archived in git history pre-removal). No root `README.md` (removed from disk).

## Commands

No build/lint/test — zero-dependency is the whole point, don't add tooling without reason.

Preview: `cd site && python3 -m http.server 8000` (ES modules need a server, not `file://`).
Deploy: fully static, hash-routed — point host at `site/` dir, no config needed.

## Architecture

SPA, single `site/index.html`, everything else injected into `<main>` by JS. No server routes.

- `site/js/content.js` — all copy. Edit here for content changes. `SITE`/`MEDIA`/`UI`/`HERO`/`PROJECTS`/`PAGES`.
- `site/js/app.js` — router, page builders (`pageHome`/`pageList`/`pageCase`/`pageEditorial`), footer, scroll-spy, widgets. Numbered section comments (`\d+\)`) mark concerns.
- `site/css/styles.css` — tokens in `:root`, 13 numbered sections, everything else uses `var(...)`. Two themes via `data-theme`: `brand` (home/lists) / `light` (case studies).
- `site/assets/img|media|icons/` — case figures (webp+png pairs), Lottie JSON + local mp4, Figma-exported SVGs.

## Load-bearing gotchas (don't undo these without re-testing)

- **`render()` in app.js**: passes `afterSwap` as both resolve AND reject handler for `updateCallbackDone` — a second nav aborting the first transition rejects it, and without the reject handler `afterSwap` (event listeners) silently never runs. Keep both args.
- **Lottie carousel**: only the active panel gets real `src` up front; others get `data-src`, promoted on first reveal. `dotlottie-wc` initializing its canvas while `hidden` freezes it at 300×150px forever. Don't move `src` into initial markup.
- **`.cbuild__illu-layer[hidden] { display: none }`** must stay — the layer's own `display: block` (needed for rotate) otherwise beats the UA `[hidden]` rule at equal specificity.
- **Figma embed** (Constraints "See more" drawer): use `embed.figma.com/design/{key}/...?page-selector=true`, not the `www.figma.com/embed?...` share snippet (ignores page-selector). CSP `frame-src` needs both `www.figma.com` and `embed.figma.com`. `src` is deferred via `data-embed-src` → promoted on `<details>` toggle open (iframe in closed `<details>` never fires its request otherwise).
- **`.cs-sec p` specificity trap**: generic `.cs-sec p { margin-bottom }` (0,1,1) beats bare single-class overrides — need `.cs-sec__card .cs-sec__card-title` (0,2,0) style compound selectors inside `.cs-sec`.
- **`url()` inside a CSS custom property resolves against the stylesheet that reads it via `var()`, not the context that defines it.** Bit us in `constraintOptionRows()` (app.js): an inline `style="--opt-icon-src: url('assets/icons/...')"` (relative to the page) was consumed by `mask-image: var(--opt-icon-src)` in `styles.css` (in `css/`), so it 404'd against `css/assets/...` and the icon silently failed to render. Fix: prefix `../` to match every other `url()` already in `styles.css`.

## Security

- CSP `<meta>` in index.html is the sole allowlist for external origins (fonts, CDNs, media hosts) — add new ones there or they're silently blocked.
- Visitor name: `cleanName()` whitelist+cap, inserted via `textContent` only, never `innerHTML`. Deviation from original brief: persisted to `localStorage` w/ 1hr expiry (user-requested, session 7) instead of "variable only, gone on reload."

## Pushing to origin — READ BEFORE PUSHING

`CLAUDE.md`/`CONVERSATION.md` are kept out of `origin` (tracked locally only). **This has broken twice** by committing the exclusion directly on `main` or a named feature branch instead of a disposable one, permanently stripping the docs from real history and requiring reconstruction from old commits.

**Correct method**: branch off as `push-temp` → `git rm --cached` the 2 files (untracks, keeps on disk) → commit → `git push origin push-temp:<real-branch> --force` → switch back to real branch → `git branch -D push-temp`. Never run `git rm --cached` on these files while on `main` or a real branch. Local `main` will then show as "ahead" of nothing / behind `origin/main` in a way that looks fast-forwardable (origin's tip is a descendant of local's, just missing these 2 files) — **do not `git pull`/fast-forward `main` from `origin`**, that would delete the tracked docs locally. `main` and `origin/main` are expected to diverge in content this way; only ever push local → origin via `push-temp`, never pull the other direction.

## Before making non-trivial changes, read

- `videos/README.md` — Lottie source files + Python/Cairo fallback renderer.
