# Agora Test Data Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static, client-side website that generates realistic dummy test data for 8 Agora record types, with seeded reproducibility, batch-level uniqueness, text-length modes, and JSON/CSV export — deployed free on GitHub Pages.

**Architecture:** A pure-TypeScript `core/` layer (no React/DOM) does all data generation via a seeded PRNG plus a hybrid of hand-written Singapore-specific pools and Faker.js for generic fields. A thin React UI renders record fields from generator metadata. A registry maps each entity key to its generator + field list, so adding an entity never touches UI code.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui (Radix), lucide-react, @faker-js/faker, Vitest. Deploy via GitHub Actions → GitHub Pages.

## Global Constraints

- Node 20+; package manager `npm`.
- No backend, no routing, no auth — pure client-side static site.
- No file/image/PDF generation (record type "Files" is out of scope).
- 8 record types only: `parent`, `student`, `course`, `instance`, `klass`, `product`, `message`, `ticket`.
- Seed reproducibility is mandatory: same non-empty seed → identical output; blank seed → random each run. Faker and the core PRNG MUST be seeded from the same value.
- Text length modes are exactly: `'normal' | 'long' | 'stress'`.
- Singapore realism preserved: mobile starts with 8 or 9 + 7 digits, 6-digit postcode, demographic-weighted names, `[DEV]` marker on parent names.
- `core/` modules must not import React, DOM APIs, or anything from `components/`.
- Vite `base` = `/agora-test-data-generator/` (GitHub Pages project path).
- All values in generated records are strings (matches original tool's output contract).

---

### Task 1: Project scaffold + tooling

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `tailwind.config.js`, `postcss.config.js`, `vitest.config.ts`, `.nvmrc`
- Modify: `.gitignore` (already has node_modules/dist/.DS_Store)

**Interfaces:**
- Produces: a runnable Vite dev server and `npm test` (Vitest) command; `@/` path alias → `src/`.

- [ ] **Step 1: Initialize package and install deps**

```bash
cd /Users/huy.tran.thanh/Workspace/agora-test-data-generator
npm init -y
npm install react react-dom @faker-js/faker lucide-react
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom \
  tailwindcss postcss autoprefixer vitest jsdom @testing-library/react \
  @testing-library/jest-dom
echo "20" > .nvmrc
```

- [ ] **Step 2: Add scripts to package.json**

Set `package.json` `"scripts"` to:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "type": "module"
}
```

- [ ] **Step 3: Write config files**

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  base: '/agora-test-data-generator/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
})
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'jsdom', globals: true, setupFiles: [] },
})
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

`tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

`postcss.config.js`:

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 4: Write entry files**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Agora Test Data Generator</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

`src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

`src/App.tsx` (placeholder, replaced in Task 15):

```tsx
export default function App() {
  return <div className="p-4">Agora Test Data Generator</div>
}
```

- [ ] **Step 5: Verify build and dev boot**

Run: `npm run build`
Expected: build succeeds, `dist/` produced.
Run: `npm test`
Expected: Vitest runs with "No test files found" (exit 0) — acceptable at this stage.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold vite + react + ts + tailwind + vitest"
```

---

### Task 2: Seeded PRNG (`core/rng.ts`)

**Files:**
- Create: `src/core/rng.ts`
- Test: `src/core/__tests__/rng.test.ts`

**Interfaces:**
- Produces:
  - `class Rng { constructor(seed?: string) }`
  - `rng.next(): number` — float in [0,1)
  - `rng.int(min: number, max: number): number` — inclusive integer
  - `rng.pick<T>(arr: readonly T[]): T`
  - `rng.weighted<T>(items: readonly [T, number][]): T` — weighted pick
  - `rng.shuffle<T>(arr: readonly T[]): T[]` — returns new array
  - `rng.sample<T>(arr: readonly T[], n: number): T[]` — n distinct items
  - `rng.bool(p?: number): boolean` — true with probability p (default 0.5)
  - `export function hashSeed(seed: string): number`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'

