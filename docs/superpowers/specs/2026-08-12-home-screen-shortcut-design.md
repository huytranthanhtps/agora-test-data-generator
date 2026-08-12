# Home-Screen Shortcut (Add to Home Screen) — Design

**Date:** 2026-08-12
**Status:** Approved
**Branch:** `feat/home-screen-shortcut`

## Goal

Let a mobile user put an Agora Test Data Studio shortcut on their phone's home
screen. Where the platform allows a real one-tap install (Android/Chrome) offer
exactly that; where it does not (iOS/Safari) show a clear step-by-step guide.
Entry point is mobile-only — a home-screen shortcut is meaningless on desktop.

## Platform reality (why the design is a hybrid)

- **Android / Chromium** — a real programmatic install is possible. The browser
  fires a `beforeinstallprompt` event when the site meets PWA installability
  criteria; we capture it and call `.prompt()` on a button tap. Criteria: served
  over HTTPS (GitHub Pages is), a valid web-app manifest (name, icons 192+512,
  `start_url`, `display: standalone`), and a registered service worker with a
  `fetch` handler. So a minimal manifest + service worker are required to unlock
  the one-tap button.
- **iOS / Safari** — **no** programmatic API exists. The only path is the manual
  Share → "Add to Home Screen" flow. iOS therefore is guide-only, always.
- **Anything else / event never fires** — fall back to the generic guide.

## Approach: hybrid PWA + guide, mobile-only entry

A mobile-only icon button in `TopNav` opens a dialog. The dialog is
platform-aware:

| Detected state          | Dialog content                                             |
|-------------------------|------------------------------------------------------------|
| Android + prompt captured | Primary **"Cài đặt ngay"** button → native install prompt |
| Android, no prompt yet  | Android manual steps (⋮ menu → Add to Home screen)         |
| iOS                     | iOS manual steps (Share → Add to Home Screen)              |
| Other                   | Generic guide                                              |
| Already standalone      | Entry button hidden (nothing to install)                   |

## Units (small, independently testable)

| File | Responsibility | Depends on |
|------|----------------|-----------|
| `src/lib/platform.ts` | Pure: `detectPlatform(ua: string): 'ios' \| 'android' \| 'other'`; `isStandalone(): boolean` (checks `display-mode: standalone` + iOS `navigator.standalone`). | none (ua passed in / `window` read in `isStandalone`) |
| `src/hooks/use-install-prompt.ts` | Capture `beforeinstallprompt` (preventDefault + stash the event), expose `{ canInstall, promptInstall }`; clear on `appinstalled`. | `window` events |
| `src/components/AddToHomeDialog.tsx` | Presentational dialog; renders per-platform content; wired to `promptInstall`. Mirrors the existing `HtmlPreviewDialog` structure (overlay + Escape close + focus). | `platform`, props |
| `src/components/TopNav.tsx` (edit) | Add a mobile-only (`sm:hidden`) icon button that opens the dialog; hidden when standalone. | dialog state |
| `src/App.tsx` (edit) | Own the dialog open/close state; capture the install prompt via the hook; pass down to `TopNav` + render dialog. | hook, dialog |

## PWA assets

- `public/manifest.webmanifest` — `name: "Agora Test Data Studio"`,
  `short_name: "Agora"`, `start_url` + `scope` = `"/agora-test-data-generator/"`
  (the Vite `base`), `display: "standalone"`, `background_color` + `theme_color`
  from the app's dark canvas / indigo accent, `icons` → 192 + 512 (`purpose:
  "any"`) and a 512 `maskable`.
- `public/sw.js` — minimal service worker: a `fetch` handler that just passes
  through (`fetch(event.request)`), **no caching**. It exists only to satisfy
  Android installability; passthrough avoids serving stale content on a site
  that redeploys on every `main` push.
- Icons (Concept **C** — monogram): master SVG → indigo gradient ground
  `#6366F1 → #4338CA`, white geometric "A", accent dot `#A5B4FC` at lower-right
  inside the maskable safe zone (echoes the `Agora•` mark in TopNav). Exported to
  `public/icon-192.png`, `public/icon-512.png` (`any`), a maskable 512, and
  `public/apple-touch-icon.png` (180×180, opaque — iOS ignores transparency).
  The master `public/icon.svg` is committed alongside so the PNGs are
  regenerable.

## Wiring

- `index.html` — add `<link rel="manifest" href="%BASE_URL%manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png">`,
  `<meta name="theme-color" ...>`, and both `<meta name="mobile-web-app-capable"
  content="yes">` (standard) and `<meta name="apple-mobile-web-app-capable"
  content="yes">` (iOS Safari still keys standalone launch off the apple-prefixed
  one). `%BASE_URL%` is Vite's index.html placeholder → resolves to the GitHub
  Pages base path.
- `src/main.tsx` — register the service worker **only in production**
  (`import.meta.env.PROD && 'serviceWorker' in navigator`) at
  `${import.meta.env.BASE_URL}sw.js` with `{ scope: import.meta.env.BASE_URL }`.
  Skipping dev avoids the SW interfering with Vite HMR.

## Error handling / edge cases

- `beforeinstallprompt` never fires (iOS, Firefox, already installed) → button
  still opens the dialog, which shows the manual guide for the detected platform.
- Already running standalone → entry button hidden.
- Service worker registration failure → caught and ignored (install button
  simply won't appear; guide still works). No `console.log` in committed code.
- Dialog dismissal: overlay click + Escape, matching `HtmlPreviewDialog`.

## App invariants

This feature does **not** touch `src/core/*` (generators, rng, uniqueness). The
two product invariants — seeded reproducibility and no-duplicates-within-a-batch
— are structurally unaffected. Verify step will confirm the full generator test
suite stays green.

## Testing (Vitest + jsdom + Testing Library)

- `src/lib/__tests__/platform.test.ts` — `detectPlatform` for representative iOS
  (iPhone/iPad), Android, and desktop UA strings; `isStandalone` true/false.
- `src/hooks/__tests__/use-install-prompt.test.ts` — dispatching a synthetic
  `beforeinstallprompt` sets `canInstall`; `promptInstall()` calls the event's
  `.prompt()`; `appinstalled` resets `canInstall`.
- `src/components/__tests__/AddToHomeDialog.test.tsx` — renders the install
  button when `canInstall` + Android; renders iOS steps for iOS; renders generic
  guide otherwise; Escape/overlay closes.

## Out of scope (YAGNI)

- Offline caching / full PWA offline support (passthrough SW only).
- Desktop install affordance.
- Push notifications, app-update prompts, splash-screen theming beyond the
  manifest basics.
