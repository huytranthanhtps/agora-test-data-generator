# Home-Screen Shortcut Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mobile-only "Add to Home Screen" feature — a real one-tap install on Android/Chrome and a platform-aware guide everywhere else.

**Architecture:** Turn the site into a minimal installable PWA (manifest + passthrough service worker + icons). A mobile-only button in `TopNav` opens `AddToHomeDialog`, which branches on detected platform: Android with a captured `beforeinstallprompt` shows a native install button; iOS and everything else show manual steps. No `src/core/*` code is touched.

**Tech Stack:** Vite 8, React 19, TypeScript (strict), Tailwind 3, Vitest 4 + jsdom + @testing-library/react, lucide-react icons.

## Global Constraints

- Vite `base` / PWA scope + start_url = `/agora-test-data-generator/` (verbatim).
- Randomness/invariants: this feature must **not** touch `src/core/*`; the seeded-reproducibility and no-duplicate invariants stay structurally intact.
- TypeScript is `strict` with `noUnusedLocals` + `noUnusedParameters` — no unused imports/vars/params (they fail the build). Use `import type { … }` for type-only imports.
- Path alias `@/*` → `src/*` for cross-directory imports; relative within a folder.
- No `console.log` in committed code.
- Tailwind only, existing indigo/slate token palette (`bg-canvas`, `text-ink`, `text-muted`, `border-line`, `bg-accent`, `bg-surface`, …) — no new design language. Mirror `src/components/HtmlPreviewDialog.tsx` for the dialog shell.
- Git: work stays on branch `feat/home-screen-shortcut`; commit per task; **never** push without explicit approval (pushing `main` deploys to GitHub Pages).
- Chat is Vietnamese; all code, comments, commits are English. **User-facing dialog copy is Vietnamese** (the app's mobile hint copy is already localized in-context; match the tone of `src/App.tsx`).

---

### Task 1: Platform detection (`src/lib/platform.ts`)

Pure helpers — no React, no side effects beyond reading `window` in `isStandalone`.

**Files:**
- Create: `src/lib/platform.ts`
- Test: `src/lib/__tests__/platform.test.ts`

**Interfaces:**
- Produces:
  - `type Platform = 'ios' | 'android' | 'other'`
  - `detectPlatform(ua: string): Platform`
  - `isStandalone(): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/__tests__/platform.test.ts
import { describe, it, expect, afterEach, vi } from 'vitest'
import { detectPlatform, isStandalone } from '@/lib/platform'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

describe('detectPlatform', () => {
  it('detects iOS (iPhone and iPad)', () => {
    expect(detectPlatform(IPHONE)).toBe('ios')
    expect(detectPlatform(IPAD)).toBe('ios')
  })
  it('detects Android', () => {
    expect(detectPlatform(ANDROID)).toBe('android')
  })
  it('falls back to other for desktop', () => {
    expect(detectPlatform(DESKTOP)).toBe('other')
  })
})

describe('isStandalone', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('is true when display-mode standalone matches', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('standalone') }))
    expect(isStandalone()).toBe(true)
  })
  it('is false in a normal browser tab', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isStandalone()).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/platform.test.ts`
Expected: FAIL — cannot resolve `@/lib/platform`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/platform.ts
export type Platform = 'ios' | 'android' | 'other'

// UA-only detection. Note: iPadOS 13+ can masquerade as desktop Safari; such
// iPads fall through to 'other' and get the generic guide (acceptable — the
// generic guide still explains the Share → Add to Home Screen flow).
export function detectPlatform(ua: string): Platform {
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'other'
}

// Reads runtime display mode. iOS Safari exposes the legacy navigator.standalone.
export function isStandalone(): boolean {
  const mm = typeof window !== 'undefined' ? window.matchMedia : undefined
  if (mm?.('(display-mode: standalone)').matches) return true
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/platform.test.ts`
Expected: PASS (5 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/platform.ts src/lib/__tests__/platform.test.ts
git commit -m "feat: add platform detection helpers for home-screen shortcut"
```

---

### Task 2: Install-prompt hook (`src/hooks/use-install-prompt.ts`)

Captures the Android `beforeinstallprompt` event and exposes an install trigger.

**Files:**
- Create: `src/hooks/use-install-prompt.ts`
- Test: `src/hooks/__tests__/use-install-prompt.test.ts`

**Interfaces:**
- Produces:
  - `interface BeforeInstallPromptEvent extends Event { prompt(): Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }`
  - `useInstallPrompt(): { canInstall: boolean; promptInstall: () => void }`

- [ ] **Step 1: Write the failing test**

```ts
// src/hooks/__tests__/use-install-prompt.test.ts
import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

function fireBeforeInstallPrompt() {
  const prompt = vi.fn().mockResolvedValue(undefined)
  const evt = Object.assign(new Event('beforeinstallprompt'), {
    prompt,
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  })
  act(() => {
    window.dispatchEvent(evt)
  })
  return prompt
}

describe('useInstallPrompt', () => {
  it('starts with canInstall false', () => {
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.canInstall).toBe(false)
  })

  it('captures beforeinstallprompt and can install', () => {
    const { result } = renderHook(() => useInstallPrompt())
    const prompt = fireBeforeInstallPrompt()
    expect(result.current.canInstall).toBe(true)
    act(() => result.current.promptInstall())
    expect(prompt).toHaveBeenCalledTimes(1)
  })

  it('clears canInstall after appinstalled', () => {
    const { result } = renderHook(() => useInstallPrompt())
    fireBeforeInstallPrompt()
    expect(result.current.canInstall).toBe(true)
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(result.current.canInstall).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/hooks/__tests__/use-install-prompt.test.ts`
Expected: FAIL — cannot resolve `@/hooks/use-install-prompt`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/hooks/use-install-prompt.ts
import { useCallback, useEffect, useRef, useState } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt(): { canInstall: boolean; promptInstall: () => void } {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault() // stop Chrome's default mini-infobar; we drive the UI
      deferred.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    const onInstalled = () => {
      deferred.current = null
      setCanInstall(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(() => {
    const evt = deferred.current
    if (!evt) return
    void evt.prompt()
    deferred.current = null
    setCanInstall(false)
  }, [])

  return { canInstall, promptInstall }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/hooks/__tests__/use-install-prompt.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-install-prompt.ts src/hooks/__tests__/use-install-prompt.test.ts
git commit -m "feat: add useInstallPrompt hook capturing beforeinstallprompt"
```

---

### Task 3: The dialog (`src/components/AddToHomeDialog.tsx`)

Platform-aware presentational dialog. Mirrors `HtmlPreviewDialog` (overlay + Escape + centered panel).

**Files:**
- Create: `src/components/AddToHomeDialog.tsx`
- Test: `src/components/__tests__/AddToHomeDialog.test.tsx`
- Reference (read first): `src/components/HtmlPreviewDialog.tsx`

**Interfaces:**
- Consumes: `Platform` from `@/lib/platform`.
- Produces:
  - `interface AddToHomeDialogProps { open: boolean; onClose: () => void; platform: Platform; canInstall: boolean; onInstall: () => void }`
  - `function AddToHomeDialog(props: AddToHomeDialogProps): JSX.Element | null`

- [ ] **Step 1: Read the reference dialog**

Run: open `src/components/HtmlPreviewDialog.tsx` and copy its overlay/Escape/close structure and Tailwind tokens.

- [ ] **Step 2: Write the failing test**

```tsx
// src/components/__tests__/AddToHomeDialog.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddToHomeDialog } from '@/components/AddToHomeDialog'

const base = { open: true, onClose: () => {}, canInstall: false, onInstall: () => {} }

describe('AddToHomeDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AddToHomeDialog {...base} open={false} platform="android" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the native install button on Android when installable', () => {
    const onInstall = vi.fn()
    render(<AddToHomeDialog {...base} platform="android" canInstall onInstall={onInstall} />)
    const btn = screen.getByRole('button', { name: /cài đặt ngay/i })
    fireEvent.click(btn)
    expect(onInstall).toHaveBeenCalledTimes(1)
  })

  it('shows the iOS Share guide on iOS (no install button)', () => {
    render(<AddToHomeDialog {...base} platform="ios" />)
    expect(screen.getByText(/màn hình chính/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /cài đặt ngay/i })).toBeNull()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<AddToHomeDialog {...base} platform="other" onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/AddToHomeDialog.test.tsx`
Expected: FAIL — cannot resolve `@/components/AddToHomeDialog`.

- [ ] **Step 4: Write minimal implementation**

```tsx
// src/components/AddToHomeDialog.tsx
import { useEffect } from 'react'
import type { Platform } from '@/lib/platform'
import { Share, Plus, MoreVertical, X } from 'lucide-react'

export interface AddToHomeDialogProps {
  open: boolean
  onClose: () => void
  platform: Platform
  canInstall: boolean
  onInstall: () => void
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[14px] text-muted">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accentSoft font-mono text-[11px] text-accent">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  )
}

export function AddToHomeDialog({ open, onClose, platform, canInstall, onInstall }: AddToHomeDialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Thêm vào màn hình chính"
        className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-line bg-surface p-5 shadow-pop"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[16px] font-semibold text-ink">Thêm vào màn hình chính</h2>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted hover:bg-surface2 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        {canInstall && platform === 'android' ? (
          <>
            <p className="mb-4 text-[14px] text-muted">
              Cài Agora như một ứng dụng để mở nhanh từ màn hình chính.
            </p>
            <button
              onClick={onInstall}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-[15px] font-medium text-white"
            >
              <Plus size={17} /> Cài đặt ngay
            </button>
          </>
        ) : platform === 'ios' ? (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Nhấn nút <b className="text-ink">Chia sẻ</b>{' '}
              <Share size={14} className="inline align-text-bottom" /> trên thanh Safari.
            </Step>
            <Step n={2}>
              Chọn <b className="text-ink">Thêm vào MH chính</b> (Add to Home Screen).
            </Step>
            <Step n={3}>
              Nhấn <b className="text-ink">Thêm</b> để tạo shortcut Agora trên màn hình chính.
            </Step>
          </ol>
        ) : platform === 'android' ? (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Mở menu <MoreVertical size={14} className="inline align-text-bottom" /> của trình duyệt.
            </Step>
            <Step n={2}>
              Chọn <b className="text-ink">Thêm vào Màn hình chính</b> (Add to Home screen).
            </Step>
            <Step n={3}>
              Xác nhận <b className="text-ink">Thêm</b> để tạo shortcut.
            </Step>
          </ol>
        ) : (
          <ol className="flex flex-col gap-3">
            <Step n={1}>
              Mở menu trình duyệt trên điện thoại (biểu tượng{' '}
              <MoreVertical size={14} className="inline align-text-bottom" /> hoặc{' '}
              <Share size={14} className="inline align-text-bottom" />).
            </Step>
            <Step n={2}>
              Chọn <b className="text-ink">Thêm vào Màn hình chính</b> / Add to Home Screen.
            </Step>
          </ol>
        )}
      </div>
    </>
  )
}
```

> Note: verify the lucide-react icon names (`Share`, `Plus`, `MoreVertical`, `X`) resolve — the repo pins `lucide-react@^1.29.0`. If an icon name differs, swap for the nearest available (grep existing imports in `src/components`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/AddToHomeDialog.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/components/AddToHomeDialog.tsx src/components/__tests__/AddToHomeDialog.test.tsx
git commit -m "feat: add platform-aware AddToHomeDialog"
```

---

### Task 4: PWA assets — manifest, service worker, icons

Add the installability payload. Icons are rasterized from a committed master SVG via macOS `qlmanage` + `sips` (verified available on the dev machine; PNGs are committed so CI needs no tooling).

**Files:**
- Create: `public/icon.svg` (master)
- Create (generated, binary): `public/icon-192.png`, `public/icon-512.png`, `public/icon-512-maskable.png`, `public/apple-touch-icon.png`
- Create: `public/manifest.webmanifest`
- Create: `public/sw.js`
- Test: `src/__tests__/manifest.test.ts`

**Interfaces:**
- Produces: `public/manifest.webmanifest` (consumed by `index.html` in Task 5), `public/sw.js` (registered in Task 5), icon files referenced by both.

- [ ] **Step 1: Write the master SVG** (icon Concept C — approved)

```xml
<!-- public/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366F1"/>
      <stop offset="1" stop-color="#4338CA"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <path d="M176 352 L256 168 L336 352" fill="none" stroke="#fff" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M208 300 L304 300" fill="none" stroke="#fff" stroke-width="36" stroke-linecap="round"/>
  <circle cx="360" cy="344" r="24" fill="#A5B4FC"/>
</svg>
```

- [ ] **Step 2: Generate the PNGs**

```bash
qlmanage -t -s 512 -o public public/icon.svg >/dev/null 2>&1
mv public/icon.svg.png public/icon-512.png
cp public/icon-512.png public/icon-512-maskable.png
sips -z 192 192 public/icon-512.png --out public/icon-192.png >/dev/null
sips -z 180 180 public/icon-512.png --out public/apple-touch-icon.png >/dev/null
sips -g pixelWidth -g pixelHeight public/icon-192.png public/icon-512.png public/apple-touch-icon.png
```
Expected: `icon-192.png` 192×192, `icon-512.png` 512×512, `apple-touch-icon.png` 180×180.

- [ ] **Step 3: Write the manifest**

```json
// public/manifest.webmanifest
{
  "name": "Agora Test Data Studio",
  "short_name": "Agora",
  "description": "Generate realistic, non-duplicating dummy data for testing Agora forms.",
  "start_url": "/agora-test-data-generator/",
  "scope": "/agora-test-data-generator/",
  "display": "standalone",
  "background_color": "#0f1116",
  "theme_color": "#0f1116",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```
> Icon `src` values are relative, so they resolve against the manifest's own URL (served under the Vite base) — no hard-coded base path needed.

- [ ] **Step 4: Write the passthrough service worker**

```js
// public/sw.js
// Minimal SW: exists only to satisfy Android PWA installability.
// Passthrough fetch, no caching — the site redeploys on every main push, so
// caching here would risk serving stale production assets.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
```

- [ ] **Step 5: Write a manifest sanity test**

```ts
// src/__tests__/manifest.test.ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../public/manifest.webmanifest', import.meta.url)), 'utf8'),
)

describe('web app manifest', () => {
  it('scope and start_url match the Vite base', () => {
    expect(manifest.start_url).toBe('/agora-test-data-generator/')
    expect(manifest.scope).toBe('/agora-test-data-generator/')
  })
  it('is installable: standalone + 192 and 512 icons', () => {
    expect(manifest.display).toBe('standalone')
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })
  it('has a maskable icon', () => {
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose?.includes('maskable'))).toBe(true)
  })
})
```

- [ ] **Step 6: Run the test**

Run: `npx vitest run src/__tests__/manifest.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add public/icon.svg public/icon-192.png public/icon-512.png public/icon-512-maskable.png public/apple-touch-icon.png public/manifest.webmanifest public/sw.js src/__tests__/manifest.test.ts
git commit -m "feat: add PWA manifest, service worker, and app icons"
```

---

### Task 5: Wire it up — index.html, service-worker registration, TopNav button, App state

Connect the pieces so the mobile button opens the dialog and Android captures the install prompt.

**Files:**
- Modify: `index.html` (head links + meta)
- Modify: `src/main.tsx` (register SW in production)
- Modify: `src/components/TopNav.tsx` (mobile-only button + props)
- Modify: `src/App.tsx` (own dialog state, platform, install prompt)
- Test: `src/components/__tests__/TopNav.test.tsx`

**Interfaces:**
- Consumes: `useInstallPrompt` (Task 2), `detectPlatform` + `isStandalone` (Task 1), `AddToHomeDialog` (Task 3).
- `TopNav` gains props: `showAddToHome: boolean`, `onOpenAddToHome: () => void` (added alongside existing `active`, `onSelect`, `theme`, `onToggleTheme`).

- [ ] **Step 1: Add head links to `index.html`**

Insert inside `<head>` (after the existing `<title>`):

```html
    <link rel="manifest" href="%BASE_URL%manifest.webmanifest" />
    <link rel="apple-touch-icon" href="%BASE_URL%apple-touch-icon.png" />
    <meta name="theme-color" content="#0f1116" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Agora" />
```
> `%BASE_URL%` is Vite's index.html placeholder; it resolves to `/agora-test-data-generator/` in the build and `/` in dev.

- [ ] **Step 2: Register the service worker in `src/main.tsx` (production only)**

Add after the existing `createRoot(...).render(...)` call:

```ts
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {
        // Registration failure only means no one-tap install; the guide still works.
      })
  })
}
```

- [ ] **Step 3: Write the failing TopNav test**

```tsx
// src/components/__tests__/TopNav.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopNav } from '@/components/TopNav'

const base = {
  active: 'parent',
  onSelect: () => {},
  theme: 'dark' as const,
  onToggleTheme: () => {},
}

describe('TopNav add-to-home button', () => {
  it('renders the button and fires onOpenAddToHome when shown', () => {
    const onOpen = vi.fn()
    render(<TopNav {...base} showAddToHome onOpenAddToHome={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /màn hình chính/i }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('hides the button when showAddToHome is false', () => {
    render(<TopNav {...base} showAddToHome={false} onOpenAddToHome={() => {}} />)
    expect(screen.queryByRole('button', { name: /màn hình chính/i })).toBeNull()
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npx vitest run src/components/__tests__/TopNav.test.tsx`
Expected: FAIL — `TopNav` has no `showAddToHome` / `onOpenAddToHome` props; button absent.

- [ ] **Step 5: Add the button + props to `TopNav.tsx`**

Extend `Props`:

```tsx
interface Props {
  active: string
  onSelect: (key: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  showAddToHome: boolean
  onOpenAddToHome: () => void
}
```

Add `Smartphone` to the lucide import, destructure the new props, and place the button immediately before the theme-toggle button (mobile-only via `sm:hidden`):

```tsx
import { Check, ChevronDown, Moon, Smartphone, Sun } from 'lucide-react'
// …
export function TopNav({ active, onSelect, theme, onToggleTheme, showAddToHome, onOpenAddToHome }: Props) {
// …
        {showAddToHome && (
          <button
            onClick={onOpenAddToHome}
            aria-label="Thêm vào màn hình chính"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-lineStrong hover:text-ink sm:hidden"
          >
            <Smartphone size={15} />
          </button>
        )}
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-lineStrong hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
```
> Verify `Smartphone` exists in `lucide-react@^1.29.0`; if not, use `Download` or `PlusSquare`.

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/components/__tests__/TopNav.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 7: Wire `App.tsx`**

Add imports:

```tsx
import { detectPlatform, isStandalone } from '@/lib/platform'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { AddToHomeDialog } from '@/components/AddToHomeDialog'
```

Inside `App()`, add state/derived values near the other hooks:

```tsx
  const { canInstall, promptInstall } = useInstallPrompt()
  const [addOpen, setAddOpen] = useState(false)
  const [platform] = useState(() => detectPlatform(navigator.userAgent))
  const [standalone] = useState(() => isStandalone())
```

Pass the new props to `TopNav`:

```tsx
      <TopNav
        active={g.entityKey}
        onSelect={g.selectEntity}
        theme={theme}
        onToggleTheme={toggle}
        showAddToHome={!standalone}
        onOpenAddToHome={() => setAddOpen(true)}
      />
```

Render the dialog next to `HtmlPreviewDialog` at the end of the tree:

```tsx
      <AddToHomeDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        platform={platform}
        canInstall={canInstall}
        onInstall={() => {
          promptInstall()
          setAddOpen(false)
        }}
      />
```

- [ ] **Step 8: Full verification**

Run: `npm test` — expected: all suites green (existing + new).
Run: `npm run build` — expected: `tsc -b` clean, Vite build succeeds, `dist/manifest.webmanifest`, `dist/sw.js`, and the icons present under `dist/`.

- [ ] **Step 9: Commit**

```bash
git add index.html src/main.tsx src/components/TopNav.tsx src/components/__tests__/TopNav.test.tsx src/App.tsx
git commit -m "feat: wire home-screen shortcut button, dialog, and PWA registration"
```

---

## Manual verification (Phase 6 gate — after Task 5)

1. `npm run build && npm run preview`, open the preview URL on a phone (or Chrome DevTools device mode).
2. **Android/Chrome:** with the SW registered, the ⋮ menu offers "Install"; the in-app button shows "Cài đặt ngay" once `beforeinstallprompt` fires → tapping it opens the native prompt.
3. **iOS/Safari:** the button opens the dialog showing the Share → Add to Home Screen steps.
4. **Desktop:** the button is hidden (`sm:hidden`).
5. **Invariants:** run a generation with a fixed seed twice → identical batch; confirm no duplicate names in a batch. (Structurally guaranteed — `src/core/*` untouched — but confirm the generator suite is green.)

## Self-Review notes

- **Spec coverage:** platform detection (Task 1) ✔; install hook (Task 2) ✔; dialog with 4 platform branches (Task 3) ✔; manifest + SW + icons incl. maskable + apple-touch (Task 4) ✔; index.html metas incl. both capable metas + SW registration prod-only + mobile-only button hidden-when-standalone (Task 5) ✔; testing across lib/hook/component/manifest ✔; invariants untouched ✔.
- **Type consistency:** `Platform`, `detectPlatform`, `isStandalone`, `useInstallPrompt`, `AddToHomeDialogProps`, and the two new `TopNav` props are used with identical names/signatures across tasks.
- **Placeholders:** none — every code/test/command block is concrete.