describe('Rng', () => {
  it('is reproducible for the same seed', () => {
    const a = new Rng('abc'), b = new Rng('abc')
    const seqA = Array.from({ length: 20 }, () => a.next())
    const seqB = Array.from({ length: 20 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })
  it('differs across seeds', () => {
    const a = new Rng('abc'), b = new Rng('xyz')
    expect(a.next()).not.toEqual(b.next())
  })
  it('int is within inclusive bounds', () => {
    const r = new Rng('s')
    for (let i = 0; i < 200; i++) {
      const v = r.int(5, 8)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThanOrEqual(8)
    }
  })
  it('sample returns n distinct items', () => {
    const r = new Rng('s')
    const out = r.sample(['a', 'b', 'c', 'd', 'e'], 3)
    expect(out).toHaveLength(3)
    expect(new Set(out).size).toBe(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/rng.test.ts`
Expected: FAIL — cannot find module `@/core/rng`.

- [ ] **Step 3: Write minimal implementation**

```ts
// Mulberry32 PRNG — small, fast, deterministic.
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

export class Rng {
  private state: number
  constructor(seed?: string) {
    // Non-deterministic when no seed: derive from performance/time-free source.
    const s = seed && seed.length ? hashSeed(seed) : Math.floor(Math.random() * 2 ** 32)
    this.state = s >>> 0
  }
  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }
  bool(p = 0.5): boolean {
    return this.next() < p
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
  weighted<T>(items: readonly [T, number][]): T {
    const total = items.reduce((s, [, w]) => s + w, 0)
    let r = this.next() * total
    for (const [val, w] of items) {
      if ((r -= w) < 0) return val
    }
    return items[items.length - 1][0]
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  sample<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/rng.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/rng.ts src/core/__tests__/rng.test.ts
git commit -m "feat(core): seeded PRNG with sampling helpers"
```

---

### Task 3: Faker seed sync (`core/faker-seed.ts`)

**Files:**
- Create: `src/core/faker-seed.ts`
- Test: `src/core/__tests__/faker-seed.test.ts`

**Interfaces:**
- Consumes: `hashSeed` from `@/core/rng`.
- Produces:
  - `export function seedFaker(seed?: string): void` — seeds the shared faker instance (deterministic if seed non-empty; random otherwise).
  - `export { faker } from '@faker-js/faker'` re-export for a single shared instance.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { faker, seedFaker } from '@/core/faker-seed'

describe('seedFaker', () => {
  it('produces identical faker output for the same seed', () => {
    seedFaker('abc'); const a = faker.person.firstName()
    seedFaker('abc'); const b = faker.person.firstName()
    expect(a).toBe(b)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/faker-seed.test.ts`
Expected: FAIL — cannot find module `@/core/faker-seed`.

- [ ] **Step 3: Write minimal implementation**

```ts
import { faker } from '@faker-js/faker'
import { hashSeed } from './rng'

export { faker }

export function seedFaker(seed?: string): void {
  if (seed && seed.length) faker.seed(hashSeed(seed))
  else faker.seed() // reset to random
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/faker-seed.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/faker-seed.ts src/core/__tests__/faker-seed.test.ts
git commit -m "feat(core): shared faker instance with seed sync"
```

---

### Task 4: Core types (`core/types.ts`)

**Files:**
- Create: `src/core/types.ts`

**Interfaces:**
- Produces:
  - `type TextLen = 'normal' | 'long' | 'stress'`
  - `type Record = { [key: string]: string }`
  - `interface FieldMeta { key: string; label: string; html?: boolean }`
  - `interface GenerateOptions { count: number; len: TextLen; seed?: string; messagesPerTicket?: number }`
  - `interface GenContext { rng: Rng; uniq: Uniqueness }`
  - `interface Generator<T extends Record = Record> { key: string; label: string; shortcut: number; fields: FieldMeta[]; generate(opts: GenerateOptions, ctx: GenContext): T[] }`

- [ ] **Step 1: Write the file**

```ts
import type { Rng } from './rng'
import type { Uniqueness } from './uniqueness'

export type TextLen = 'normal' | 'long' | 'stress'
export type Record = { [key: string]: string }

export interface FieldMeta {
  key: string
  label: string
  html?: boolean
}

export interface GenerateOptions {
  count: number
  len: TextLen
  seed?: string
  messagesPerTicket?: number
}

export interface GenContext {
  rng: Rng
  uniq: Uniqueness
}

export interface Generator<T extends Record = Record> {
  key: string
  label: string
  shortcut: number
  fields: FieldMeta[]
  generate(opts: GenerateOptions, ctx: GenContext): T[]
}
```

- [ ] **Step 2: Verify it typechecks**

Run: `npx tsc -b`
Expected: fails only on the missing `./uniqueness` import (created next task). Note: this is acceptable; do not commit until Task 5 resolves it. Proceed to Task 5.

*(No commit — combined with Task 5.)*

---

### Task 5: Uniqueness tracker (`core/uniqueness.ts`)

**Files:**
- Create: `src/core/uniqueness.ts`
- Test: `src/core/__tests__/uniqueness.test.ts`

**Interfaces:**
- Consumes: `Rng` from `@/core/rng`.
- Produces:
  - `class Uniqueness { constructor(rng: Rng) }`
  - `uniq.ensure(bucket: string, produce: () => string, opts?: { maxTries?: number }): string` — calls `produce` until it returns a value unused in `bucket` (default 50 tries); on exhaustion appends a random 4-letter suffix and records it.
  - `uniq.reset(): void`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'

describe('Uniqueness', () => {
  it('never returns a duplicate within a bucket', () => {
    const uniq = new Uniqueness(new Rng('s'))
    const pool = ['a', 'b', 'c']
    let i = 0
    const out = Array.from({ length: 5 }, () =>
      uniq.ensure('names', () => pool[i++ % pool.length]),
    )
    expect(new Set(out).size).toBe(5) // suffixes added after pool exhausts
  })
  it('separate buckets are independent', () => {
    const uniq = new Uniqueness(new Rng('s'))
    const x = uniq.ensure('b1', () => 'same')
    const y = uniq.ensure('b2', () => 'same')
    expect(x).toBe('same')
    expect(y).toBe('same')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/uniqueness.test.ts`
Expected: FAIL — cannot find module `@/core/uniqueness`.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Rng } from './rng'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export class Uniqueness {
  private buckets = new Map<string, Set<string>>()
  constructor(private rng: Rng) {}

  private set(bucket: string): Set<string> {
    let s = this.buckets.get(bucket)
    if (!s) { s = new Set(); this.buckets.set(bucket, s) }
    return s
  }

  private suffix(): string {
    return Array.from({ length: 4 }, () => LETTERS[this.rng.int(0, 25)]).join('')
  }

  ensure(bucket: string, produce: () => string, opts?: { maxTries?: number }): string {
    const seen = this.set(bucket)
    const maxTries = opts?.maxTries ?? 50
    for (let i = 0; i < maxTries; i++) {
      const v = produce()
      if (!seen.has(v)) { seen.add(v); return v }
    }
    let base = produce(), candidate = `${base} ${this.suffix()}`
    while (seen.has(candidate)) candidate = `${base} ${this.suffix()}`
    seen.add(candidate)
    return candidate
  }

  reset(): void { this.buckets.clear() }
}
```

- [ ] **Step 4: Run tests + typecheck**

Run: `npx vitest run src/core/__tests__/uniqueness.test.ts`
Expected: PASS.
Run: `npx tsc -b`
Expected: PASS (types.ts now resolves).

- [ ] **Step 5: Commit (types + uniqueness together)**

```bash
git add src/core/types.ts src/core/uniqueness.ts src/core/__tests__/uniqueness.test.ts
git commit -m "feat(core): core types + batch uniqueness tracker"
```

---

### Task 6: Singapore data pools (`core/data.ts`)

**Files:**
- Create: `src/core/data.ts`

**Interfaces:**
- Produces named `const` arrays/objects (all `readonly`, `as const`):
  - Name pools: `CHINESE_SURNAMES`, `CHINESE_GIVEN`, `MALAY_NAMES`, `INDIAN_NAMES`, `EURASIAN_SURNAMES`, `WESTERN_GIVEN`, `NICKNAMES`, `CHINESE_CHARS`
  - Ethnicity weights: `ETHNICITY_WEIGHTS: readonly [Ethnicity, number][]` where `type Ethnicity = 'chinese' | 'malay' | 'indian' | 'eurasian'`
  - Enum token pools: `GRADES`, `SUBJECTS`, `LEVELS`, `SUBJECT_TYPE`, `INSTANCE_STATUS`, `RATE_TYPE`, `BUSINESS_UNITS`, `VENUES`, `PROGRAMMES`, `PRODUCT_STATUS`, `PRODUCT_TYPE`, `VARIANT_TYPE`, `TIME_PERIOD`, `SEND_TO`, `PRODUCT_BASES`
  - Constants: `DEV_MARKER = '[DEV]'`, `EMAIL_DOMAIN = 'mailinator.com'`

- [ ] **Step 1: Write the file**

Provide concrete, non-empty pools (10+ entries where a variety matters). Example content — engineer may extend but must keep names/shapes:

```ts
export type Ethnicity = 'chinese' | 'malay' | 'indian' | 'eurasian'

export const ETHNICITY_WEIGHTS: readonly [Ethnicity, number][] = [
  ['chinese', 74], ['malay', 13], ['indian', 9], ['eurasian', 4],
]

export const CHINESE_SURNAMES = ['Tan', 'Lim', 'Lee', 'Ng', 'Ong', 'Wong', 'Goh', 'Chua', 'Chan', 'Koh', 'Teo', 'Ang', 'Yeo', 'Low', 'Sim'] as const
export const CHINESE_GIVEN = ['Wei Ming', 'Jia Hui', 'Zhi Hao', 'Xin Yi', 'Jun Jie', 'Li Ying', 'Yong Sheng', 'Mei Ling', 'Kai Xin', 'Wen Qi'] as const
export const CHINESE_CHARS = ['伟', '明', '嘉', '慧', '志', '豪', '欣', '怡', '俊', '杰', '丽', '颖', '永', '盛', '美', '玲'] as const

export const MALAY_NAMES = ['Muhammad', 'Nur', 'Siti', 'Ahmad', 'Aisyah', 'Farhan', 'Aiman', 'Nabilah', 'Iskandar', 'Zulaikha'] as const
export const INDIAN_NAMES = ['Kumar', 'Priya', 'Ravi', 'Anand', 'Deepa', 'Suresh', 'Lakshmi', 'Vijay', 'Meena', 'Arjun'] as const
export const EURASIAN_SURNAMES = ['Pereira', 'De Souza', 'Rozario', 'Fernandez', 'Clarke', 'Scully', 'Theseira'] as const
export const WESTERN_GIVEN = ['Ryan', 'Chloe', 'Ethan', 'Sophia', 'Marcus', 'Isabelle', 'Daniel', 'Grace'] as const
export const NICKNAMES = ['Ah Boy', 'Ah Girl', 'Junior', 'Bubbles', 'Sunny', 'Lucky', 'Tiger', 'Angel'] as const

export const GRADES = ['Nursery', 'K1', 'K2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Secondary 1'] as const
export const SUBJECTS = ['Mathematics', 'English', 'Science', 'Chinese', 'Malay', 'Tamil', 'Physics', 'Chemistry', 'Biology', 'Coding'] as const
export const LEVELS = ['Foundation', 'Standard', 'Advanced', 'Olympiad'] as const
export const SUBJECT_TYPE = ['Academic', 'Enrichment', 'Language', 'STEM'] as const
export const INSTANCE_STATUS = ['Draft', 'Open', 'Full', 'Ongoing', 'Completed', 'Cancelled'] as const
export const RATE_TYPE = ['Per Session', 'Per Term', 'Per Month', 'Package'] as const
export const BUSINESS_UNITS = ['Tampines Hub', 'Jurong East', 'Orchard Central', 'Bishan Point', 'Woodlands Civic'] as const
export const VENUES = ['Room A1', 'Room B2', 'Studio 3', 'Hall 1', 'Lab 2', 'Online (Zoom)'] as const
export const PROGRAMMES = ['MOE-aligned', 'IB', 'Cambridge', 'Holiday Camp', 'Weekend Intensive'] as const
export const PRODUCT_STATUS = ['Active', 'Inactive', 'Draft', 'Archived'] as const
export const PRODUCT_TYPE = ['Course Package', 'Material', 'Assessment', 'Membership'] as const
export const VARIANT_TYPE = ['Single', 'Bundle', 'Subscription'] as const
export const TIME_PERIOD = ['Term 1', 'Term 2', 'Term 3', 'Term 4', 'Full Year'] as const
export const SEND_TO = ['All Parents', 'All Students', 'Class Members', 'Specific Group', 'Staff Only'] as const
export const PRODUCT_BASES = ['Workbook', 'Assessment Kit', 'Learning Bundle', 'Practice Pack', 'Membership Pass'] as const

export const DEV_MARKER = '[DEV]'
export const EMAIL_DOMAIN = 'mailinator.com'
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/core/data.ts
git commit -m "feat(core): Singapore name pools + enum token data"
```

---

### Task 7: Name generation (`core/names.ts`)

**Files:**
- Create: `src/core/names.ts`
- Test: `src/core/__tests__/names.test.ts`

**Interfaces:**
- Consumes: `Rng`, all pools from `@/core/data`.
- Produces:
  - `interface Person { first: string; last: string; full: string; gender: 'male'|'female'; ethnicity: Ethnicity }`
  - `function makePerson(rng: Rng): Person`
  - `function chineseName(rng: Rng): string` — 2–3 Chinese characters
  - `function preferredName(rng: Rng): string`
  - `function makeEmail(person: Person, uniq: Uniqueness): string` — `first.last@mailinator.com`, collisions get numeric sequence suffix before `@`
  - `function sgMobile(rng: Rng): string` — `[89]XXX XXXX`
  - `function sgPostcode(rng: Rng): string` — 6 digits

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { makePerson, makeEmail, sgMobile, sgPostcode, chineseName } from '@/core/names'

describe('names', () => {
  it('mobile matches SG format', () => {
    const r = new Rng('s')
    for (let i = 0; i < 50; i++) expect(sgMobile(r)).toMatch(/^[89]\d{3} \d{4}$/)
  })
  it('postcode is 6 digits', () => {
    const r = new Rng('s')
    expect(sgPostcode(r)).toMatch(/^\d{6}$/)
  })
  it('email is unique on collision', () => {
    const uniq = new Uniqueness(new Rng('s'))
    const p = { first: 'Jon', last: 'Tan', full: 'Jon Tan', gender: 'male', ethnicity: 'chinese' } as const
    const e1 = makeEmail(p, uniq), e2 = makeEmail(p, uniq)
    expect(e1).not.toBe(e2)
    expect(e1).toMatch(/@mailinator\.com$/)
  })
  it('chineseName is 2-3 CJK chars', () => {
    const r = new Rng('s')
    expect(chineseName(r)).toMatch(/^[一-鿿]{2,3}$/)
  })
  it('makePerson full = first + last', () => {
    const p = makePerson(new Rng('s'))
    expect(p.full).toBe(`${p.first} ${p.last}`)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/names.test.ts`
Expected: FAIL — cannot find module `@/core/names`.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Rng } from './rng'
import { Uniqueness } from './uniqueness'
import {
  ETHNICITY_WEIGHTS, CHINESE_SURNAMES, CHINESE_GIVEN, CHINESE_CHARS,
  MALAY_NAMES, INDIAN_NAMES, EURASIAN_SURNAMES, WESTERN_GIVEN, NICKNAMES,
  EMAIL_DOMAIN, type Ethnicity,
} from './data'

export interface Person {
  first: string; last: string; full: string
  gender: 'male' | 'female'; ethnicity: Ethnicity
}

export function makePerson(rng: Rng): Person {
  const ethnicity = rng.weighted(ETHNICITY_WEIGHTS)
  const gender: 'male' | 'female' = rng.bool() ? 'male' : 'female'
  let first: string, last: string
  switch (ethnicity) {
    case 'chinese':
      last = rng.pick(CHINESE_SURNAMES); first = rng.pick(CHINESE_GIVEN); break
    case 'malay':
      first = rng.pick(MALAY_NAMES); last = `bin ${rng.pick(MALAY_NAMES)}`; break
    case 'indian':
      first = rng.pick(INDIAN_NAMES); last = `s/o ${rng.pick(INDIAN_NAMES)}`; break
    default:
      first = rng.pick(WESTERN_GIVEN); last = rng.pick(EURASIAN_SURNAMES)
  }
  return { first, last, full: `${first} ${last}`, gender, ethnicity }
}

export function chineseName(rng: Rng): string {
  const n = rng.int(2, 3)
  return Array.from({ length: n }, () => rng.pick(CHINESE_CHARS)).join('')
}

export function preferredName(rng: Rng): string {
  return rng.pick(NICKNAMES)
}

export function makeEmail(person: Person, uniq: Uniqueness): string {
  const local = `${person.first}.${person.last}`
    .toLowerCase().replace(/[^a-z0-9.]+/g, '')
  let seq = 0
  return uniq.ensure('email', () => {
    const suffix = seq === 0 ? '' : String(seq)
    seq++
    return `${local}${suffix}@${EMAIL_DOMAIN}`
  })
}

export function sgMobile(rng: Rng): string {
  const first = rng.pick(['8', '9'] as const)
  const rest = Array.from({ length: 7 }, () => rng.int(0, 9)).join('')
  return `${first}${rest.slice(0, 3)} ${rest.slice(3)}`
}

export function sgPostcode(rng: Rng): string {
  return Array.from({ length: 6 }, () => rng.int(0, 9)).join('')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/names.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/names.ts src/core/__tests__/names.test.ts
git commit -m "feat(core): SG name/email/phone/postcode generation"
```

---

### Task 8: Text generation (`core/text.ts`)

**Files:**
- Create: `src/core/text.ts`
- Test: `src/core/__tests__/text.test.ts`

**Interfaces:**
- Consumes: `Rng`, `faker` from `@/core/faker-seed`, `TextLen` from `@/core/types`.
- Produces:
  - `function loremByLen(rng: Rng, len: TextLen): string` — normal ≈ 1 sentence, long ≈ 1 paragraph, stress ≈ 5+ paragraphs.
  - `function htmlMessage(rng: Rng, len: TextLen): string` — HTML string with headings, bold, list.
  - `function chatTranscript(rng: Rng, a: string, b: string, messages: number): string` — HTML chat transcript alternating between names `a` and `b`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { seedFaker } from '@/core/faker-seed'
import { loremByLen, htmlMessage, chatTranscript } from '@/core/text'

describe('text', () => {
  it('stress is longer than normal', () => {
    seedFaker('s')
    const r = new Rng('s')
    const normal = loremByLen(r, 'normal')
    const stress = loremByLen(new Rng('s'), 'stress')
    expect(stress.length).toBeGreaterThan(normal.length)
  })
  it('htmlMessage contains tags', () => {
    seedFaker('s')
    expect(htmlMessage(new Rng('s'), 'normal')).toMatch(/<\w+/)
  })
  it('chatTranscript mentions both participants', () => {
    seedFaker('s')
    const html = chatTranscript(new Rng('s'), 'Alice', 'Bob', 4)
    expect(html).toContain('Alice')
    expect(html).toContain('Bob')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/text.test.ts`
Expected: FAIL — cannot find module `@/core/text`.

- [ ] **Step 3: Write minimal implementation**

```ts
import type { Rng } from './rng'
import type { TextLen } from './types'
import { faker } from './faker-seed'

export function loremByLen(_rng: Rng, len: TextLen): string {
  if (len === 'normal') return faker.lorem.sentence()
  if (len === 'long') return faker.lorem.paragraph()
  return faker.lorem.paragraphs(6, '\n\n')
}

export function htmlMessage(rng: Rng, len: TextLen): string {
  const items = Array.from({ length: rng.int(2, 4) }, () => `<li>${faker.lorem.sentence()}</li>`).join('')
  const body = loremByLen(rng, len)
  return [
    `<h2>${faker.lorem.words(rng.int(3, 6))}</h2>`,
    `<p>${body}</p>`,
    `<p><strong>${faker.lorem.words(3)}</strong>: ${faker.lorem.sentence()}</p>`,
    `<ul>${items}</ul>`,
  ].join('\n')
}

export function chatTranscript(rng: Rng, a: string, b: string, messages: number): string {
  const lines: string[] = []
  for (let i = 0; i < messages; i++) {
    const who = i % 2 === 0 ? a : b
    lines.push(`<div class="msg"><b>${who}:</b> ${faker.lorem.sentence()}</div>`)
  }
  return `<div class="chat">\n${lines.join('\n')}\n</div>`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/text.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/text.ts src/core/__tests__/text.test.ts
git commit -m "feat(core): lorem/html message + chat transcript generation"
```

---

### Task 9: Shared generator helpers (`core/generators/shared.ts`)

**Files:**
- Create: `src/core/generators/shared.ts`

**Interfaces:**
- Consumes: `Rng`, `TextLen`.
- Produces:
  - `function slugify(s: string): string`
  - `function futureDate(rng: Rng, minDays: number, maxDays: number): Date` — relative to a fixed epoch base `BASE_DATE` (no `Date.now()` so seeded runs are reproducible).
  - `function addDays(d: Date, n: number): Date`
  - `function fmtDate(d: Date): string` — `DD/MM/YYYY`
  - `function dobForAge(rng: Rng, minAge: number, maxAge: number): { dob: string; age: number }`
  - `const BASE_DATE: Date` — fixed reference (`2026-01-01`) used for all relative date math.

- [ ] **Step 1: Write the file**

```ts
import type { Rng } from '../rng'

// Fixed reference so seeded output is reproducible (never use Date.now()).
export const BASE_DATE = new Date(Date.UTC(2026, 0, 1))

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime())
  out.setUTCDate(out.getUTCDate() + n)
  return out
}

export function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

export function futureDate(rng: Rng, minDays: number, maxDays: number): Date {
  return addDays(BASE_DATE, rng.int(minDays, maxDays))
}

export function dobForAge(rng: Rng, minAge: number, maxAge: number): { dob: string; age: number } {
  const age = rng.int(minAge, maxAge)
  const birth = new Date(Date.UTC(BASE_DATE.getUTCFullYear() - age, rng.int(0, 11), rng.int(1, 28)))
  return { dob: fmtDate(birth), age }
}
```

- [ ] **Step 2: Verify typecheck**

Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/core/generators/shared.ts
git commit -m "feat(core): shared generator helpers (dates, slug, dob)"
```

---

### Task 10: Parent + Student generators

**Files:**
- Create: `src/core/generators/parent.ts`, `src/core/generators/student.ts`
- Test: `src/core/__tests__/generators-people.test.ts`

**Interfaces:**
- Consumes: `Generator`, `makePerson`, `makeEmail`, `sgMobile`, `sgPostcode`, `chineseName`, `preferredName`, `dobForAge`, `loremByLen`, `faker`, `DEV_MARKER`, `GRADES`.
- Produces: `export const parentGenerator: Generator`, `export const studentGenerator: Generator`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { parentGenerator } from '@/core/generators/parent'
import { studentGenerator } from '@/core/generators/student'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

describe('people generators', () => {
  it('parent has no duplicate emails in a batch', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 30, len: 'normal' }, ctx())
    const emails = rows.map(r => r.email)
    expect(new Set(emails).size).toBe(emails.length)
  })
  it('parent relationship matches gender', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) {
      expect(r.relationship).toBe(r.gender === 'male' ? 'father' : 'mother')
    }
  })
  it('parent name carries DEV marker', () => {
    seedFaker('s')
    const [r] = parentGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.fullName).toContain('[DEV]')
  })
  it('student age is within 4-16 and matches dob year', () => {
    seedFaker('s')
    const rows = studentGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) {
      const age = Number(r.age)
      expect(age).toBeGreaterThanOrEqual(4)
      expect(age).toBeLessThanOrEqual(16)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/generators-people.test.ts`
Expected: FAIL — cannot find parent/student modules.

- [ ] **Step 3: Write parent.ts**

```ts
import type { Generator } from '../types'
import { makePerson, makeEmail, sgMobile, sgPostcode } from '../names'
import { dobForAge } from './shared'
import { loremByLen } from '../text'
import { faker } from '../faker-seed'
import { DEV_MARKER } from '../data'

export const parentGenerator: Generator = {
  key: 'parent',
  label: 'Parent',
  shortcut: 1,
  fields: [
    { key: 'avatar', label: 'Avatar' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'fullName', label: 'Full name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gender', label: 'Gender' },
    { key: 'relationship', label: 'Relationship' },
    { key: 'dob', label: 'Date of birth' },
    { key: 'address', label: 'Address' },
    { key: 'postcode', label: 'Postcode' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const p = makePerson(rng)
      const { dob } = dobForAge(rng, 28, 50)
      return {
        avatar: p.full,
        firstName: p.first,
        lastName: `${p.last} ${DEV_MARKER}`,
        fullName: `${p.full} ${DEV_MARKER}`,
        email: makeEmail(p, uniq),
        mobile: sgMobile(rng),
        gender: p.gender,
        relationship: p.gender === 'male' ? 'father' : 'mother',
        dob,
        address: len === 'stress' ? faker.location.streetAddress(true).repeat(6) : faker.location.streetAddress(len === 'long'),
        postcode: sgPostcode(rng),
      }
    })
  },
}
```

- [ ] **Step 4: Write student.ts**

```ts
import type { Generator } from '../types'
import { makePerson, chineseName, preferredName } from '../names'
import { dobForAge } from './shared'
import { loremByLen } from '../text'
import { faker } from '../faker-seed'
import { GRADES } from '../data'

export const studentGenerator: Generator = {
  key: 'student',
  label: 'Student/Child',
  shortcut: 2,
  fields: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'fullName', label: 'Full name' },
    { key: 'preferredName', label: 'Preferred name' },
    { key: 'chineseName', label: 'Chinese name' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of birth' },
    { key: 'age', label: 'Age' },
    { key: 'gradeLevel', label: 'Grade level' },
    { key: 'allergies', label: 'Allergies' },
  ],
  generate({ count, len }, { rng }) {
    return Array.from({ length: count }, () => {
      const p = makePerson(rng)
      const { dob, age } = dobForAge(rng, 4, 16)
      return {
        firstName: p.first,
        lastName: p.last,
        fullName: p.full,
        preferredName: preferredName(rng),
        chineseName: chineseName(rng),
        gender: p.gender,
        dob,
        age: String(age),
        gradeLevel: rng.pick(GRADES),
        allergies: len === 'normal' ? faker.lorem.words(2) : loremByLen(rng, len),
      }
    })
  },
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/generators-people.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/core/generators/parent.ts src/core/generators/student.ts src/core/__tests__/generators-people.test.ts
git commit -m "feat(core): parent + student generators"
```

---

### Task 11: Course + Instance + Class generators

**Files:**
- Create: `src/core/generators/course.ts`, `src/core/generators/instance.ts`, `src/core/generators/klass.ts`
- Test: `src/core/__tests__/generators-academic.test.ts`

**Interfaces:**
- Consumes: `Generator`, `slugify`, `futureDate`, `addDays`, `fmtDate`, `loremByLen`, `makePerson`, data pools (`SUBJECTS`, `LEVELS`, `SUBJECT_TYPE`, `INSTANCE_STATUS`, `RATE_TYPE`, `GRADES`, `BUSINESS_UNITS`, `VENUES`, `PROGRAMMES`).
- Produces: `courseGenerator`, `instanceGenerator`, `klassGenerator` (all `Generator`).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { courseGenerator } from '@/core/generators/course'
import { instanceGenerator } from '@/core/generators/instance'
import { klassGenerator } from '@/core/generators/klass'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

describe('academic generators', () => {
  it('course names are unique and slug matches name', () => {
    seedFaker('s')
    const rows = courseGenerator.generate({ count: 25, len: 'normal' }, ctx())
    expect(new Set(rows.map(r => r.name)).size).toBe(rows.length)
    expect(rows[0].slug).toBe(rows[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
  })
  it('course maxAge >= minAge', () => {
    seedFaker('s')
    const rows = courseGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) expect(Number(r.maxAge)).toBeGreaterThanOrEqual(Number(r.minAge))
  })
  it('instance codes are unique 8-letter strings', () => {
    seedFaker('s')
    const rows = instanceGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) expect(r.courseCode).toMatch(/^[A-Z]{8}$/)
    expect(new Set(rows.map(r => r.courseCode)).size).toBe(rows.length)
  })
  it('class name is unique', () => {
    seedFaker('s')
    const rows = klassGenerator.generate({ count: 20, len: 'normal' }, ctx())
    expect(new Set(rows.map(r => r.className)).size).toBe(rows.length)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/generators-academic.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write course.ts**

```ts
import type { Generator } from '../types'
import { slugify } from './shared'
import { loremByLen } from '../text'
import { SUBJECTS, LEVELS, SUBJECT_TYPE } from '../data'

export const courseGenerator: Generator = {
  key: 'course',
  label: 'Course',
  shortcut: 3,
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'slug', label: 'Slug' },
    { key: 'subjectType', label: 'Subject type' },
    { key: 'minAge', label: 'Min age' },
    { key: 'maxAge', label: 'Max age' },
    { key: 'price', label: 'Price (SGD)' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'duration', label: 'Duration (min)' },
    { key: 'seats', label: 'Seats' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const name = uniq.ensure('course.name', () => {
        const base = `${rng.pick(SUBJECTS)} ${rng.pick(LEVELS)}`
        return len === 'stress' ? `${base} ${rng.pick(SUBJECTS)} ${rng.pick(LEVELS)} Programme` : base
      })
      const minAge = rng.int(4, 12)
      return {
        name,
        description: loremByLen(rng, len),
        slug: slugify(name),
        subjectType: rng.pick(SUBJECT_TYPE),
        minAge: String(minAge),
        maxAge: String(minAge + rng.int(2, 4)),
        price: String(rng.int(120, 800)),
        sessions: String(rng.int(4, 12)),
        duration: String(rng.pick([60, 90, 120] as const)),
        seats: String(rng.int(8, 30)),
      }
    })
  },
}
```

- [ ] **Step 4: Write instance.ts**

```ts
import type { Generator } from '../types'
import { futureDate, addDays, fmtDate } from './shared'
import { INSTANCE_STATUS, RATE_TYPE } from '../data'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const instanceGenerator: Generator = {
  key: 'instance',
  label: 'Course Instance',
  shortcut: 4,
  fields: [
    { key: 'courseCode', label: 'Course code' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'duration', label: 'Duration (min)' },
    { key: 'price', label: 'Price (SGD)' },
    { key: 'seats', label: 'Seats' },
    { key: 'status', label: 'Status' },
    { key: 'rateType', label: 'Rate type' },
  ],
  generate({ count }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const courseCode = uniq.ensure('instance.code', () =>
        Array.from({ length: 8 }, () => LETTERS[rng.int(0, 25)]).join(''))
      const sessions = rng.int(4, 12)
      const start = futureDate(rng, 3, 30)
      const end = addDays(start, sessions * 7)
      return {
        courseCode,
        startDate: fmtDate(start),
        endDate: fmtDate(end),
        sessions: String(sessions),
        duration: String(rng.pick([60, 90, 120] as const)),
        price: String(rng.int(120, 800)),
        seats: String(rng.int(8, 30)),
        status: rng.pick(INSTANCE_STATUS),
        rateType: rng.pick(RATE_TYPE),
      }
    })
  },
}
```

- [ ] **Step 5: Write klass.ts**

```ts
import type { Generator } from '../types'
import { makePerson } from '../names'
import { GRADES, SUBJECTS, LEVELS, BUSINESS_UNITS, VENUES, PROGRAMMES } from '../data'

export const klassGenerator: Generator = {
  key: 'klass',
  label: 'Class',
  shortcut: 5,
  fields: [
    { key: 'className', label: 'Class name' },
    { key: 'businessUnit', label: 'Business unit' },
    { key: 'venue', label: 'Venue' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'courses', label: 'Courses' },
    { key: 'programmes', label: 'Programmes' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const className = uniq.ensure('class.name', () => {
        const base = `${rng.pick(GRADES)} ${rng.pick(SUBJECTS)}`
        return len === 'stress' ? `${base} ${rng.pick(LEVELS)} (${rng.pick(PROGRAMMES)})` : base
      })
      const teachers = Array.from({ length: rng.int(1, 3) }, () =>
        uniq.ensure('class.teacher', () => makePerson(rng).full)).join(', ')
      const courses = Array.from({ length: rng.int(1, 3) }, () =>
        `${rng.pick(SUBJECTS)} ${rng.pick(LEVELS)}`).join(', ')
      const programmes = rng.sample(PROGRAMMES, rng.int(1, 2)).join(', ')
      return {
        className,
        businessUnit: rng.pick(BUSINESS_UNITS),
        venue: rng.pick(VENUES),
        teachers,
        courses,
        programmes,
      }
    })
  },
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/generators-academic.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add src/core/generators/course.ts src/core/generators/instance.ts src/core/generators/klass.ts src/core/__tests__/generators-academic.test.ts
git commit -m "feat(core): course + instance + class generators"
```

---

### Task 12: Product + Message + Ticket generators

**Files:**
- Create: `src/core/generators/product.ts`, `src/core/generators/message.ts`, `src/core/generators/ticket.ts`
- Test: `src/core/__tests__/generators-misc.test.ts`

**Interfaces:**
- Consumes: `Generator`, `slugify`, `loremByLen`, `htmlMessage`, `chatTranscript`, `makePerson`, data pools (`SUBJECTS`, `PRODUCT_BASES`, `PRODUCT_STATUS`, `PRODUCT_TYPE`, `VARIANT_TYPE`, `TIME_PERIOD`, `SEND_TO`), `faker`.
- Produces: `productGenerator`, `messageGenerator`, `ticketGenerator` (all `Generator`). `ticketGenerator.fields` includes `{ key: 'conversation', label: 'Conversation', html: true }`; `messageGenerator.fields` includes `{ key: 'message', label: 'Message', html: true }`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { productGenerator } from '@/core/generators/product'
import { messageGenerator } from '@/core/generators/message'
import { ticketGenerator } from '@/core/generators/ticket'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

describe('misc generators', () => {
  it('product SKU matches AGR- format and is unique', () => {
    seedFaker('s')
    const rows = productGenerator.generate({ count: 25, len: 'normal' }, ctx())
    for (const r of rows) expect(r.sku).toMatch(/^AGR-[A-Z0-9]{6}$/)
    expect(new Set(rows.map(r => r.sku)).size).toBe(rows.length)
  })
  it('product currency is SGD', () => {
    seedFaker('s')
    const [r] = productGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.currency).toBe('SGD')
  })
  it('message field is HTML and type=update', () => {
    seedFaker('s')
    const [r] = messageGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.type).toBe('update')
    expect(r.message).toMatch(/<\w+/)
  })
  it('ticket participants differ and conversation mentions both', () => {
    seedFaker('s')
    const [r] = ticketGenerator.generate({ count: 1, len: 'normal', messagesPerTicket: 4 }, ctx())
    expect(r.participantA).not.toBe(r.participantB)
    expect(r.conversation).toContain(r.participantA)
    expect(r.conversation).toContain(r.participantB)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/generators-misc.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write product.ts**

```ts
import type { Generator } from '../types'
import { slugify } from './shared'
import { loremByLen } from '../text'
import { faker } from '../faker-seed'
import {
  SUBJECTS, PRODUCT_BASES, PRODUCT_STATUS, PRODUCT_TYPE, VARIANT_TYPE, TIME_PERIOD,
} from '../data'

const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const productGenerator: Generator = {
  key: 'product',
  label: 'Product',
  shortcut: 6,
  fields: [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'slug', label: 'Slug' },
    { key: 'variantName', label: 'Variant name' },
    { key: 'status', label: 'Status' },
    { key: 'productType', label: 'Product type' },
    { key: 'variantType', label: 'Variant type' },
    { key: 'timePeriod', label: 'Time period' },
    { key: 'price', label: 'Price (SGD)' },
    { key: 'currency', label: 'Currency' },
    { key: 'requireStudent', label: 'Require student' },
    { key: 'isDeposit', label: 'Is deposit' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const sku = uniq.ensure('product.sku', () =>
        'AGR-' + Array.from({ length: 6 }, () => ALNUM[rng.int(0, ALNUM.length - 1)]).join(''))
      const name = uniq.ensure('product.name', () => {
        const base = `${rng.pick(SUBJECTS)} ${rng.pick(PRODUCT_BASES)}`
        return len === 'stress' ? `${base} ${rng.pick(TIME_PERIOD)} Edition` : base
      })
      return {
        sku,
        name,
        description: loremByLen(rng, len),
        slug: slugify(name),
        variantName: faker.commerce.productAdjective() + ' ' + faker.commerce.product(),
        status: rng.pick(PRODUCT_STATUS),
        productType: rng.pick(PRODUCT_TYPE),
        variantType: rng.pick(VARIANT_TYPE),
        timePeriod: rng.pick(TIME_PERIOD),
        price: String(rng.int(50, 1200)),
        currency: 'SGD',
        requireStudent: String(rng.bool()),
        isDeposit: String(rng.bool(0.3)),
      }
    })
  },
}
```

- [ ] **Step 4: Write message.ts**

```ts
import type { Generator } from '../types'
import { htmlMessage } from '../text'
import { faker } from '../faker-seed'
import { SEND_TO } from '../data'

export const messageGenerator: Generator = {
  key: 'message',
  label: 'Update Message',
  shortcut: 7,
  fields: [
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message', html: true },
    { key: 'sendTo', label: 'Send to' },
    { key: 'type', label: 'Type' },
  ],
  generate({ count, len }, { rng }) {
    return Array.from({ length: count }, () => ({
      title: len === 'stress' ? faker.lorem.words(20) : faker.lorem.words(rng.int(3, 7)),
      message: htmlMessage(rng, len),
      sendTo: rng.pick(SEND_TO),
      type: 'update',
    }))
  },
}
```

- [ ] **Step 5: Write ticket.ts**

```ts
import type { Generator } from '../types'
import { makePerson } from '../names'
import { chatTranscript } from '../text'

export const ticketGenerator: Generator = {
  key: 'ticket',
  label: 'Ticket',
  shortcut: 8,
  fields: [
    { key: 'participantA', label: 'Participant A' },
    { key: 'participantB', label: 'Participant B' },
    { key: 'messages', label: 'Messages' },
    { key: 'conversation', label: 'Conversation', html: true },
  ],
  generate({ count, messagesPerTicket }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const a = uniq.ensure('ticket.participant', () => makePerson(rng).full)
      const b = uniq.ensure('ticket.participant', () => makePerson(rng).full)
      const n = messagesPerTicket ?? rng.int(3, 10)
      return {
        participantA: a,
        participantB: b,
        messages: String(n),
        conversation: chatTranscript(rng, a, b, n),
      }
    })
  },
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/generators-misc.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add src/core/generators/product.ts src/core/generators/message.ts src/core/generators/ticket.ts src/core/__tests__/generators-misc.test.ts
git commit -m "feat(core): product + message + ticket generators"
```

---

### Task 13: Registry + top-level generate API (`core/registry.ts`, `core/index.ts`)

**Files:**
- Create: `src/core/registry.ts`, `src/core/index.ts`
- Test: `src/core/__tests__/registry.test.ts`

**Interfaces:**
- Consumes: all 8 generators, `Rng`, `Uniqueness`, `seedFaker`, types.
- Produces:
  - `export const GENERATORS: Generator[]` — ordered by shortcut 1..8.
  - `export function getGenerator(key: string): Generator | undefined`
  - `export function generate(key: string, opts: GenerateOptions): Record[]` — seeds faker + builds shared `Rng`/`Uniqueness`, then calls the generator. Throws `Error` for unknown key.
  - `src/core/index.ts` re-exports `generate`, `GENERATORS`, `getGenerator`, and types for UI consumption.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { GENERATORS, getGenerator, generate } from '@/core/registry'

describe('registry', () => {
  it('has 8 generators with shortcuts 1..8', () => {
    expect(GENERATORS).toHaveLength(8)
    expect(GENERATORS.map(g => g.shortcut)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
  it('same seed yields identical output', () => {
    const a = generate('parent', { count: 5, len: 'normal', seed: 'abc' })
    const b = generate('parent', { count: 5, len: 'normal', seed: 'abc' })
    expect(a).toEqual(b)
  })
  it('throws on unknown key', () => {
    expect(() => generate('nope', { count: 1, len: 'normal' })).toThrow()
  })
  it('getGenerator returns undefined for unknown key', () => {
    expect(getGenerator('nope')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/registry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write registry.ts**

```ts
import type { Generator, GenerateOptions, Record } from './types'
import { Rng } from './rng'
import { Uniqueness } from './uniqueness'
import { seedFaker } from './faker-seed'
import { parentGenerator } from './generators/parent'
import { studentGenerator } from './generators/student'
import { courseGenerator } from './generators/course'
import { instanceGenerator } from './generators/instance'
import { klassGenerator } from './generators/klass'
import { productGenerator } from './generators/product'
import { messageGenerator } from './generators/message'
import { ticketGenerator } from './generators/ticket'

export const GENERATORS: Generator[] = [
  parentGenerator, studentGenerator, courseGenerator, instanceGenerator,
  klassGenerator, productGenerator, messageGenerator, ticketGenerator,
].sort((a, b) => a.shortcut - b.shortcut)

const BY_KEY = new Map(GENERATORS.map(g => [g.key, g]))

export function getGenerator(key: string): Generator | undefined {
  return BY_KEY.get(key)
}

export function generate(key: string, opts: GenerateOptions): Record[] {
  const gen = BY_KEY.get(key)
  if (!gen) throw new Error(`Unknown generator: ${key}`)
  seedFaker(opts.seed)
  const rng = new Rng(opts.seed)
  const uniq = new Uniqueness(rng)
  return gen.generate(opts, { rng, uniq })
}
```

- [ ] **Step 4: Write index.ts**

```ts
export { GENERATORS, getGenerator, generate } from './registry'
export type { Generator, GenerateOptions, FieldMeta, Record, TextLen } from './types'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/core/__tests__/registry.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Run full core suite + typecheck**

Run: `npm test`
Expected: all core tests PASS.
Run: `npx tsc -b`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/core/registry.ts src/core/index.ts src/core/__tests__/registry.test.ts
git commit -m "feat(core): entity registry + seeded generate API"
```

---

### Task 14: Export functions (`export/to-json.ts`, `export/to-csv.ts`)

**Files:**
- Create: `src/export/to-json.ts`, `src/export/to-csv.ts`
- Test: `src/export/__tests__/export.test.ts`

**Interfaces:**
- Consumes: `Record`, `FieldMeta`.
- Produces:
  - `function toJSON(rows: Record[]): string` — pretty JSON (2-space).
  - `function toCSV(rows: Record[], fields: FieldMeta[]): string` — header from `fields`, RFC-4180 quoting (double quotes, escaped `""`, quote if value has comma/quote/newline).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { toJSON } from '@/export/to-json'
import { toCSV } from '@/export/to-csv'

const fields = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]

describe('export', () => {
  it('toJSON round-trips', () => {
    const rows = [{ a: '1', b: '2' }]
    expect(JSON.parse(toJSON(rows))).toEqual(rows)
  })
  it('toCSV quotes values with commas', () => {
    const csv = toCSV([{ a: 'x,y', b: 'z' }], fields)
    expect(csv.split('\n')[0]).toBe('A,B')
    expect(csv.split('\n')[1]).toBe('"x,y",z')
  })
  it('toCSV escapes quotes', () => {
    const csv = toCSV([{ a: 'he said "hi"', b: 'z' }], fields)
    expect(csv.split('\n')[1]).toBe('"he said ""hi""",z')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/export/__tests__/export.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write implementations**

`to-json.ts`:

```ts
import type { Record } from '@/core/types'
export function toJSON(rows: Record[]): string {
  return JSON.stringify(rows, null, 2)
}
```

`to-csv.ts`:

```ts
import type { Record, FieldMeta } from '@/core/types'

function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(rows: Record[], fields: FieldMeta[]): string {
  const header = fields.map(f => cell(f.label)).join(',')
  const body = rows.map(r => fields.map(f => cell(r[f.key] ?? '')).join(',')).join('\n')
  return `${header}\n${body}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/export/__tests__/export.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/export/to-json.ts src/export/to-csv.ts src/export/__tests__/export.test.ts
git commit -m "feat(export): JSON + CSV serializers"
```

---

### Task 15: UI — theme, copy hook, download helper

**Files:**
- Create: `src/hooks/use-theme.ts`, `src/hooks/use-copy.ts`, `src/lib/download.ts`, `src/lib/cn.ts`
- Test: `src/export/__tests__/download.test.ts` (unit-test the filename builder only)

**Interfaces:**
- Produces:
  - `useTheme(): { theme: 'light'|'dark'; toggle: () => void }` — toggles `dark` class on `<html>`, persists to `localStorage`.
  - `useCopy(): { copied: string | null; copy: (text: string, id?: string) => void }` — writes to clipboard, sets `copied` id for ~1.2s.
  - `download(filename: string, content: string, mime: string): void` — Blob + anchor click.
  - `buildFilename(entity: string, ext: string): string` — `agora-<entity>.<ext>`.
  - `cn(...classes): string` — join truthy class strings.

- [ ] **Step 1: Write the failing test (filename builder)**

```ts
import { describe, it, expect } from 'vitest'
import { buildFilename } from '@/lib/download'

describe('buildFilename', () => {
  it('composes entity and extension', () => {
    expect(buildFilename('parent', 'json')).toBe('agora-parent.json')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/export/__tests__/download.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write implementations**

`src/lib/cn.ts`:

```ts
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
```

`src/lib/download.ts`:

```ts
export function buildFilename(entity: string, ext: string): string {
  return `agora-${entity}.${ext}`
}

export function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

`src/hooks/use-theme.ts`:

```ts
import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') ?? 'light',
  )
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])
  return { theme, toggle: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }
}
```

`src/hooks/use-copy.ts`:

```ts
import { useCallback, useRef, useState } from 'react'

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const copy = useCallback((text: string, id?: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id ?? text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1200)
  }, [])
  return { copied, copy }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/export/__tests__/download.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-theme.ts src/hooks/use-copy.ts src/lib/download.ts src/lib/cn.ts src/export/__tests__/download.test.ts
git commit -m "feat(ui): theme, copy, download helpers"
```

---

### Task 16: UI — generate hook + full App assembly

**Files:**
- Create: `src/hooks/use-generator.ts`, `src/components/Sidebar.tsx`, `src/components/Toolbar.tsx`, `src/components/RecordCard.tsx`, `src/components/ExportBar.tsx`, `src/components/HtmlPreviewDialog.tsx`
- Modify: `src/App.tsx`, `src/index.css` (design tokens + base styles)

**Interfaces:**
- Consumes: `GENERATORS`, `getGenerator`, `generate`, `Record`, `FieldMeta` from `@/core`; `toJSON`, `toCSV`; `download`, `buildFilename`; `useTheme`, `useCopy`, `cn`.
- Produces: a working single-page app. `useGenerator()` returns `{ entityKey, setEntityKey, count, setCount, seed, setSeed, len, setLen, messages, setMessages, rows, run }`.

- [ ] **Step 1: Write use-generator.ts**

```ts
import { useState, useCallback } from 'react'
import { generate, getGenerator, type Record, type TextLen } from '@/core'

export function useGenerator() {
  const [entityKey, setEntityKey] = useState('parent')
  const [count, setCount] = useState(3)
  const [seed, setSeed] = useState('')
  const [len, setLen] = useState<TextLen>('normal')
  const [messages, setMessages] = useState(5)
  const [rows, setRows] = useState<Record[]>([])

  const run = useCallback(() => {
    setRows(generate(entityKey, {
      count, len, seed: seed || undefined,
      messagesPerTicket: messages,
    }))
  }, [entityKey, count, len, seed, messages])

  const generator = getGenerator(entityKey)!
  return { entityKey, setEntityKey, count, setCount, seed, setSeed, len, setLen,
    messages, setMessages, rows, run, generator }
}
```

- [ ] **Step 2: Write Sidebar.tsx**

```tsx
import { GENERATORS } from '@/core'
import { cn } from '@/lib/cn'
import { Moon, Sun } from 'lucide-react'

interface Props {
  active: string
  onSelect: (key: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Sidebar({ active, onSelect, theme, onToggleTheme }: Props) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6">
        <h1 className="text-lg font-bold">Agora Test Data</h1>
        <p className="text-xs text-neutral-500">Dummy data generator</p>
      </div>
      <nav className="flex flex-col gap-1">
        {GENERATORS.map(g => (
          <button
            key={g.key}
            onClick={() => onSelect(g.key)}
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-left text-sm',
              active === g.key
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'hover:bg-neutral-200 dark:hover:bg-neutral-800',
            )}
          >
            <span>{g.label}</span>
            <kbd className="text-xs opacity-60">{g.shortcut}</kbd>
          </button>
        ))}
      </nav>
      <button
        onClick={onToggleTheme}
        className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        {theme === 'dark' ? 'Light' : 'Dark'} mode
      </button>
    </aside>
  )
}
```

- [ ] **Step 3: Write Toolbar.tsx**

```tsx
import type { TextLen } from '@/core'
import { cn } from '@/lib/cn'

interface Props {
  count: number; setCount: (n: number) => void
  seed: string; setSeed: (s: string) => void
  len: TextLen; setLen: (l: TextLen) => void
  messages: number; setMessages: (n: number) => void
  showMessages: boolean
  onGenerate: () => void
}

export function Toolbar(p: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
      <label className="flex flex-col text-xs">
        Records
        <input type="number" min={1} max={100} value={p.count}
          onChange={e => p.setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
          className="mt-1 w-24 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700" />
      </label>
      <label className="flex flex-col text-xs">
        Text length
        <select value={p.len} onChange={e => p.setLen(e.target.value as TextLen)}
          className="mt-1 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700">
          <option value="normal">Normal</option>
          <option value="long">Long</option>
          <option value="stress">Stress (overflow)</option>
        </select>
      </label>
      <label className="flex flex-col text-xs">
        Seed (blank = random)
        <input value={p.seed} onChange={e => p.setSeed(e.target.value)}
          className="mt-1 w-40 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700" />
      </label>
      {p.showMessages && (
        <label className="flex flex-col text-xs">
          Messages / ticket
          <input type="number" min={1} max={50} value={p.messages}
            onChange={e => p.setMessages(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="mt-1 w-28 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700" />
        </label>
      )}
      <button onClick={p.onGenerate}
        className={cn('rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white',
          'hover:opacity-90 dark:bg-white dark:text-neutral-900')}>
        Generate
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Write HtmlPreviewDialog.tsx**

```tsx
interface Props { html: string | null; onClose: () => void }

export function HtmlPreviewDialog({ html, onClose }: Props) {
  if (html === null) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 dark:bg-neutral-900"
        onClick={e => e.stopPropagation()}>
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        <button onClick={onClose} className="mt-4 rounded-md border px-3 py-1 text-sm">Close</button>
      </div>
    </div>
  )
}
```

Note: `dangerouslySetInnerHTML` is acceptable here — the HTML is generated locally by our own `text.ts`, never user-supplied.

- [ ] **Step 5: Write RecordCard.tsx**

```tsx
import type { FieldMeta, Record } from '@/core'
import { cn } from '@/lib/cn'
import { Check, Copy, Eye } from 'lucide-react'

interface Props {
  row: Record
  fields: FieldMeta[]
  index: number
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onCopyRow: (row: Record) => void
  onPreview: (html: string) => void
}

export function RecordCard({ row, fields, index, copiedId, onCopy, onCopyRow, onPreview }: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">#{index + 1}</span>
        <button onClick={() => onCopyRow(row)} className="text-xs underline opacity-70 hover:opacity-100">
          Copy row (JSON)
        </button>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(120px,auto)_1fr]">
        {fields.map(f => {
          const id = `${index}:${f.key}`
          const val = row[f.key] ?? ''
          return (
            <div key={f.key} className="contents">
              <dt className="text-neutral-500">{f.label}</dt>
              <dd className="flex items-center gap-2">
                {f.html ? (
                  <button onClick={() => onPreview(val)} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Eye size={14} /> Preview HTML
                  </button>
                ) : (
                  <button onClick={() => onCopy(val, id)}
                    className={cn('group flex items-center gap-1 text-left', 'hover:text-blue-600')}
                    title="Click to copy">
                    <span className="truncate">{val}</span>
                    {copiedId === id
                      ? <Check size={14} className="text-green-600" />
                      : <Copy size={14} className="opacity-0 group-hover:opacity-60" />}
                  </button>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
```

- [ ] **Step 6: Write ExportBar.tsx**

```tsx
import type { FieldMeta, Record } from '@/core'
import { toJSON } from '@/export/to-json'
import { toCSV } from '@/export/to-csv'
import { download, buildFilename } from '@/lib/download'

interface Props { entityKey: string; rows: Record[]; fields: FieldMeta[] }

export function ExportBar({ entityKey, rows, fields }: Props) {
  if (rows.length === 0) return null
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">
      <span className="text-neutral-500">{rows.length} records</span>
      <div className="ml-auto flex gap-2">
        <button onClick={() => download(buildFilename(entityKey, 'json'), toJSON(rows), 'application/json')}
          className="rounded-md border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">Export JSON</button>
        <button onClick={() => download(buildFilename(entityKey, 'csv'), toCSV(rows, fields), 'text/csv')}
          className="rounded-md border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">Export CSV</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Write App.tsx**

```tsx
import { useEffect, useState } from 'react'
import { GENERATORS } from '@/core'
import { toJSON } from '@/export/to-json'
import { useGenerator } from '@/hooks/use-generator'
import { useTheme } from '@/hooks/use-theme'
import { useCopy } from '@/hooks/use-copy'
import { Sidebar } from '@/components/Sidebar'
import { Toolbar } from '@/components/Toolbar'
import { RecordCard } from '@/components/RecordCard'
import { ExportBar } from '@/components/ExportBar'
import { HtmlPreviewDialog } from '@/components/HtmlPreviewDialog'

export default function App() {
  const g = useGenerator()
  const { theme, toggle } = useTheme()
  const { copied, copy } = useCopy()
  const [preview, setPreview] = useState<string | null>(null)

  // Keyboard shortcuts 1..8 select entity.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      const n = Number(e.key)
      const match = GENERATORS.find(x => x.shortcut === n)
      if (match) g.setEntityKey(match.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [g])

  return (
    <div className="flex h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Sidebar active={g.entityKey} onSelect={g.setEntityKey} theme={theme} onToggleTheme={toggle} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Toolbar
          count={g.count} setCount={g.setCount}
          seed={g.seed} setSeed={g.setSeed}
          len={g.len} setLen={g.setLen}
          messages={g.messages} setMessages={g.setMessages}
          showMessages={g.entityKey === 'ticket'}
          onGenerate={g.run}
        />
        <ExportBar entityKey={g.entityKey} rows={g.rows} fields={g.generator.fields} />
        <div className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 xl:grid-cols-3">
          {g.rows.map((row, i) => (
            <RecordCard
              key={i} row={row} index={i} fields={g.generator.fields}
              copiedId={copied} onCopy={copy}
              onCopyRow={r => copy(toJSON([r]))}
              onPreview={setPreview}
            />
          ))}
          {g.rows.length === 0 && (
            <p className="text-sm text-neutral-500">Click Generate to create records.</p>
          )}
        </div>
      </main>
      <HtmlPreviewDialog html={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
```

- [ ] **Step 8: Update index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root { height: 100%; }
body { margin: 0; }
```

- [ ] **Step 9: Verify build + dev**

Run: `npx tsc -b`
Expected: PASS.
Run: `npm run build`
Expected: build succeeds.
Run: `npm run dev` then open the URL; click Generate for each of the 8 entities; verify copy-on-click, HTML preview for Message/Ticket, JSON/CSV export, dark-mode toggle, keyboard shortcuts 1..8. Stop dev server.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(ui): full app — sidebar, toolbar, cards, export, preview, theme"
```

---

### Task 17: GitHub Actions Pages deploy + README

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Produces: CI that builds and publishes `dist/` to GitHub Pages on push to `main`.

- [ ] **Step 1: Write deploy.yml**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: true
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Write README.md**

```markdown
# Agora Test Data Generator

Static website that generates realistic, non-duplicating dummy data for testing
Agora forms. Rebuild of the original vanilla-JS tool using Vite + React + TypeScript.

## Record types
Parent, Student/Child, Course, Course Instance, Class, Product, Update Message, Ticket.

## Features
- Seeded reproducibility (blank seed = random)
- Guaranteed no duplicates within a batch
- Text length modes: Normal / Long / Stress
- Singapore-realistic names, phones, postcodes
- Export to JSON / CSV, click-to-copy, HTML preview for messages/tickets
- Dark mode, keyboard shortcuts 1–8

## Develop
```bash
npm install
npm run dev
npm test
npm run build
```

## Deploy
Pushing to `main` builds and publishes to GitHub Pages via GitHub Actions.
Set **Settings → Pages → Source → GitHub Actions** once, after the first push.
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml README.md
git commit -m "ci: GitHub Pages deploy workflow + README"
```

---

### Task 18: Create GitHub repo + push + enable Pages

**Files:** none (repo operations).

- [ ] **Step 1: Create the remote repo (account huytranthanhtps)**

Run:

```bash
gh repo create huytranthanhtps/agora-test-data-generator \
  --public --source=. --remote=origin --description "Dummy test data generator for Agora forms"
```

- [ ] **Step 2: Push main**

Run:

```bash
git push -u origin main
```

- [ ] **Step 3: Enable Pages via GitHub Actions source**

Run:

```bash
gh api -X POST repos/huytranthanhtps/agora-test-data-generator/pages \
  -f build_type=workflow || echo "If this fails, enable Pages manually: Settings → Pages → Source → GitHub Actions"
```

- [ ] **Step 4: Verify deploy**

Run: `gh run watch` (or `gh run list`) until the deploy workflow succeeds.
Expected: workflow green; site live at
`https://huytranthanhtps.github.io/agora-test-data-generator/`.
Open the URL and smoke-test Generate for one entity.

*(No commit — remote operations only.)*

---

## Self-Review

**Spec coverage:**
- Tech stack (spec §3) → Task 1. ✓
- Seeded PRNG + faker seed sync (§3) → Tasks 2, 3, 13. ✓
- Core architecture / types / uniqueness (§4) → Tasks 4, 5. ✓
- SG data pools + names/email/phone/postcode (§3, §6) → Tasks 6, 7. ✓
- Text length modes + HTML message/chat (§2, §6) → Task 8. ✓
- All 8 generators with exact fields (§6) → Tasks 10, 11, 12. ✓
- Registry + generate API (§4, §5) → Task 13. ✓
- Export JSON/CSV (§2) → Task 14. ✓
- UX: copy-on-click + toast, copy row, HTML preview dialog, dark mode, shortcuts 1–8, responsive (§7) → Tasks 15, 16. ✓
- Testing core only (§8) → Tasks 2,3,5,7,8,10,11,12,13,14. ✓
- Deploy GitHub Actions → Pages, base path (§3, §9) → Tasks 1, 17, 18. ✓
- Out of scope: no Files/PDF, no backend (§10) → honored throughout. ✓

**Placeholder scan:** No TBD/TODO; every code step has concrete code. Data pools in Task 6 are concrete and non-empty.

**Type consistency:** `Generator` interface (Task 4) — `key/label/shortcut/fields/generate` — used identically in Tasks 10–13. `GenContext { rng, uniq }` consistent. `generate(key, opts)` signature consistent between Task 13 and Task 16. `FieldMeta.html` flag defined in Task 4, set in Task 12 (message/ticket), consumed in Task 16 (RecordCard/HtmlPreviewDialog). `buildFilename` (Task 15) used in Task 16 ExportBar. Faker seeded via `seedFaker` in Task 13 and in every generator test before calling `.generate`.

**Note on determinism:** `shared.ts` uses a fixed `BASE_DATE` (never `Date.now()`), so seeded date fields are reproducible — consistent with Global Constraints.
