# School Date Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "School Date" generator tab that produces test data for the `school_date` table (per-venue calendar events: event / break / closure; all-day or timed; single- or multi-day).

**Architecture:** One new self-registering generator (`src/core/generators/schoolDate.ts`) following the existing one-file-per-entity pattern. It emits human-readable labels only (no UUIDs), routes `name` through `ctx.uniq`, and takes all randomness from `ctx.rng`. Date/time output honours the three SQL CHECK constraints. The tab and Console need no bespoke UI — `TopNav`/`Console` render from `GENERATORS` and the shared `count/seed/len` controls.

**Tech Stack:** Vite + React 19 + TypeScript (strict, `noUnused*`) + Tailwind, Vitest.

**Spec:** No standalone spec file (bounded task). Source of truth: `../Agora/api-refactor/sql/722_create_school_date.sql` and the approved in-chat design (labels only, random event/break/closure mix, no extra Console controls).

## Global Constraints

- **Seeded reproducibility** — randomness only from `ctx.rng` + seeded faker; never `Math.random()`/`Date.now()` in a generator. Use the fixed `BASE_DATE` from `shared.ts` for all dates.
- **No duplicates within a batch** — route `name` through `ctx.uniq.ensure(bucket, produce)`; never hand-roll dedup.
- **SQL invariants the output must satisfy** (from `722_create_school_date.sql`):
  - `end_date >= start_date`.
  - all-day ⇒ both times empty; timed ⇒ both times present.
  - single-day timed ⇒ `end_time > start_time` (multi-day timed is exempt).
- **TS strict / `noUnused*`** — no dead imports/vars; type-only imports use `import type`.
- **Labels only** — `venue` = business-unit name, `programme` = a programme name or `Whole venue` (models `programme_id NULL`). No UUID columns.

---

### Task 1: Data pools + time formatter

**Files:**
- Modify: `src/core/data.ts` (append new `as const` pools)
- Modify: `src/core/generators/shared.ts` (add `fmtTime`)
- Test: `src/core/__tests__/text.test.ts` is unrelated — add a small check in the Task 3 generator test instead; no separate test here (pure constants + trivial formatter, covered transitively by Task 3).

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `data.ts`: `SCHOOL_DATE_TYPE: readonly ['Event','Break','Closure']`, `SCHOOL_EVENT_NAMES`, `SCHOOL_BREAK_NAMES`, `SCHOOL_CLOSURE_NAMES` (all `readonly string[]` via `as const`).
  - `shared.ts`: `fmtTime(hour: number, minute: number): string` → zero-padded `"HH:MM"`.

- [ ] **Step 1: Add the data pools to `src/core/data.ts`**

Append at the end of the file:

```ts
export const SCHOOL_DATE_TYPE = ['Event', 'Break', 'Closure'] as const
export const SCHOOL_EVENT_NAMES = ['Sports Day', 'Open House', 'Parent-Teacher Conference', 'Graduation Ceremony', 'Annual Concert', 'Science Fair', 'Book Fair', 'Founders Day', 'Excursion Day', 'Report Card Day'] as const
export const SCHOOL_BREAK_NAMES = ['Term 1 Break', 'Term 2 Break', 'Term 3 Break', 'Half-Term Break', 'March Holidays', 'June Holidays', 'September Holidays', 'Year-End Break'] as const
export const SCHOOL_CLOSURE_NAMES = ['Public Holiday — Deepavali', 'Public Holiday — Hari Raya Puasa', 'Public Holiday — Chinese New Year', 'Public Holiday — National Day', 'Staff Training Day', 'Deep Cleaning Closure', 'Emergency Closure', 'Renovation Closure'] as const
```

- [ ] **Step 2: Add `fmtTime` to `src/core/generators/shared.ts`**

Add after `fmtDate`:

