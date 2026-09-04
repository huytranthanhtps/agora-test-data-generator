# School Date — Location + Description Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two fields to the School Date generator — `location` (the event's
physical place) and `description` (a rich-text HTML blurb).

**Architecture:** `src/core/generators/schoolDate.ts` gains a local
`eventLocation(rng)` helper that draws from the seeded faker in one of four
shapes (street address, landmark, room name, external civic venue), and reuses
the existing `htmlMessage(rng, len)` rich-HTML builder from `src/core/text.ts`
for `description` — the same pattern `course.ts` already uses. Both new fields
are declared in the generator's `fields[]` so `RecordCard`, CSV and JSON export
pick them up with no changes outside the generator.

**Tech Stack:** TypeScript (strict), `@faker-js/faker` via `src/core/faker-seed.ts`,
Mulberry32 `Rng` (`src/core/rng.ts`), Vitest.

**Spec:** No spec file — this was classified **bounded** by
`superpowers:brainstorming` and the design was approved in chat. The approved
design is restated in full under "Approved design" below so this plan is
self-contained.

## Global Constraints

- **Seeded reproducibility (MANDATORY):** same non-empty seed → identical batch.
  Randomness comes only from `ctx.rng` and the seeded `faker`
  (`@/core/faker-seed`). **Never** `Math.random()`, `Date.now()`, or any
  unseeded source inside a generator. (`docs/rules/architecture.md`)
- **No duplicates within a batch:** any field that must be unique goes through
  `ctx.uniq.ensure(bucket, produce)`. `location` and `description` are
  **deliberately not unique** — several events legitimately share a room, and
  `htmlMessage` prose is lorem-backed so collisions are vanishingly unlikely.
  Do not add a `uniq` bucket for either.
- **TypeScript strict + `noUnusedLocals`/`noUnusedParameters`:** an unused
  import or variable **fails `npm run build`**. Use `import type { … }` for
  type-only imports (`isolatedModules` is on).
- **Rich HTML fields:** a `html: true` field is rendered via
  `dangerouslySetInnerHTML` inside a `.rich` container. `.rich`
  (`src/index.css`) styles h1–h3 (NOT h4), `p`, `ul`/`ol`/`li`, `strong`, `em`,
  `a`. `htmlMessage` already respects this. (`docs/rules/code-style.md`)
- **No `console.log` in committed code.**
- **jest-dom matchers are NOT loaded** in Vitest — use native matchers
  (`expect(x).toBeTruthy()`, not `.toBeInTheDocument()`).
  (`docs/rules/testing.md`)
- **No new generator is added**, so `src/core/__tests__/registry.test.ts` —
  which asserts the exact `GENERATORS` length and the contiguous `[1..N]`
  shortcut run — **must not be touched**. `schoolDate` keeps `shortcut: 8`.

## Approved design

`location` — chosen data source: **faker address/landmark**, four shapes picked
with `rng.int(0, 3)`:

| Shape | Source | Example |
|---|---|---|
| Street address | `faker.location.streetAddress()` | `42 Bukit Timah Road` |
| Landmark | `faker.company.name()` + `rng.pick(['Centre','Hall','Auditorium','Pavilion'])` | `Hane-Kuhic Pavilion` |
| Room name | `rng.pick(['Room','Studio','Lab','Hall'])` + letter + number | `Studio B3` |
| Civic venue | `faker.location.city()` + `rng.pick(['Community Club','Sports Complex','Public Library','Convention Centre'])` | `East Jodie Sports Complex` |

`description` — `htmlMessage(rng, len)`, declared `html: true`, so richness
scales with the `len` option (normal / long / stress).

**Field order** (both in `fields[]` and in every returned record object):
`name → type → description → venue → location → programme → startDate →
endDate → allDay → startTime → endTime`.

Note the existing `venue` field holds a **campus** (`BUSINESS_UNITS`:
`'Tampines Hub'`, `'Jurong East'`, …); `location` is the specific place, which
is why it sits directly after `venue`.

---

### Task 1: `location` + `description` on the School Date generator

