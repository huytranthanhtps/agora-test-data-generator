# School Date — faker-backed Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace School Date's fixed name pools with the repo's standard
faker-backed `iconicName` builder, and delete the now-dead pools.

**Architecture:** `schoolDate` is the last generator still picking `name` from a
hand-written pool keyed by `type` (`NAMES_BY_TYPE`). `course`, `product`,
`klass` and `message` all use `iconicName(rng, len)` from `src/core/text.ts`.
This change brings `schoolDate` in line: `name` becomes
`uniq.ensure('schoolDate.name', () => iconicName(rng, len))`, `NAMES_BY_TYPE`
and the three `SCHOOL_*_NAMES` pools are deleted.

**Tech Stack:** TypeScript (strict), `@faker-js/faker` via
`src/core/faker-seed.ts`, Mulberry32 `Rng`, Vitest.

**Spec:** No spec file — classified **bounded**, design approved in chat.
Approved decisions: (a) `iconicName` alone, *not* a type-flavoured hybrid, so
`name` is no longer semantically tied to `type`; (b) delete the three dead
pools from `data.ts` rather than leaving them.

## Global Constraints

- **Seeded reproducibility (MANDATORY):** randomness only from `ctx.rng` and the
  seeded `faker`. `iconicName` already obeys this. (`docs/rules/architecture.md`)
- **No duplicates within a batch:** `name` stays wrapped in
  `ctx.uniq.ensure('schoolDate.name', …)` — keep the same bucket string.
- **TS strict + `noUnusedLocals`:** every import left dangling by this change
  **fails `npm run build`**. `noUnusedLocals` does NOT catch an unused *export*,
  so the `data.ts` deletions must be done by hand, not trusted to the compiler.
- **`registry.test.ts` must not be touched** — no generator added or removed,
  `schoolDate` keeps `shortcut: 8`.

## Behaviour change being accepted

Before, `type: 'Break'` always carried a break-flavoured name (`'Term 1 Break'`).
After, `name` is faker + lorem + at most one emoji and carries no type flavour.
This is intentional: the pool held only 26 names total, so any batch above 26
rows was already hitting `Uniqueness`'s random-suffix fallback, and pool names
never scaled with `len`. `iconicName` fixes both.

---

### Task 1: Swap `name` to `iconicName` and delete the dead pools

**Files:**
- Modify: `src/core/generators/schoolDate.ts`
- Modify: `src/core/data.ts:39-41` (delete three exports)
- Modify: `docs/rules/code-style.md` (stale KB reference — see step 5)
- Test: `src/core/__tests__/generators-schoolDate.test.ts`

**Interfaces:**
- Consumes: `iconicName(r: Rng, len: TextLen): string` from `src/core/text.ts`
  (already imported into `schoolDate.ts`? No — `htmlMessage` is; add
  `iconicName` to that same import).
- Produces: no signature change. `name` is still a plain `string` key on every
  record; `schoolDateGenerator.fields` is unchanged.

- [ ] **Step 1: Write the failing test**

Add this case to `describe('school date generator', …)` in
`src/core/__tests__/generators-schoolDate.test.ts`.

> **Corrected during execution.** This step originally specified a
> "name length totals are bigger at `len: 'stress'` than at `'normal'`" test.
> That test **passes against the old pool code**, for the wrong reason:
> `htmlMessage(rng, len)` consumes a *different number* of `rng` draws per
> `len`, so every later draw shifts and the generator picks different pool
> names — the totals differ by luck, not because `name` scaled. Any
> "output varies with `len`" assertion in this repo is suspect for the same
> reason. The real discriminator is the pool's **size**: it held 26 strings,
> so a 100-row batch forced `Uniqueness` into its fallback, which appends a
> `' XXXX'` 4-letter suffix (`src/core/uniqueness.ts`). An unbounded name
> source never needs it, so the suffix's absence is what proves the source
> changed. Measured on the old code: 74 of 100 names were suffixed.

```ts
  // Names come from `iconicName` (faker + lorem), not a fixed pool. The pool
  // held only 26 strings, so a batch this size forced `Uniqueness` into its
  // fallback, which appends a ' XXXX' 4-letter suffix. An unbounded name source
  // never needs that — so the absence of the suffix is what proves the source.
  it('names have enough variety that uniq never falls back to a suffix', () => {
    const rows = generate('schoolDate', { count: 100, len: 'normal', seed: 'variety' })
    const suffixed = rows.map(r => r.name as string).filter(n => / [A-Z]{4}$/.test(n))
    expect(suffixed).toEqual([])
    expect(new Set(rows.map(r => r.name)).size).toBe(100)
  })
```