```ts
export function fmtTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: PASS (no unused-export errors — the new symbols are consumed in Task 2; if running this task in isolation, defer the build to Task 2).

---

### Task 2: The generator

**Files:**
- Create: `src/core/generators/schoolDate.ts`
- Modify: `src/core/registry.ts` (import + add to `GENERATORS`)
- Test: `src/core/__tests__/generators-schoolDate.test.ts` (Task 3)

**Interfaces:**
- Consumes: `Generator` (`../types`); `BASE_DATE`, `addDays`, `fmtDate`, `fmtTime` (`./shared`); `SCHOOL_DATE_TYPE`, `SCHOOL_EVENT_NAMES`, `SCHOOL_BREAK_NAMES`, `SCHOOL_CLOSURE_NAMES`, `BUSINESS_UNITS`, `PROGRAMMES` (`../data`).
- Produces: `schoolDateGenerator: Generator` with `key: 'schoolDate'`, `shortcut: 8`, and row keys `name, type, venue, programme, startDate, endDate, allDay, startTime, endTime` (all strings).

- [ ] **Step 1: Create `src/core/generators/schoolDate.ts`**

```ts
import type { Generator } from '../types'
import { BASE_DATE, addDays, fmtDate, fmtTime } from './shared'
import {
  SCHOOL_DATE_TYPE,
  SCHOOL_EVENT_NAMES,
  SCHOOL_BREAK_NAMES,
  SCHOOL_CLOSURE_NAMES,
  BUSINESS_UNITS,
  PROGRAMMES,
} from '../data'

const NONE = '—'

export const schoolDateGenerator: Generator = {
  key: 'schoolDate',
  label: 'School Date',
  shortcut: 8,
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'venue', label: 'Venue' },
    { key: 'programme', label: 'Programme' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'allDay', label: 'All day' },
    { key: 'startTime', label: 'Start time' },
    { key: 'endTime', label: 'End time' },
  ],
  generate({ count }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const type = rng.pick(SCHOOL_DATE_TYPE)
      const pool =
        type === 'Event'
          ? SCHOOL_EVENT_NAMES
          : type === 'Break'
            ? SCHOOL_BREAK_NAMES
            : SCHOOL_CLOSURE_NAMES
      const name = uniq.ensure('schoolDate.name', () => rng.pick(pool))

      const venue = rng.pick(BUSINESS_UNITS)
      // programme_id NULL (whole venue) ~60%, narrowed to one programme ~40%.
      const programme = rng.bool(0.4) ? rng.pick(PROGRAMMES) : 'Whole venue'

      const start = addDays(BASE_DATE, rng.int(1, 120))
      // Only Events are ever timed; breaks/closures are always all-day.
      const timed = type === 'Event' && rng.bool(0.5)

      if (timed) {
        // Timed single-day: end_date == start_date and end_time > start_time.
        const startHour = rng.int(8, 15) // 08:00–15:00, on the hour
        const endHour = startHour + rng.int(1, 4) // +1..4h, still same day (<= 19:00)
        return {
          name,
          type,
          venue,
          programme,
          startDate: fmtDate(start),
          endDate: fmtDate(start),
          allDay: 'No',
          startTime: fmtTime(startHour, 0),
          endTime: fmtTime(endHour, 0),
        }
      }

      // All-day: single day for Events, a multi-day range for Break/Closure.
      const span = type === 'Event' ? 0 : rng.int(0, 13)
      const end = addDays(start, span)
      return {
        name,
        type,
        venue,
        programme,
        startDate: fmtDate(start),
        endDate: fmtDate(end),
        allDay: 'Yes',
        startTime: NONE,
        endTime: NONE,
      }
    })
  },
}
```

- [ ] **Step 2: Register it in `src/core/registry.ts`**

Add the import next to the others:

```ts
import { schoolDateGenerator } from './generators/schoolDate'
```

Add it to the array (before `.sort`):

```ts
export const GENERATORS: Generator[] = [
  parentGenerator, courseGenerator, instanceGenerator,
  klassGenerator, productGenerator, messageGenerator, ticketGenerator,
  schoolDateGenerator,
].sort((a, b) => a.shortcut - b.shortcut)
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Expected: PASS.

