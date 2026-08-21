# Parent: yopmail email, no child email, single-parent-from-name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Parent-section emails to `@yopmail.com`, drop the child email field, and let the user pin a parent's first/last name to generate that single parent (with children/guardians) instead of a random batch.

**Architecture:** Three localized changes to the existing `parent` flow. (1) Swap the shared `EMAIL_DOMAIN` constant (only `makeEmail`, used by parent + guardian, reads it). (2) Remove `email` from the `Child` type / `makeChildren` / `CHILD_FIELDS`. (3) Add optional `parentFirstName`/`parentLastName` to `GenerateOptions`; when both are non-empty the parent generator emits exactly one record using that name (children inherit the surname), otherwise it keeps the current random-batch behavior. Console gets two text inputs shown only for the `parent` entity, wired through `use-generator`.

**Tech Stack:** Vite + React 19 + TypeScript (strict, `noUnused*`), Vitest.

**Spec:** In-chat bounded design approved 2026-08-21 (no separate spec file — bounded task).

## Global Constraints

- Seeded reproducibility: same non-empty seed → identical batch. Randomness only via `ctx.rng` + seeded `faker`; never bare `Math.random()`.
- No duplicates within a batch: unique fields route through `ctx.uniq.ensure(...)`; parent + guardian emails share the one `'email'` bucket.
- TS strict + `noUnusedLocals`/`noUnusedParameters`: no dead code. `import type` for type-only imports.
- Record/member shapes are `type` aliases (implicit index signature), never `interface`.
- Git: work on branch `feat/parent-email-and-from-name` (already cut from `origin/main`); local commits fine, no push without approval.

---

### Task 1: Drop the child email field

**Files:**
- Modify: `src/core/generators/family.ts` (`Child` type ~18-29; `makeChildren` ~41-71)
- Modify: `src/core/generators/parent.ts` (`CHILD_FIELDS` ~24-35)
- Test: `src/core/__tests__/family.test.ts` (replace the child-email test ~22-26)

**Interfaces:**
- Produces: `Child` type no longer has an `email` key; `makeChildren(rng, uniq, parentLast, len)` signature unchanged (still takes `uniq` — guardians/parent still dedup emails through it).

- [ ] **Step 1: Rewrite the child-email test as a no-email assertion**

In `src/core/__tests__/family.test.ts`, replace the test at lines 22-26 with:

```ts
  it('children carry no email field', () => {
    seedFaker('s')
    const kids = makeChildren(rng(), uniq(), 'Tan', 'normal')
    for (const k of kids) expect('email' in k).toBe(false)
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run src/core/__tests__/family.test.ts -t "carry no email"`
Expected: FAIL — child objects still have an `email` key.

- [ ] **Step 3: Remove email from the Child type and makeChildren**

In `src/core/generators/family.ts`:
- Delete `  email: string` from the `Child` type.
- Delete the email line in `makeChildren` (the `const email = makeEmail({ ...p, last: parentLast, full: \`${p.first} ${parentLast}\` }, uniq)` line) and the `email,` entry in the returned object.
- The `uniq` parameter is still used by parent/guardian, but `makeChildren` no longer uses it. Since `noUnusedParameters` is on, either keep it consumed or rename. It IS part of the shared signature and parent passes it; leave the param but confirm it is not flagged — `noUnusedParameters` ignores parameters only when followed by a used one OR prefixed with `_`. It is NOT followed by a used one here (`len` follows and is used), so `uniq` unused would fail. **Prefix it: rename the parameter to `_uniq`** and update its (now removed) references. Update the doc comment if it mentions the email.

Resulting `makeChildren` signature: `makeChildren(rng: Rng, _uniq: Uniqueness, parentLast: string, len: TextLen): Child[]`.

- [ ] **Step 4: Remove the child email column**

In `src/core/generators/parent.ts`, delete `  { key: 'email', label: 'Email' },` from `CHILD_FIELDS`.

- [ ] **Step 5: Run the family + build checks**

Run: `npx vitest run src/core/__tests__/family.test.ts` → PASS.
Run: `npm run build` → green (catches the `uniq`/`makeEmail` unused-symbol fallout).

- [ ] **Step 6: Commit**

```bash
git add src/core/generators/family.ts src/core/generators/parent.ts src/core/__tests__/family.test.ts
git commit -m "feat(family): drop email field from children"
```

---

### Task 2: Move Parent-section email domain to yopmail.com

**Files:**
- Modify: `src/core/data.ts:33` (`EMAIL_DOMAIN`)
- Modify: `src/core/names.ts` (comment ~47 referencing mailinator)
- Test: `src/core/__tests__/names.test.ts:20`, `src/core/__tests__/generators-people.test.ts:24-28`, `src/core/__tests__/family.test.ts:43-52` (guardian regex)