**Files:**
- Modify: `src/core/generators/schoolDate.ts`
- Test: `src/core/__tests__/generators-schoolDate.test.ts`

**Interfaces:**
- Consumes: `htmlMessage(r: Rng, len: TextLen): string` from `src/core/text.ts`;
  `faker` from `src/core/faker-seed.ts`; `Rng` methods `int(min, max)` and
  `pick(readonly T[]): T` from `src/core/rng.ts`.
- Produces: two new keys on every School Date record —
  `location: string` and `description: string` (rich HTML) — and two new entries
  in `schoolDateGenerator.fields`:
  `{ key: 'description', label: 'Description', html: true }` and
  `{ key: 'location', label: 'Location' }`.
  Module-private helper `eventLocation(r: Rng): string` (not exported).

- [ ] **Step 1: Write the failing tests**

Append these three cases to the existing `describe('school date generator', …)`
block in `src/core/__tests__/generators-schoolDate.test.ts`. The file already
defines the `ctx()` helper and imports `seedFaker`, `generate`,
`schoolDateGenerator`, `Rng` and `Uniqueness` — reuse them, add no new imports.

```ts
  it('emits a non-empty location for every row, spanning several shapes', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 60, len: 'normal' }, ctx())
    for (const r of rows) expect((r.location as string).length).toBeGreaterThan(0)
    // The four shapes are distinguishable: a room name starts with one of the
    // room words, a civic venue ends with a civic suffix, a street address
    // starts with a house number. Seeing >1 shape proves the picker isn't
    // stuck on a single branch.
    const shape = (v: string) =>
      /^(Room|Studio|Lab|Hall) /.test(v)
        ? 'room'
        : /(Community Club|Sports Complex|Public Library|Convention Centre)$/.test(v)
          ? 'civic'
          : /^\d/.test(v)
            ? 'street'
            : 'landmark'
    expect(new Set(rows.map(r => shape(r.location as string))).size).toBeGreaterThan(1)
  })

  it('description is rich HTML', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 10, len: 'normal' }, ctx())
    for (const r of rows) {
      const html = r.description as string
      expect(html).toContain('<h2>')
      expect(html).toContain('<p>')
      expect(html).toContain('<ul>')
    }
  })

  it('description richness scales with len', () => {
    const normal = generate('schoolDate', { count: 5, len: 'normal', seed: 'abc' })
    const stress = generate('schoolDate', { count: 5, len: 'stress', seed: 'abc' })
    const total = (rows: { description?: unknown }[]) =>
      rows.reduce((n, r) => n + String(r.description).length, 0)
    expect(total(stress)).toBeGreaterThan(total(normal))
  })
```

The two pre-existing cases already cover the rest: `same seed yields identical
output` guards reproducibility for the new fields, and `emits every declared
field` iterates `schoolDateGenerator.fields` so it fails until both new metas
produce truthy values.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/core/__tests__/generators-schoolDate.test.ts`

Expected: FAIL. `emits a non-empty location…` and `description is rich HTML`
fail because `r.location` / `r.description` are `undefined`
(`Cannot read properties of undefined` / `expect(undefined).toContain`), and
`description richness scales with len` fails because `String(undefined).length`
is equal for both lengths. `emits every declared field` still passes at this
point (the new fields aren't declared yet).

- [ ] **Step 3: Write the implementation**

In `src/core/generators/schoolDate.ts`:

3a. Extend the imports at the top of the file. The file currently starts with:

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
```

Add two import lines after the `Generator` type import:

```ts
import type { Rng } from '../rng'
import { faker } from '../faker-seed'
import { htmlMessage } from '../text'
```

3b. Add the location helper just below the existing `NAMES_BY_TYPE` constant
(above `export const schoolDateGenerator`):