---

### Task 3: Tests (determinism + SQL constraints + uniqueness)

**Files:**
- Create: `src/core/__tests__/generators-schoolDate.test.ts`
- Modify: `src/core/__tests__/registry.test.ts` (7 → 8 generators, shortcuts `1..8`)

**Interfaces:**
- Consumes: `schoolDateGenerator` (`@/core/generators/schoolDate`), `generate`/`GENERATORS` (`@/core/registry`), `Rng`, `Uniqueness`, `seedFaker`.
- Produces: nothing (test-only).

- [ ] **Step 1: Write the generator test**

Create `src/core/__tests__/generators-schoolDate.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { generate } from '@/core/registry'
import { schoolDateGenerator } from '@/core/generators/schoolDate'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

// Dates are rendered dd/mm/yyyy; compare as a sortable yyy-mm-dd key.
function dateKey(d: string): string {
  const [dd, mm, yyyy] = d.split('/')
  return `${yyyy}-${mm}-${dd}`
}

describe('school date generator', () => {
  it('same seed yields identical output', () => {
    const a = generate('schoolDate', { count: 10, len: 'normal', seed: 'abc' })
    const b = generate('schoolDate', { count: 10, len: 'normal', seed: 'abc' })
    expect(a).toEqual(b)
  })

  it('emits every declared field', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 5, len: 'normal' }, ctx())
    for (const r of rows) {
      for (const f of schoolDateGenerator.fields) expect(r[f.key]).toBeTruthy()
    }
  })

  it('names are unique within a batch', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 40, len: 'normal' }, ctx())
    expect(new Set(rows.map(r => r.name)).size).toBe(rows.length)
  })

  it('honours the SQL all-day / timed and date-order constraints', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 60, len: 'normal' }, ctx())
    for (const r of rows) {
      // end_date >= start_date
      expect(dateKey(r.endDate as string) >= dateKey(r.startDate as string)).toBe(true)
      if (r.allDay === 'Yes') {
        // all-day ⇒ no times
        expect(r.startTime).toBe('—')
        expect(r.endTime).toBe('—')
      } else {
        // timed ⇒ both times present, single-day, end_time > start_time
        expect(r.allDay).toBe('No')
        expect(r.startTime).toMatch(/^\d{2}:\d{2}$/)
        expect(r.endTime).toMatch(/^\d{2}:\d{2}$/)
        expect(r.startDate).toBe(r.endDate)
        expect(r.endTime > r.startTime).toBe(true) // lexical works for HH:MM
      }
    }
  })

  it('only Events are ever timed', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 60, len: 'normal' }, ctx())
    for (const r of rows) {
      if (r.allDay === 'No') expect(r.type).toBe('Event')
    }
  })
})
```

- [ ] **Step 2: Run it and confirm it passes**

Run: `npm test -- generators-schoolDate`
Expected: PASS (all 5 tests).

- [ ] **Step 3: Update the registry test**

In `src/core/__tests__/registry.test.ts`, change the first test:

```ts
  it('has 8 generators with contiguous shortcuts 1..8', () => {
    expect(GENERATORS).toHaveLength(8)
    expect(GENERATORS.map(g => g.shortcut)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })
```

- [ ] **Step 4: Run the full suite + build**

Run: `npm test && npm run build`
Expected: PASS (all tests green, type gate green).

- [ ] **Step 5: Commit**

```bash
git add src/core/data.ts src/core/generators/shared.ts src/core/generators/schoolDate.ts src/core/registry.ts src/core/__tests__/generators-schoolDate.test.ts src/core/__tests__/registry.test.ts docs/superpowers/plans/2026-08-22-school-date-generator.md
git commit -m "feat(school-date): add School Date generator tab"
```

---

### Task 4: Trim name/title icons — emoji only, max 1

