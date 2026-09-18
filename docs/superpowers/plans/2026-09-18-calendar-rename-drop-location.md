# Calendar Rename + Drop Location Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the "School Date" generator to "Calendar" everywhere (key, label,
file, test file, data constant, knowledge base) and remove its `location` field.

**Architecture:** Two sequential edits to one generator plus its test and the
places that name it. Task 1 drops the `location` field and the now-dead
`eventLocation` helper (and the imports it alone used — TS `noUnusedLocals`
turns leftovers into build failures). Task 2 does the pure rename:
`schoolDate` → `calendar` for the generator key, label, module filename, test
filename, exported symbol, and the `SCHOOL_DATE_TYPE` constant. The generator's
shortcut (`8`), field order and generation logic are otherwise untouched.

**Tech Stack:** Vite + React 19 + TypeScript (strict, `noUnusedLocals`/
`noUnusedParameters`), Vitest, Tailwind.

**Spec:** No separate spec — the scope was settled directly with the user in
session: rename is a *full* rename (option "Đổi tên toàn bộ"), not label-only.

## Global Constraints

- **Seeded reproducibility:** randomness only from `ctx.rng` + the seeded
  `faker`; never `Math.random()` / `Date.now()` (`docs/rules/architecture.md`).
  Dropping `eventLocation` removes rng/faker draws, so **the byte output for a
  given seed changes**. That is intentional and permitted — the invariant is
  "same seed → identical batch *within one build*", which the determinism test
  still guards. Do **not** try to preserve old hashes.
- **No duplicates within a batch:** `name` stays wrapped in
  `ctx.uniq.ensure('…name', …)`. The bucket string changes with the rename; the
  wrapping does not.
- **The generator key is not user-visible** — it lives only in
  `useState('parent')` / `GENERATORS` and never in a URL, `localStorage`, or an
  export file. So renaming it breaks no persisted state.
- **Shortcut stays `8`** and `GENERATORS` stays length 8 — `registry.test.ts`
  asserts the contiguous `1..8` run and must keep passing untouched.
- **Historic plans under `docs/superpowers/plans/` are a record, not live docs**
  — do not rewrite older plan files. Only `docs/rules/*.md` gets updated.
- English for code, comments, commits, and this plan.
- Never `git push` / open a PR / merge. Local commits on the branch only.
- Branch already cut: `refactor/calendar-rename-drop-location`.

## File Structure

| File | Task | Responsibility after the change |
|------|------|--------------------------------|
| `src/core/generators/schoolDate.ts` → `src/core/generators/calendar.ts` | 1, 2 | The generator: 10 fields (no `location`), key `calendar`, label `Calendar`, export `calendarGenerator` |
| `src/core/__tests__/generators-schoolDate.test.ts` → `src/core/__tests__/generators-calendar.test.ts` | 1, 2 | Its tests: determinism, field shape, uniqueness, SQL date/time constraints, HTML description, no `location` |
| `src/core/registry.ts` | 2 | Imports `calendarGenerator` from `./generators/calendar` |
| `src/core/data.ts:35-38` | 2 | `CALENDAR_TYPE` replaces `SCHOOL_DATE_TYPE` |
| `docs/rules/architecture.md`, `docs/rules/code-style.md`, `docs/rules/testing.md` | 2 | Knowledge base stops naming a generator that no longer exists |

---

### Task 1: Drop the `location` field

**Files:**
- Modify: `src/core/generators/schoolDate.ts` (remove `eventLocation` + its four
  const pools + the `location` field/value; drop the imports only it used)
- Test: `src/core/__tests__/generators-schoolDate.test.ts` (replace the
  "emits a non-empty location…" test with an absence assertion)

**Interfaces:**
- Consumes: `Generator` (`../types`); `htmlMessage`, `iconicName` (`../text`);
  `BASE_DATE`, `addDays`, `fmtDate`, `fmtTime` (`./shared`); `SCHOOL_DATE_TYPE`,
  `BUSINESS_UNITS`, `PROGRAMMES` (`../data`).
- Produces: `schoolDateGenerator` with `fields` = `name, type, description,
  venue, programme, startDate, endDate, allDay, startTime, endTime` (10 entries,
  `location` gone) and rows carrying exactly those keys.

- [ ] **Step 1: Replace the location test with a failing absence test**

In `src/core/__tests__/generators-schoolDate.test.ts`, delete the whole
`it('emits a non-empty location for every row, spanning several shapes', …)`
block (including its `shape()` helper and comment) and put this in its place:

```ts
  it('no longer declares or emits a location field', () => {
    expect(schoolDateGenerator.fields.map(f => f.key)).not.toContain('location')
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) expect('location' in r).toBe(false)
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/__tests__/generators-schoolDate.test.ts -t 'no longer declares'`
Expected: FAIL — the array still contains `'location'`
(`expected [ 'name', 'type', …, 'location', … ] not to contain 'location'`).

- [ ] **Step 3: Remove the field, the helper, and its dead imports**

In `src/core/generators/schoolDate.ts`:

1. Delete the whole location block — the explanatory comment, the four pools
   (`LANDMARK_SUFFIX`, `ROOM_WORD`, `CIVIC_SUFFIX`, `ROOM_LETTER`) and the
   `eventLocation` function.
2. Delete `{ key: 'location', label: 'Location' },` from `fields`.
3. Delete `const location = eventLocation(rng)` and the two `location,`
   properties in the returned row objects.
4. Delete the two imports that only that code used — TS `noUnusedLocals` would
   otherwise fail `npm run build`:

```ts
import type { Rng } from '../rng'
import { faker } from '../faker-seed'
```

The top of the file must end up as:

```ts
import type { Generator } from '../types'
import { htmlMessage, iconicName } from '../text'
import { BASE_DATE, addDays, fmtDate, fmtTime } from './shared'
import { SCHOOL_DATE_TYPE, BUSINESS_UNITS, PROGRAMMES } from '../data'

// Empty-time placeholder for all-day rows (mirrors NULL start_time/end_time).
const NONE = '—'

export const schoolDateGenerator: Generator = {
```

- [ ] **Step 4: Run the file's tests to verify they pass**

Run: `npx vitest run src/core/__tests__/generators-schoolDate.test.ts`
Expected: PASS, all tests in the file (the "emits every declared field" test now
iterates 10 fields).

- [ ] **Step 5: Type-check**

Run: `npm run build`
Expected: green. A red `TS6133 'faker' is declared but its value is never read`
means Step 3.4 was skipped.

- [ ] **Step 6: Commit**

```bash
git add src/core/generators/schoolDate.ts src/core/__tests__/generators-schoolDate.test.ts
git commit -m "feat(school-date): drop the location field"
```

---

### Task 2: Rename School Date → Calendar

**Files:**
- Rename: `src/core/generators/schoolDate.ts` → `src/core/generators/calendar.ts`
- Rename: `src/core/__tests__/generators-schoolDate.test.ts` → `src/core/__tests__/generators-calendar.test.ts`
- Modify: `src/core/registry.ts` (import + `GENERATORS` entry)
- Modify: `src/core/data.ts:35-38` (`SCHOOL_DATE_TYPE` → `CALENDAR_TYPE`)
- Modify: `docs/rules/architecture.md`, `docs/rules/code-style.md`,
  `docs/rules/testing.md`

**Interfaces:**
- Produces: `calendarGenerator` exported from `@/core/generators/calendar`, with
  `key: 'calendar'`, `label: 'Calendar'`, `shortcut: 8`. `generate('calendar', …)`
  is the registry entry point; `generate('schoolDate', …)` must throw.
  `CALENDAR_TYPE` exported from `@/core/data`.

- [ ] **Step 1: Write the failing rename test**

Append to `describe('school date generator', …)` in
`src/core/__tests__/generators-schoolDate.test.ts` (the file is renamed in
Step 3; writing the test first keeps the red/green cycle honest):

```ts
  it('is registered as the calendar generator', () => {
    expect(schoolDateGenerator.key).toBe('calendar')
    expect(schoolDateGenerator.label).toBe('Calendar')
    expect(getGenerator('calendar')).toBe(schoolDateGenerator)
    expect(getGenerator('schoolDate')).toBeUndefined()
    expect(generate('calendar', { count: 3, len: 'normal', seed: 'abc' })).toHaveLength(3)
  })
```

and extend the existing import line at the top of the file:

```ts
import { generate, getGenerator } from '@/core/registry'
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/__tests__/generators-schoolDate.test.ts -t 'registered as the calendar'`
Expected: FAIL — `expected 'schoolDate' to be 'calendar'`.

- [ ] **Step 3: Rename the two files with git**

```bash
git mv src/core/generators/schoolDate.ts src/core/generators/calendar.ts
git mv src/core/__tests__/generators-schoolDate.test.ts src/core/__tests__/generators-calendar.test.ts
```

- [ ] **Step 4: Rename the constant in `src/core/data.ts`**

Replace lines 35-38 with:

```ts
// Calendar entry types. See sql/722_create_school_date.sql — an entry is an
// event, a term/half-term break, or a closure, shown on the parent-app calendar
// for a venue.
export const CALENDAR_TYPE = ['Event', 'Break', 'Closure'] as const
```

- [ ] **Step 5: Rename the symbols inside `src/core/generators/calendar.ts`**

Four edits:

```ts
import { CALENDAR_TYPE, BUSINESS_UNITS, PROGRAMMES } from '../data'

export const calendarGenerator: Generator = {
  key: 'calendar',
  label: 'Calendar',
  shortcut: 8,
```

and inside `generate`:

```ts
      const type = rng.pick(CALENDAR_TYPE)
      const name = uniq.ensure('calendar.name', () => iconicName(rng, len))
```

- [ ] **Step 6: Update `src/core/registry.ts`**

```ts
import { calendarGenerator } from './generators/calendar'

export const GENERATORS: Generator[] = [
  parentGenerator, courseGenerator, instanceGenerator,
  klassGenerator, productGenerator, messageGenerator, ticketGenerator,
  calendarGenerator,
].sort((a, b) => a.shortcut - b.shortcut)
```

- [ ] **Step 7: Update `src/core/__tests__/generators-calendar.test.ts`**

- Import: `import { calendarGenerator } from '@/core/generators/calendar'`
- `describe('school date generator', …)` → `describe('calendar generator', …)`
- Every `schoolDateGenerator.` → `calendarGenerator.`
- Every `generate('schoolDate', …)` → `generate('calendar', …)`
- In the new Step-1 test, the two `schoolDateGenerator` references become
  `calendarGenerator` and `getGenerator('calendar')` must be `calendarGenerator`.

- [ ] **Step 8: Run the full suite**

Run: `npm test`
Expected: PASS, every file — including `registry.test.ts` (still 8 generators,
shortcuts `1..8`, unchanged).

- [ ] **Step 9: Type-check**

Run: `npm run build`
Expected: green. A red `Cannot find module './generators/schoolDate'` means a
reference was missed; `grep -rn "schoolDate\|SCHOOL_DATE" src/` must come back
empty.

- [ ] **Step 10: Update the knowledge base (`docs/rules/`)**

These three files name a generator that no longer exists. Historic plans under
`docs/superpowers/plans/` are a record — leave them alone.

- `docs/rules/architecture.md`
  - In the `uniq` pool-sizing bullet: "School Date's `name` used a 26-string
    pool" → "Calendar's `name` used a 26-string pool"; the generator list
    "`course`, `product`, `klass`, `message` and now `schoolDate`" →
    "… and now `calendar`".
  - The "Not every field belongs in `uniq`" bullet cites School Date's
    `location`, which is gone. Replace that sentence with an example that still
    exists, keeping the point: a field whose real-world values legitimately
    repeat (e.g. Calendar's `venue` — many entries share a campus) must stay
    unwrapped. Same for lorem-backed rich text (`description`).
- `docs/rules/code-style.md`
  - The "Careful with the two place-like names" paragraph is obsolete (Calendar
    has only `venue` now). Delete it, but keep the surviving fact as one line:
    `VENUES` in `data.ts` is room-level and wired only into `klass.ts`.
- `docs/rules/testing.md`
  - `generate('schoolDate', …)` in the hash-check snippet → `generate('calendar', …)`.
  - "It was written to prove School Date's `name` scaled with `len`" →
    "Calendar's `name`".

- [ ] **Step 11: Verify no stale references remain**

Run: `grep -rn -i "schooldate\|school date\|SCHOOL_DATE" src/ docs/rules/`
Expected: no output.

- [ ] **Step 12: Commit**

```bash
git add -A src/ docs/rules/
git commit -m "refactor(calendar): rename the school-date generator to Calendar"
```

---

## Verification (Phase 6 gate — run after both tasks)

- [ ] `npm test` — full suite green, real output shown.
- [ ] `npm run build` — `tsc -b && vite build` green.
- [ ] **Seeded reproducibility:** `generate('calendar', { count: 10, len: 'normal', seed: 'abc' })`
      twice → deep-equal (the file's determinism test covers it; confirm it ran).
- [ ] **No duplicates:** a `count: 100` batch has 100 distinct `name`s and no
      ` XXXX` suffix (the variety test covers it; confirm it ran).
- [ ] **Exercise the change:** print one generated row and confirm it has no
      `location` key and that the app's entity list shows "Calendar" at
      shortcut 8.