```ts
// Where the event physically happens: a specific place inside (or outside) the
// `venue` campus. Drawn from the seeded faker so it stays reproducible, in four
// shapes — street address, landmark, room name, external civic venue.
const LANDMARK_SUFFIX = ['Centre', 'Hall', 'Auditorium', 'Pavilion'] as const
const ROOM_WORD = ['Room', 'Studio', 'Lab', 'Hall'] as const
const CIVIC_SUFFIX = ['Community Club', 'Sports Complex', 'Public Library', 'Convention Centre'] as const
const ROOM_LETTER = 'ABCDEFGH'

function eventLocation(r: Rng): string {
  switch (r.int(0, 3)) {
    case 0:
      return faker.location.streetAddress()
    case 1:
      return `${faker.company.name()} ${r.pick(LANDMARK_SUFFIX)}`
    case 2:
      return `${r.pick(ROOM_WORD)} ${r.pick(ROOM_LETTER.split(''))}${r.int(1, 4)}`
    default:
      return `${faker.location.city()} ${r.pick(CIVIC_SUFFIX)}`
  }
}
```

3c. Declare the two new field metas in `fields`, in the approved order. Replace:

```ts
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'venue', label: 'Venue' },
    { key: 'programme', label: 'Programme' },
```

with:

```ts
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description', html: true },
    { key: 'venue', label: 'Venue' },
    { key: 'location', label: 'Location' },
    { key: 'programme', label: 'Programme' },
```

3d. Destructure `len` in `generate` and produce both values. Replace the
signature line:

```ts
  generate({ count }, { rng, uniq }) {
```

with:

```ts
  generate({ count, len }, { rng, uniq }) {
```

3e. Compute both values once per record, next to the existing `venue` /
`programme` lines, so the timed and all-day branches share them. After:

```ts
      const venue = rng.pick(BUSINESS_UNITS)
      // programme_id NULL (whole venue) ~60%, narrowed to one programme ~40%.
      const programme = rng.bool(0.4) ? rng.pick(PROGRAMMES) : 'Whole venue'
```

add:

```ts
      const location = eventLocation(rng)
      const description = htmlMessage(rng, len)
```

3f. Add both keys to **each** of the two returned object literals, in the
approved order. The timed branch becomes:

```ts
        return {
          name,
          type,
          description,
          venue,
          location,
          programme,
          startDate: fmtDate(start),
          endDate: fmtDate(start),
          allDay: 'No',
          startTime: fmtTime(startHour, 0),
          endTime: fmtTime(endHour, 0),
        }
```

and the all-day branch becomes:

```ts
      return {
        name,
        type,
        description,
        venue,
        location,
        programme,
        startDate: fmtDate(start),
        endDate: fmtDate(end),
        allDay: 'Yes',
        startTime: NONE,
        endTime: NONE,
      }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/core/__tests__/generators-schoolDate.test.ts`
Expected: PASS — all 8 cases (5 pre-existing + 3 new).

- [ ] **Step 5: Run the full suite and the type gate**

Run: `npm test`
Expected: PASS, no failures anywhere (notably `registry.test.ts` untouched and
still green).

Run: `npm run build`
Expected: `tsc -b && vite build` both succeed with no errors. If `tsc` reports
an unused import, the corresponding step above was skipped — fix it rather than
suppressing the error.

- [ ] **Step 6: Commit**

```bash
git add src/core/generators/schoolDate.ts src/core/__tests__/generators-schoolDate.test.ts
git commit -m "feat(school-date): add Location and rich-HTML Description fields"
```

---

## Self-review

**Spec coverage:** the approved design has exactly three requirements — the
`location` field with four faker-backed shapes (Task 1, step 3b + 3c + 3e),
the `description` rich-HTML field via `htmlMessage` (step 3c + 3e), and the
field order (steps 3c and 3f). All covered by the single task.

**Placeholder scan:** no TBD/TODO; every code step carries the literal code to
write, quoted against the current file contents.

**Type consistency:** `eventLocation(r: Rng): string` is declared in 3b and
called in 3e with `rng`, which is the `Rng` from `GenContext`. `htmlMessage(r:
Rng, len: TextLen)` is called with `(rng, len)`, matching
`src/core/text.ts`. `location` and `description` are plain strings, so each
record stays assignable to `Record = { [key: string]: FieldValue }`.
