# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is s

A mobile-first Korean wedding invitation website (형진 ♥ 가나, 2026-10-25) styled after Apple product pages. It is a **static site with no build step**: `index.html` (markup only) references `style.css` and `script.js` via plain `<link>`/`<script src>` tags — no bundler, no package.json at the root, no linter, no tests.

- Preview locally: `python3 -m http.server` (or any static server) from the repo root, then open `http://localhost:8000`. Opening `index.html` directly via `file://` also works but clipboard copy falls back to `execCommand`.
- After adding/replacing photos: `python3 sync_images.py` — compresses oversized images in place (via macOS `sips`) and rewrites the gallery `<img>` lists in index.html from the actual files in `images/gallery/` (`N-main.*` / `N-subM.*` naming). `--check` reports without modifying. Full-size originals live in `../images_originals_backup/`.
- After replacing the hero video: drop the new `.mov` into `images/` and run `python3 sync_video.py` — converts to 720p mp4 (via macOS `avconvert`), moves the `.mov` to the backup folder, and updates the `<video src>` in index.html. `--check` reports without modifying.
- Deployed via GitHub Pages (expected origin: `https://kka-na.github.io`).
- `index_v1.html` is a frozen backup of design version 1 — do not edit it; new work goes in `index.html`.

## Architecture

Three files, no build step:

- `index.html` — markup only: `#hero` (full-screen photo + veil-wipe animation) → `#highlights` (horizontal snap-scroll cards: invitation/date/venue) → five `.dress` gallery sections (scroll-pinned: main photo blurs/zooms as you scroll, sub-photo cards float up; each tells one story chapter) → `#location` → `#account` (accordion bank accounts) → `#rsvp` (couple profile comparison grid + bottom-sheet form). Links `style.css` in `<head>` and loads GSAP + ScrollTrigger from CDN followed by `script.js` at the end of `<body>` (order matters — `script.js` expects `gsap`/`ScrollTrigger` to already be defined).
- `style.css` — theme colors in `:root` variables (`--primary`, `--secondary`, `--third`, `--fourth`, `--fifth` color-code the five gallery/story sections). Self-hosted KoPubDotum woff2 fonts from `fonts/`, Pretendard from CDN as fallback.
- `script.js` — starts with a **`CONFIG` object which is the single place for all content settings** (venue, map URLs, parking/transit text, bank accounts, RSVP API URL). Values marked `[미정]` are placeholders awaiting real data. Config values are injected into the DOM by ID at load. The rest is vanilla-JS IIFEs, one per feature (hero scroll blur, dress-section ScrollTrigger pin, card pagers, lightbox, accordion, bottom sheet, fade-in observer). GSAP + ScrollTrigger (loaded from CDN in `index.html`, just before this file) power the `.dress` section pin/blur effect — CSS `position:sticky` was tried first but has a known cross-browser bug where reversing scroll direction right at the boundary between stacked sticky sections causes a visible jump to the adjacent section; ScrollTrigger computes pin/unpin itself and avoids it. If GSAP fails to load (or `prefers-reduced-motion`), the sections degrade to plain unpinned/unblurred blocks rather than erroring.

A Korean edit guide comment near the top of `<head>` maps common changes to their locations — keep it up to date if you restructure.

## RSVP backend

RSVP submissions post to a Google Sheets-bound **Apps Script web app**, not a self-hosted server. `server/rsvp-apps-script.gs` holds the `doPost(e)` handler (appends a row via `SpreadsheetApp`); paste it into the target spreadsheet's Extensions → Apps Script, deploy as a web app (execute as me, access: anyone), and put the resulting `…/exec` URL in `CONFIG.API_URL`. Re-deploying (not just saving) is required after every script edit for changes to take effect. `submitRSVP()` POSTs a `FormData` body (`side/name/phone/attend/count`) with `mode: 'no-cors'` — the response can't be read cross-origin, so success is reported optimistically once the request is sent.

`server/rsvp-server.js` (Express + better-sqlite3, meant for a Raspberry Pi behind Caddy) is the earlier self-hosted approach and is no longer wired up — kept for reference only.

## Conventions

- All user-facing text is Korean; code comments are Korean — keep that style.
- Gallery images follow `images/gallery/<section>-main.jpg` and `<section>-sub<n>.jpg` naming. File extensions are inconsistent (`.jpg`/`.JPG`/`.JPEG`) — GitHub Pages is case-sensitive, so `src` attributes must match the actual filename exactly.
- Images are deliberately protected from save/drag (CSS `user-select`/`touch-callout` + contextmenu/dragstart handlers) — preserve this on new images.
- Animations respect `prefers-reduced-motion` — new motion effects should too.
