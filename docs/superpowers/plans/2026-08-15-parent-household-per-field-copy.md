# Parent Household — Per-Field Copyable Children/Guardians Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render each Parent's children and guardians as nested structured records where every attribute is an individual click-to-copy field (replacing the current single HTML rich block).

**Architecture:** `Record` values gain a `MemberRecord[]` variant so a parent row can carry `children`/`guardians` as arrays of plain string maps. `FieldMeta` gains an optional `members` spec describing how to render a member list (ref prefix, name keys, optional badge, per-member sub-fields). `RecordCard` branches on `field.members` to render nested member sub-cards, reusing the existing field-row markup so copy works identically at every level. `to-json` needs no change (native nesting); `to-csv` serialises array cells to JSON.

**Tech Stack:** React 19 + TypeScript (strict), Vite, Tailwind (mobile-first), Vitest + @testing-library/react (jsdom).

**Design source:** approved mockup https://claude.ai/code/artifact/d01d6f43-7df0-43ab-a996-4824f28ebde4 (dark-first Midnight Console, mobile-first, member fields stacked vertically one per row).

## Global Constraints

- Seeded reproducibility: randomness only via `ctx.rng` + seeded faker; same seed → identical batch.
- No duplicate emails in a batch: parent + children + guardians share the same `ctx.uniq` `'email'` bucket.
- Mobile-first: base styles target narrow screens; enhance with Tailwind `sm:`.
- TS strict, `noUnusedLocals/Parameters` — no dead code.
- Branch `feat/parent-children-guardians`; local commits allowed, never push.

---

### Task 1: Parent emits structured children/guardians arrays

**Files:**
- Modify: `src/core/types.ts` (Record value type, FieldMeta.members, MemberRecord, MemberSpec)
- Modify: `src/core/generators/family.ts` (drop HTML renderers; keep builders)
- Modify: `src/core/generators/parent.ts` (members field specs; return arrays)
- Modify: `src/core/__tests__/family.test.ts` (remove renderer tests)
- Modify: `src/core/__tests__/generators-people.test.ts` (array assertions)

**Interfaces:**
- Produces: `type MemberRecord = { [key: string]: string }`; `type FieldValue = string | MemberRecord[]`; `Record = { [key: string]: FieldValue }`; `interface MemberSpec { refPrefix: string; nameKeys: string[]; badgeKey?: string; fields: FieldMeta[] }`; `FieldMeta.members?: MemberSpec`.
- `parentGenerator.generate()` rows: `children: MemberRecord[]` (each `lastName === parent.lastName`), `guardians: MemberRecord[]`.
- `makeChildren`/`makeGuardians` unchanged signatures returning `Child[]`/`Guardian[]`.

- [ ] **Step 1: Rewrite family tests to the array shape (failing)** — in `generators-people.test.ts`, replace the html-field/children-string tests with: `children` is an array length 1–3, every `child.lastName === r.lastName`; `guardians` is an array length 0–2; no email duplicated across `r.email` + children + guardians emails. In `family.test.ts` remove the `childrenHtml`/`guardiansHtml` tests (keep builder tests).

- [ ] **Step 2: Run tests to verify they fail** — `npx vitest run src/core/__tests__/generators-people.test.ts src/core/__tests__/family.test.ts`. Expected: FAIL (children is a string / renderers still imported).

- [ ] **Step 3: Extend types** — in `src/core/types.ts`:
```ts
export type MemberRecord = { [key: string]: string }
export type FieldValue = string | MemberRecord[]
export type Record = { [key: string]: FieldValue }

export interface MemberSpec {
  refPrefix: string      // e.g. 'CHD' | 'GRD'
  nameKeys: string[]     // keys joined for the member's display name
  badgeKey?: string      // optional pill value (e.g. 'relationship')
  fields: FieldMeta[]    // per-member copyable sub-fields
}
export interface FieldMeta {
  key: string
  label: string
  html?: boolean
  members?: MemberSpec
}
```

- [ ] **Step 4: Drop HTML renderers from family.ts** — remove `childrenHtml`, `guardiansHtml`, `personLi`, `familyBlock`, `cap`, `esc`, and the now-unused imports. Keep `Child`, `Guardian`, `makeChildren`, `makeGuardians`.

- [ ] **Step 5: Wire parent.ts to structured arrays** — define per-member field specs and return arrays:
```ts
const CHILD_FIELDS = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'preferredName', label: 'Preferred name' },
  { key: 'chineseName', label: 'Chinese name' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'Date of birth' },
  { key: 'age', label: 'Age' },
  { key: 'gradeLevel', label: 'Grade level' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'email', label: 'Email' },
]
const GUARDIAN_FIELDS = [
  { key: 'fullName', label: 'Full name' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'gender', label: 'Gender' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
]
```
Fields entries replace the old html blocks:
```ts
{ key: 'children', label: 'Children', members: { refPrefix: 'CHD', nameKeys: ['firstName', 'lastName'], fields: CHILD_FIELDS } },
{ key: 'guardians', label: 'Guardians', members: { refPrefix: 'GRD', nameKeys: ['fullName'], badgeKey: 'relationship', fields: GUARDIAN_FIELDS } },
```
In `generate()` return `children: makeChildren(rng, uniq, p.last, len)` and `guardians: makeGuardians(rng, uniq)` (arrays, not HTML).