Follow-up request (applies to the existing `iconicName` naming rule, used by Course / Class / Product name+variant / Update Message title): use **emoji icons only** (drop the typographic symbols) and insert **at most one** per name, regardless of `len`.

**Files:**
- Modify: `src/core/text.ts:49-50` (comment + `NAME_ICONS`), `src/core/text.ts:68-85` (`iconicName` doc + `iconCount`)
- Test: `src/core/__tests__/text.test.ts`

**Interfaces:**
- Consumes: `NAME_ICONS`, `iconicName` (unchanged signature).
- Produces: `iconicName` output that contains 0 or 1 token from an emoji-only `NAME_ICONS`.

- [ ] **Step 1: Write the failing test**

Add to `src/core/__tests__/text.test.ts`:

```ts
import { iconicName } from '@/core/text'
import { Rng } from '@/core/rng'
import { seedFaker } from '@/core/faker-seed'

// Typographic symbols that must no longer appear in generated names.
const BANNED_SYMBOLS = ['★', '✦', '✽', '◆', '▶']

describe('iconicName icon policy', () => {
  it('inserts at most one icon and never a typographic symbol', () => {
    seedFaker('s')
    const r = new Rng('s')
    for (const len of ['normal', 'long', 'stress'] as const) {
      for (let i = 0; i < 40; i++) {
        const name = iconicName(r, len)
        for (const sym of BANNED_SYMBOLS) expect(name).not.toContain(sym)
        const icons = [...name].filter(ch => /\p{Extended_Pictographic}/u.test(ch)).length
        expect(icons).toBeLessThanOrEqual(1)
      }
    }
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- text`
Expected: FAIL (current pool contains symbols and inserts up to 3 icons).

- [ ] **Step 3: Update `src/core/text.ts`**

Replace the `NAME_ICONS` line and its comment (line 49-50):

```ts
// Emoji icons scattered into generated names to stress-test rendering.
const NAME_ICONS = ['📘', '✏️', '🧪', '🎨', '🔬', '🧮', '🚀', '⭐', '🎯'] as const
```

In `iconicName`, update the doc comment fragment and the `iconCount` line (was `len === 'normal' ? r.int(1, 2) : r.int(2, 3)`):

```ts
  const iconCount = r.int(0, 1)
```

Also fix the doc comment above `iconicName` so it reads "+ at most one emoji icon" instead of "1–3 icons/symbols".

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- text`
Expected: PASS.

- [ ] **Step 5: Full suite + build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/core/text.ts src/core/__tests__/text.test.ts docs/superpowers/plans/2026-08-22-school-date-generator.md
git commit -m "refactor(text): emoji-only names, at most one icon per name"
```

---

## Self-Review

**1. Spec coverage** (source = SQL + approved design):
- event/break/closure → `SCHOOL_DATE_TYPE` + per-type name pools ✓ (Task 1/2)
- all-day vs timed, single vs multi-day → date/time branch in `generate` ✓ (Task 2), asserted ✓ (Task 3)
- `end_date >= start_date` → `span >= 0`, timed uses same day ✓; asserted ✓
- all-day⇒no times / timed⇒both times → branch ✓; asserted ✓
- single-day timed `end_time > start_time` → `endHour = startHour + 1..4` ✓; asserted ✓
- venue = company label, programme NULL vs narrowed → `venue`/`programme` ✓
- labels only, no extra controls → no Console/types changes ✓
- tab appears → self-registration in `registry.ts`, `TopNav`/`Console` are data-driven ✓
- shortcut 8 keyboard select → `App.tsx` handler reads `Number(e.key)`, already supports single digits ✓ (no change needed)

**2. Placeholder scan:** none — all steps contain real code.

**3. Type consistency:** `schoolDateGenerator` name, `key: 'schoolDate'`, field keys, and `fmtTime(hour, minute)` signature are identical across Tasks 2 and 3. Row values are all `string`, matching `Record = { [k]: FieldValue }`.
