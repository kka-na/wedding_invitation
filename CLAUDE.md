# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A mobile-first Korean wedding invitation website (형진 ♥ 가나, 2026-10-25) styled after Apple product pages. It is a **single self-contained static page** — all CSS and JS live inline in `index.html`. There is no build step, no package.json at the root, no linter, no tests.

- Preview locally: `python3 -m http.server` (or any static server) from the repo root, then open `http://localhost:8000`. Opening `index.html` directly via `file://` also works but clipboard copy falls back to `execCommand`.
- After adding/replacing photos: `python3 sync_images.py` — compresses oversized images in place (via macOS `sips`) and rewrites the gallery `<img>` lists in index.html from the actual files in `images/gallery/` (`N-main.*` / `N-subM.*` naming). `--check` reports without modifying. Full-size originals live in `../images_originals_backup/`.
- After replacing the hero video: drop the new `.mov` into `images/` and run `python3 sync_video.py` — converts to 720p mp4 (via macOS `avconvert`), moves the `.mov` to the backup folder, and updates the `<video src>` in index.html. `--check` reports without modifying.
- Deployed via GitHub Pages (expected origin: `https://kka-na.github.io`).
- `index_v1.html` is a frozen backup of design version 1 — do not edit it; new work goes in `index.html`.

## Architecture of index.html

Everything is in one file, in this order:

1. `<style>` block — theme colors in `:root` variables (`--primary`, `--secondary`, `--third`, `--fourth`, `--fifth` color-code the five gallery/story sections). Self-hosted KoPubDotum woff2 fonts from `fonts/`, Pretendard from CDN as fallback.
2. Markup sections: `#hero` (full-screen photo + veil-wipe animation) → `#highlights` (horizontal snap-scroll cards: invitation/date/venue) → five `.dress` gallery sections (200vh sticky-scroll: main photo blurs/zooms as you scroll, sub-photo cards float up; each tells one story chapter) → `#location` → `#account` (accordion bank accounts) → `#rsvp` (couple profile comparison grid + bottom-sheet form).
3. `<script>` block — starts with a **`CONFIG` object which is the single place for all content settings** (venue, map URLs, parking/transit text, bank accounts, RSVP API URL). Values marked `[미정]` are placeholders awaiting real data. Config values are injected into the DOM by ID at load. The rest is vanilla-JS IIFEs, one per feature (scroll blur, card pagers, lightbox, accordion, bottom sheet, fade-in observer).

A Korean edit guide comment near the top of `<head>` maps common changes to their locations — keep it up to date if you restructure.

## RSVP backend

`server/rsvp-server.js` is a self-hosted Express + better-sqlite3 API meant for a Raspberry Pi behind a Caddy HTTPS proxy (`https://sujihome.ddns.net:49200/api/rsvp`). **The plan of record (per comments in both files) is to replace this with a Google Form**: change `CONFIG.API_URL` and rewrite `submitRSVP()` to POST `FormData` to a formResponse URL with `entry.<id>` fields and `mode: 'no-cors'`. Note the server currently validates only `side/attend/name` — the front end also sends `phone` and `count`.

## Conventions

- All user-facing text is Korean; code comments are Korean — keep that style.
- Gallery images follow `images/gallery/<section>-main.jpg` and `<section>-sub<n>.jpg` naming. File extensions are inconsistent (`.jpg`/`.JPG`/`.JPEG`) — GitHub Pages is case-sensitive, so `src` attributes must match the actual filename exactly.
- Images are deliberately protected from save/drag (CSS `user-select`/`touch-callout` + contextmenu/dragstart handlers) — preserve this on new images.
- Animations respect `prefers-reduced-motion` — new motion effects should too.