**Interfaces:**
- Produces: parent + guardian emails now match `/@yopmail\.com$/`.

- [ ] **Step 1: Update the three surviving mailinator assertions to yopmail**

`src/core/__tests__/names.test.ts` line 20 → `expect(e1).toMatch(/@yopmail\.com$/)`.

`src/core/__tests__/generators-people.test.ts` — the test title and regex at 24-28:
```ts
  it('parent email is firstname.lastname on the yopmail domain', () => {
    seedFaker('s')
    const [r] = parentGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.email).toMatch(/^[a-z0-9.]+@yopmail\.com$/)
  })
```

`src/core/__tests__/family.test.ts` — the guardian test (title + regex ~43-50): rename `on the mailinator.com domain` → `on the yopmail.com domain` and change `expect(g.email).toMatch(/@mailinator\.com$/)` → `/@yopmail\.com$/`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/core/__tests__/names.test.ts src/core/__tests__/generators-people.test.ts src/core/__tests__/family.test.ts`
Expected: FAIL — emails still end `@mailinator.com`.

- [ ] **Step 3: Change the constant + comment**

`src/core/data.ts:33`: `export const EMAIL_DOMAIN = 'yopmail.com'`.
`src/core/names.ts` ~47: update the comment so it no longer says "mailinator.com" (e.g. "yopmail.com is a disposable inbox service…").

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/core/__tests__/names.test.ts src/core/__tests__/generators-people.test.ts src/core/__tests__/family.test.ts` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/core/data.ts src/core/names.ts src/core/__tests__/names.test.ts src/core/__tests__/generators-people.test.ts src/core/__tests__/family.test.ts
git commit -m "feat(names): use yopmail.com for parent/guardian emails"
```

---

### Task 3: Single-parent-from-name generation

**Files:**
- Modify: `src/core/types.ts` (`GenerateOptions`)
- Modify: `src/core/generators/parent.ts` (`generate`, imports)
- Test: `src/core/__tests__/generators-people.test.ts`

**Interfaces:**
- Consumes: `Person` type + `ETHNICITIES` from `src/core/names.ts`.
- Produces: `GenerateOptions` gains `parentFirstName?: string`, `parentLastName?: string`. `parentGenerator.generate` emits exactly one row when both are non-empty (trimmed); parent `firstName`/`lastName` equal the inputs; every child `lastName` equals the input last name.

- [ ] **Step 1: Write the failing tests**

Append to `src/core/__tests__/generators-people.test.ts` inside `describe('people generators', …)`:

```ts
  it('single-parent mode emits exactly one row using the given name', () => {
    seedFaker('s')
    const rows = parentGenerator.generate(
      { count: 5, len: 'normal', parentFirstName: 'Mai', parentLastName: 'Nguyen' },
      ctx(),
    )
    expect(rows.length).toBe(1)
    expect(rows[0].firstName).toBe('Mai')
    expect(rows[0].lastName).toBe('Nguyen')
    for (const k of rows[0].children) expect(k.lastName).toBe('Nguyen')
  })

  it('single-parent mode is deterministic for a given seed', () => {
    const opts = { count: 5, len: 'normal', seed: 'abc', parentFirstName: 'Mai', parentLastName: 'Nguyen' }
    seedFaker('abc'); const a = parentGenerator.generate(opts, { rng: new Rng('abc'), uniq: new Uniqueness(new Rng('abc')) })
    seedFaker('abc'); const b = parentGenerator.generate(opts, { rng: new Rng('abc'), uniq: new Uniqueness(new Rng('abc')) })
    expect(a).toEqual(b)
  })

  it('blank name fields keep the random batch behavior', () => {
    seedFaker('s')
    const rows = parentGenerator.generate(
      { count: 4, len: 'normal', parentFirstName: '  ', parentLastName: '' },
      ctx(),
    )
    expect(rows.length).toBe(4)
  })
```

Note `rows[0].children` is typed `Child[]` because `parentGenerator` is `Generator<ParentRow>`. If TS complains about `.children` on the row, cast via the generator's own type — it already returns `ParentRow[]`.

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/core/__tests__/generators-people.test.ts -t "single-parent"`
Expected: FAIL — `parentFirstName`/`parentLastName` not accepted / count not overridden (also a TS error until Step 3).

- [ ] **Step 3: Extend GenerateOptions**

In `src/core/types.ts`, add to `GenerateOptions`:

```ts
  parentFirstName?: string
  parentLastName?: string
```

- [ ] **Step 4: Implement single-parent mode**

In `src/core/generators/parent.ts`:
- Extend imports: `import { makePerson, makeEmail, sgMobile, sgPostcode, ETHNICITIES } from '../names'` and add `import type { Person } from '../names'`.
- Replace the `generate` signature + person construction:

