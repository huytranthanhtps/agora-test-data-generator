# PWA — Home-Screen Shortcut / Installability

The app ships a minimal installable PWA so mobile users can add it to the home
screen. Entry point: the mobile-only button in `TopNav` → `AddToHomeDialog`
(`src/components/AddToHomeDialog.tsx`), platform-detected via `src/lib/platform.ts`.

## Platform capability (don't over-promise a one-tap install)

- **Android / Chromium only** can do a real one-tap install. The browser fires
  `beforeinstallprompt`; capture it (`src/hooks/use-install-prompt.ts`,
  `e.preventDefault()` + stash the event) and call `.prompt()` on a user tap.
- **iOS / Safari has no programmatic API** — the only path is the manual Share →
  "Add to Home Screen" flow. iOS is **guide-only**, always. Anything else (event
  never fires) also falls back to the guide.
- Android installability requires all of: HTTPS (GitHub Pages ✓), a valid
  manifest (name, icons 192+512, `start_url`, `display: standalone`), **and** a
  registered service worker with a `fetch` handler. All three are needed — a
  manifest alone won't unlock the prompt.

## Wiring gotchas

- `manifest.webmanifest` `start_url` + `scope` **must equal the Vite `base`**
  (`/agora-test-data-generator/`); a mismatch silently breaks installability.
  Manifest icon `src` values are **relative** so they resolve under the base
  automatically — don't hard-code the base into them.
- Reference manifest / apple-touch-icon in `index.html` via Vite's
  **`%BASE_URL%`** placeholder (e.g. `href="%BASE_URL%manifest.webmanifest"`),
  which resolves to the base in build and `/` in dev.
- Register the service worker **PROD-only** (`import.meta.env.PROD`) at
  `${import.meta.env.BASE_URL}sw.js` with `scope: import.meta.env.BASE_URL` —
  registering in dev interferes with Vite HMR.
- `public/sw.js` is a **passthrough** (`fetch(event.request)`, no caching) on
  purpose: `main` redeploys to GitHub Pages on every push, so a caching SW would
  serve stale production assets.
- iOS standalone launch keys off the legacy `<meta name="apple-mobile-web-app-capable">`
  — include it alongside the standard `mobile-web-app-capable`.

## Generating app icons without extra deps (macOS)

There is no `rsvg-convert` / ImageMagick / `sharp` on the dev machine, and `sips`
can't rasterize SVG. Rasterize the master `public/icon.svg` with **QuickLook +
sips**, both preinstalled:

```bash
qlmanage -t -s 512 -o public public/icon.svg   # → public/icon.svg.png (512, alpha)
mv public/icon.svg.png public/icon-512.png
sips -z 192 192 public/icon-512.png --out public/icon-192.png
sips -z 180 180 public/icon-512.png --out public/apple-touch-icon.png
```

The generated PNGs are committed, so CI (`npm ci` on Ubuntu) needs no image
tooling — only regeneration does. Keep the icon artwork inside the maskable safe
zone (mark within the inner ~80% diameter) so the same file works for `any` and
`maskable`.