The regex is safe: `cap()` in `src/core/text.ts` uppercases only a token's
first character, so no legitimate `iconicName` output has four consecutive
uppercase letters. Verified empirically over 30,000 samples across 400 seeds
x 3 lengths — 0 matches (the only all-caps token faker emits is `AI`, two
characters, never trailing).

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/core/__tests__/generators-schoolDate.test.ts`
Expected: FAIL with
`AssertionError: expected [ 'September Holidays BMBL', …(73) ] to deeply equal []`
— 74 of the 100 pool-drawn names carry the fallback suffix. The other 8 cases
still pass.

- [ ] **Step 3: Rewrite the generator's name source**

In `src/core/generators/schoolDate.ts`:

3a. Add `iconicName` to the existing `../text` import. Replace:

```ts
import { htmlMessage } from '../text'
```

with:

```ts
import { htmlMessage, iconicName } from '../text'
```

3b. Drop the three pool imports. Replace:

```ts
import {
  SCHOOL_DATE_TYPE,
  SCHOOL_EVENT_NAMES,
  SCHOOL_BREAK_NAMES,
  SCHOOL_CLOSURE_NAMES,
  BUSINESS_UNITS,
  PROGRAMMES,
} from '../data'
```

with:

```ts
import { SCHOOL_DATE_TYPE, BUSINESS_UNITS, PROGRAMMES } from '../data'
```

3c. Delete the `NAMES_BY_TYPE` block entirely:

```ts
// Name pool per date type.
const NAMES_BY_TYPE: Record<(typeof SCHOOL_DATE_TYPE)[number], readonly string[]> = {
  Event: SCHOOL_EVENT_NAMES,
  Break: SCHOOL_BREAK_NAMES,
  Closure: SCHOOL_CLOSURE_NAMES,
}
```

3d. Change the name draw. Replace:

```ts
      const name = uniq.ensure('schoolDate.name', () => rng.pick(NAMES_BY_TYPE[type]))
```

with:

```ts
      const name = uniq.ensure('schoolDate.name', () => iconicName(rng, len))
```

Note `type` is still used (it drives `timed` and the all-day span), so its
`const type = rng.pick(SCHOOL_DATE_TYPE)` line stays.

- [ ] **Step 4: Delete the dead pools from `data.ts`**

Delete these three lines (`src/core/data.ts:39-41`) in full:

```ts
export const SCHOOL_EVENT_NAMES = ['Sports Day', 'Open House', 'Parent-Teacher Conference', 'Graduation Ceremony', 'Annual Concert', 'Science Fair', 'Book Fair', 'Founders Day', 'Excursion Day', 'Report Card Day'] as const
export const SCHOOL_BREAK_NAMES = ['Term 1 Break', 'Term 2 Break', 'Term 3 Break', 'Half-Term Break', 'March Holidays', 'June Holidays', 'September Holidays', 'Year-End Break'] as const
export const SCHOOL_CLOSURE_NAMES = ['Public Holiday — Deepavali', 'Public Holiday — Hari Raya Puasa', 'Public Holiday — Chinese New Year', 'Public Holiday — National Day', 'Staff Training Day', 'Deep Cleaning Closure', 'Emergency Closure', 'Renovation Closure'] as const
```

Keep `SCHOOL_DATE_TYPE` (line 38) and the `sql/722_create_school_date.sql`
comment above it — both still apply.

- [ ] **Step 5: Fix the stale KB reference**

`docs/rules/code-style.md` cites `SCHOOL_CLOSURE_NAMES` as an example of a
Singapore-flavoured pool; that constant no longer exists. Replace:

```
  Singapore-flavoured (`BUSINESS_UNITS`, `SCHOOL_CLOSURE_NAMES`, …). Mixing the
```

with:

```
  Singapore-flavoured (`BUSINESS_UNITS`, `GRADES`, `SUBJECTS`, …). Mixing the
```

`BUSINESS_UNITS`, `GRADES` and `SUBJECTS` are all still live in `data.ts`.

- [ ] **Step 6: Run the tests and the type gate**

Run: `npx vitest run src/core/__tests__/generators-schoolDate.test.ts`
Expected: PASS, 9 cases.

Run: `npm test`
Expected: PASS, no failures. `registry.test.ts` untouched and green.

Run: `npm run build`
Expected: `tsc -b && vite build` succeed. A "declared but never used" error here
means a step above was half-applied — fix it, don't suppress it.

- [ ] **Step 7: Grep for surviving references**

Run: `grep -rn "SCHOOL_EVENT_NAMES\|SCHOOL_BREAK_NAMES\|SCHOOL_CLOSURE_NAMES\|NAMES_BY_TYPE" src/ docs/rules/`
Expected: no hits. (Hits under `docs/superpowers/plans/` are historical records
of past tasks and must be left alone.)

- [ ] **Step 8: Commit**

```bash
git add src/core/generators/schoolDate.ts src/core/data.ts docs/rules/code-style.md src/core/__tests__/generators-schoolDate.test.ts
git commit -m "feat(school-date): draw Name from iconicName, drop fixed pools"
```

---

## Self-review

**Spec coverage:** both approved decisions are covered — `iconicName` alone
(step 3d, no hybrid prefix) and deleting the pools (step 4). The stale KB
reference (step 5) is a consequence of step 4, not new scope.

**Placeholder scan:** none; every step quotes the literal text to change.

**Type consistency:** `iconicName(r: Rng, len: TextLen)` is called as
`iconicName(rng, len)`; `len` is already destructured in `generate` (added by
the previous task). `name` stays `string`, so records remain assignable to
`Record`.