```ts
  generate({ count, len, parentFirstName, parentLastName }, { rng, uniq }) {
    const first = parentFirstName?.trim()
    const last = parentLastName?.trim()
    const fixed = first && last ? { first, last } : null
    const n = fixed ? 1 : count
    return Array.from({ length: n }, () => {
      const p: Person = fixed
        ? {
            first: fixed.first,
            last: fixed.last,
            full: `${fixed.first} ${fixed.last}`,
            gender: rng.bool() ? 'male' : 'female',
            ethnicity: rng.pick(ETHNICITIES),
          }
        : makePerson(rng)
      // …rest of the body is unchanged (email, mobile, address, postcode, children, guardians)…
```

Keep the remainder of the body exactly as-is (it already derives everything from `p`).

- [ ] **Step 5: Run tests + build**

Run: `npx vitest run src/core/__tests__/generators-people.test.ts` → PASS.
Run: `npm run build` → green.

- [ ] **Step 6: Commit**

```bash
git add src/core/types.ts src/core/generators/parent.ts src/core/__tests__/generators-people.test.ts
git commit -m "feat(parent): generate a single parent from a given name"
```

---

### Task 4: Wire the name inputs into the Console

**Files:**
- Modify: `src/hooks/use-generator.ts`
- Modify: `src/components/Console.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `GenerateOptions.parentFirstName/parentLastName` (Task 3).
- Produces: `use-generator` exposes `parentFirstName`, `setParentFirstName`, `parentLastName`, `setParentLastName`. `Console` gains matching props + `showParentName: boolean`.

- [ ] **Step 1: Add state + wiring in use-generator**

In `src/hooks/use-generator.ts`:
- Add state: `const [parentFirstName, setParentFirstName] = useState('')` and `const [parentLastName, setParentLastName] = useState('')`.
- In `run`, pass `parentFirstName, parentLastName` into `generate(...)` and add both to the `useCallback` dep array.
- Return `parentFirstName, setParentFirstName, parentLastName, setParentLastName` from the hook.

- [ ] **Step 2: Add the inputs to Console**

In `src/components/Console.tsx`:
- Extend `Props` with `parentFirstName: string; setParentFirstName: (s: string) => void; parentLastName: string; setParentLastName: (s: string) => void; showParentName: boolean`.
- Render, after the Seed `Field` (mirroring the existing text-input styling), guarded by `p.showParentName`:

```tsx
{p.showParentName && (
  <>
    <Field label="Parent first name">
      <input
        value={p.parentFirstName}
        onChange={(e) => p.setParentFirstName(e.target.value)}
        placeholder="random"
        className="h-9 w-full rounded-lg border border-line bg-surface2 px-3 font-mono text-[13px] text-ink transition-colors placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none sm:w-36"
      />
    </Field>
    <Field label="Parent last name">
      <input
        value={p.parentLastName}
        onChange={(e) => p.setParentLastName(e.target.value)}
        placeholder="random"
        className="h-9 w-full rounded-lg border border-line bg-surface2 px-3 font-mono text-[13px] text-ink transition-colors placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none sm:w-36"
      />
    </Field>
  </>
)}
```

(Optional readout: when both are set, the command line can show `--parent "<first> <last>"`. Skip if it clutters.)

- [ ] **Step 3: Pass props from App**

In `src/App.tsx`, on `<Console …>`: add
`parentFirstName={g.parentFirstName}` `setParentFirstName={g.setParentFirstName}`
`parentLastName={g.parentLastName}` `setParentLastName={g.setParentLastName}`
`showParentName={g.entityKey === 'parent'}`.

- [ ] **Step 4: Build**

Run: `npm run build` → green (type gate for all four Console props being threaded).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/use-generator.ts src/components/Console.tsx src/App.tsx
git commit -m "feat(console): add parent first/last name inputs for parent entity"
```

---

## Self-Review

- **Spec coverage:** (1) yopmail email → Task 2. (2) child no email → Task 1. (3) single-parent-from-name → Tasks 3 (core) + 4 (UI). All three covered.
- **Placeholders:** none — every code step carries real code.
- **Type consistency:** `parentFirstName`/`parentLastName` names identical across types.ts, parent.ts, use-generator.ts, Console.tsx, App.tsx. `makeChildren` param renamed to `_uniq` consistently. `Person`/`ETHNICITIES` imports match `names.ts` exports.
- **Ordering:** Task 1 removes the child-email test before Task 2 flips the domain, so no assertion is left pointing at a removed field.
- **Invariants:** determinism guarded by the new single-parent determinism test; no-duplicate email untouched (parent + guardian still share the `'email'` bucket; children no longer draw from it).