- [ ] **Step 6: Run tests to verify they pass** — `npx vitest run src/core/__tests__/generators-people.test.ts src/core/__tests__/family.test.ts`. Expected: PASS.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "refactor(parent): emit children/guardians as structured records, not HTML"`

---

### Task 2: CSV export serialises member-array cells

**Files:**
- Modify: `src/export/to-csv.ts`
- Modify: `src/export/__tests__/export.test.ts`

**Interfaces:**
- Consumes: `Record`/`FieldValue` from Task 1.
- Produces: `toCSV` writes a JSON string for array-valued cells; JSON export unchanged.

- [ ] **Step 1: Failing test** — add to `export.test.ts`: a row `{ a: '1', kids: [{ n: 'x' }] }` with fields `[{key:'a',label:'A'},{key:'kids',label:'Kids'}]` → second column equals `cell(JSON.stringify([{n:'x'}]))` (quoted because it contains commas/quotes).

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/export/__tests__/export.test.ts`. Expected: FAIL (array coerced to `[object Object]`).

- [ ] **Step 3: Implement** — in `to-csv.ts`, stringify non-string values before `cell`:
```ts
const raw = r[f.key]
const v = typeof raw === 'string' ? raw : raw == null ? '' : JSON.stringify(raw)
return cell(v)
```

- [ ] **Step 4: Run to verify pass** — `npx vitest run src/export/__tests__/export.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(export): serialise nested member arrays in CSV cells"`

---

### Task 3: RecordCard renders member sub-cards with per-field copy

**Files:**
- Modify: `src/components/RecordCard.tsx`
- Create: `src/components/__tests__/RecordCard.test.tsx`

**Interfaces:**
- Consumes: `FieldMeta.members`, `MemberRecord[]` from Task 1; existing `onCopy(text, id)` prop.
- Produces: for a `members` field, renders one sub-card per member; each sub-field value is a `<button>` that calls `onCopy(value, uniqueId)`.

- [ ] **Step 1: Failing test** — `RecordCard.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordCard } from '@/components/RecordCard'

const fields = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'children', label: 'Children', members: { refPrefix: 'CHD', nameKeys: ['firstName', 'lastName'], fields: [ { key: 'firstName', label: 'First name' }, { key: 'email', label: 'Email' } ] } },
]
const row = { firstName: 'Quyet', lastName: 'Pham', children: [ { firstName: 'Amy', email: 'amy.pham@maildrop.cc' } ] }
const base = { index: 0, entityLabel: 'Parent', entityKey: 'parent', copiedId: null, onCopyRow: () => {}, onCopyRich: () => {}, onPreview: () => {} }

describe('RecordCard members', () => {
  it('renders each nested child field as a copyable value', () => {
    const onCopy = vi.fn()
    render(<RecordCard {...base} row={row} fields={fields} onCopy={onCopy} />)
    const btn = screen.getByRole('button', { name: /amy\.pham@maildrop\.cc/ })
    fireEvent.click(btn)
    expect(onCopy).toHaveBeenCalledWith('amy.pham@maildrop.cc', expect.any(String))
  })
})
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/components/__tests__/RecordCard.test.tsx`. Expected: FAIL (child email not rendered).

- [ ] **Step 3: Implement member rendering** — add a string guard `asStr` and, in the fields map, branch on `f.members`. Extract the existing label+value+copy row into a local `CopyRow` component and reuse it for both parent fields and member sub-fields. For a members field render:
  - a section header row: `f.label` + count (`(n)`), using `categoryColorVar('rich')` dot;
  - for each `member` at index `m`: a bordered sub-card (`rounded-lg border border-line bg-surface2`) with a header (initials chip from `nameKeys` joined via `initialsFrom`, ref `${refPrefix}-${String(m+1).padStart(2,'0')}`, optional badge `member[badgeKey]`), then `members.fields.map` of `CopyRow` with value `asStr(member[sub.key])` and id `${index}:${f.key}:${m}:${sub.key}`.
  - Skip empty string sub-fields (e.g. blank Chinese name) so members stay compact.
  - Use the existing row grid `grid-cols-[84px_1fr] sm:grid-cols-[100px_1fr]` for vertical one-field-per-row layout (mobile-first).
  - Guard the header `chipName` and normal/html branches with `asStr(...)` so TS accepts `FieldValue`.

- [ ] **Step 4: Run to verify pass** — `npx vitest run src/components/__tests__/RecordCard.test.tsx`. Expected: PASS.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(ui): render nested children/guardians as per-field copyable sub-cards"`

---

### Task 4: Full verification gate

**Files:** none (verification only)

- [ ] **Step 1: Full suite** — `npm test`. Expected: all pass.
- [ ] **Step 2: Build/typecheck** — `npm run build`. Expected: success, no TS errors.
- [ ] **Step 3: Invariants** — run a throwaway script: `generate('parent', {count, len, seed})` twice with same seed → deep-equal; collect all emails (parent + nested) → no duplicates; children lastName === parent lastName. Show output.
- [ ] **Step 4: Exercise UI** — via `/run` or a screenshot, confirm a parent card shows children/guardians sub-cards and clicking a nested value copies it.
- [ ] **Step 5: Commit** (if any verify-driven fixes) — otherwise none.

## Self-Review

- **Spec coverage:** structured arrays (T1), JSON native + CSV serialise (T2), per-field copy UI (T3), mobile-first vertical rows (T3 via Tailwind grid), invariants (T4). Covered.
- **Placeholder scan:** none.
- **Type consistency:** `MemberRecord`/`MemberSpec`/`FieldValue` defined in T1 and consumed verbatim in T2/T3; `refPrefix`/`nameKeys`/`badgeKey`/`fields` names consistent; `asStr`/`CopyRow` introduced in T3 only.
