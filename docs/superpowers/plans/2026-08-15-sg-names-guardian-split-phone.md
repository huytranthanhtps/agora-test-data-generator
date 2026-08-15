# Singapore Name Sets, Guardian Name Split & SG Phone Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make generated people reflect Singapore's population, split guardians into separate first/last name fields, and lock phone numbers to Singapore format.

**Architecture:** Replace the `Country` axis (us/uk/malaysia/vietnam) with a Singapore `Ethnicity` axis (chinese/malay/indian/eurasian), each mapped to a Latin-romanising faker locale. Chinese names attach to the `chinese` ethnicity. Guardians expose `firstName`/`lastName` instead of a combined `fullName`. Phone numbers already come only from `sgMobile`; add tests to guarantee that stays true.

**Tech Stack:** TypeScript (strict), @faker-js/faker, Vitest.

## Global Constraints

- Seeded reproducibility: randomness only via `ctx.rng` + seeded faker; keep the per-locale seed offset `s + i + 1` in `seedFaker`.
- No duplicate emails in a batch: unchanged (`ctx.uniq` `'email'` bucket).
- TS strict, `noUnusedLocals/Parameters` — remove now-dead `stripDiacritics` and unused faker imports.
- Branch `feat/parent-children-guardians`; local commits allowed, never push.
- Name-set decision (approved): chinese=`EN_HK`, malay=`ID_ID`, indian=`EN_IN`, eurasian=`EN_GB`. All are Latin-romanised (verified). `TA_IN` was rejected (falls back to generic English).

---

### Task 1: Replace Country axis with Singapore Ethnicity axis

**Files:**
- Modify: `src/core/faker-seed.ts` (locale map + imports)
- Modify: `src/core/names.ts` (Ethnicity type, makePerson, Person.ethnicity, drop stripDiacritics)
- Modify: `src/core/generators/family.ts` (chineseName attaches to `chinese`; email object uses `ethnicity`)
- Modify: `src/core/__tests__/names.test.ts` (Person fixture uses `ethnicity`)

**Interfaces:**
- Produces: `export const ETHNICITIES = ['chinese', 'malay', 'indian', 'eurasian'] as const`; `export type Ethnicity = (typeof ETHNICITIES)[number]`; `Person.ethnicity: Ethnicity` (replaces `country`). `LOCALE_FAKERS` keyed by `Ethnicity`.

- [ ] **Step 1: Failing test** — in `names.test.ts`, add:
```ts
import { makePerson, ETHNICITIES } from '@/core/names'
it('makePerson ethnicity is one of the Singapore ethnicities', () => {
  const p = makePerson(new Rng('s'))
  expect(ETHNICITIES).toContain(p.ethnicity)
})
```
Also update the existing `makeEmail` fixture object from `country: 'us'` to `ethnicity: 'chinese'`.

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/core/__tests__/names.test.ts`. Expected: FAIL (`ETHNICITIES`/`ethnicity` undefined).

- [ ] **Step 3: Update faker-seed.ts** —
```ts
import { faker, fakerEN_GB, fakerEN_HK, fakerEN_IN, fakerID_ID } from '@faker-js/faker'
// Singapore is multi-ethnic; each ethnicity maps to a Latin-romanising faker
// locale (faker has no en_SG). EN_HK gives romanised Chinese surnames
// (Lam/Mak/Cheng), ID_ID Malay/Indonesian names, EN_IN romanised Indian names,
// EN_GB English (Eurasian/expat). Native-script locales (zh_*/ta_IN) are avoided.
export const LOCALE_FAKERS = {
  chinese: fakerEN_HK,
  malay: fakerID_ID,
  indian: fakerEN_IN,
  eurasian: fakerEN_GB,
} as const
```
Keep the default `faker` import and the `seedFaker` offset loop unchanged.

- [ ] **Step 4: Update names.ts** — replace `COUNTRIES`/`Country` with `ETHNICITIES`/`Ethnicity`; `Person.country` → `Person.ethnicity`; drop `stripDiacritics` and the vietnam branch; rewrite the doc comment. New `makePerson`:
```ts
export const ETHNICITIES = ['chinese', 'malay', 'indian', 'eurasian'] as const
export type Ethnicity = (typeof ETHNICITIES)[number]

export interface Person {
  first: string; last: string; full: string
  gender: 'male' | 'female'; ethnicity: Ethnicity
}

/**
 * A person drawn from Singapore's main ethnic groups, names sourced from
 * Latin-romanising faker locales (see faker-seed.ts). Native-script locales are
 * avoided so every name stays ASCII-friendly.
 */
export function makePerson(rng: Rng): Person {
  const ethnicity = rng.pick(ETHNICITIES)
  const gender: 'male' | 'female' = rng.bool() ? 'male' : 'female'
  const f = LOCALE_FAKERS[ethnicity]
  const first = f.person.firstName(gender)
  const last = f.person.lastName()
  return { first, last, full: `${first} ${last}`, gender, ethnicity }
}
```

- [ ] **Step 5: Update family.ts** — `p.country === 'malaysia'` → `p.ethnicity === 'chinese'`; email object `{ ..., country: p.country }` → `{ ..., ethnicity: p.ethnicity }`.

- [ ] **Step 6: Run to verify pass** — `npx vitest run src/core/__tests__/names.test.ts src/core/__tests__/family.test.ts`. Expected: PASS.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(names): replace country axis with Singapore ethnicity name sets"`

---

### Task 2: Split guardian into first/last name fields

**Files:**
- Modify: `src/core/generators/family.ts` (Guardian type + makeGuardians)
- Modify: `src/core/generators/parent.ts` (GUARDIAN_FIELDS + nameKeys)
- Modify: `src/core/__tests__/family.test.ts` (guardian assertion)

**Interfaces:**
- Produces: `Guardian` no longer has `fullName`; `GUARDIAN_FIELDS` starts with `firstName`, `lastName`; guardians `members.nameKeys = ['firstName', 'lastName']`.

- [ ] **Step 1: Failing test** — in `family.test.ts`, replace the guardian `fullName` test with:
```ts
it('each guardian has separate first and last names on the mailinator.com domain', () => {
  seedFaker('s')
  const gs = makeGuardians(rng(), uniq())
  for (const g of gs) {
    expect(g.firstName).toBeTruthy()
    expect(g.lastName).toBeTruthy()
    expect(g.email).toMatch(/@mailinator\.com$/)
  }
})
```

- [ ] **Step 2: Run to verify fail** — `npx vitest run src/core/__tests__/family.test.ts`. Expected: PASS on the loop but the intent is the shape change; the real gate is the build (fullName removed). Proceed regardless — the failing signal is TS/build in Step 6.

- [ ] **Step 3: Update family.ts Guardian** — drop `fullName`:
```ts
export type Guardian = {
  firstName: string
  lastName: string
  gender: 'male' | 'female'
  relationship: string
  mobile: string
  email: string
}
```
In `makeGuardians`, remove `fullName: p.full` (keep `firstName: p.first`, `lastName: p.last`).

- [ ] **Step 4: Update parent.ts** — `GUARDIAN_FIELDS`:
```ts
const GUARDIAN_FIELDS: FieldMeta[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'gender', label: 'Gender' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
]
```
And the guardians field: `nameKeys: ['fullName']` → `nameKeys: ['firstName', 'lastName']`.

- [ ] **Step 5: Update RecordCard test if needed** — none (uses children only). Skip.

- [ ] **Step 6: Run tests + build** — `npm test && npm run build`. Expected: PASS, no TS error (no lingering `fullName` reference).

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(parent): split guardian into first/last name fields"`

---

### Task 3: Guarantee phone numbers are Singapore-only

**Files:**
- Modify: `src/core/__tests__/generators-people.test.ts`

**Interfaces:**
- Consumes: `sgMobile` output format `^[89]\d{3} \d{4}$` (already the only phone source).

- [ ] **Step 1: Failing/guard test** — add to `generators-people.test.ts`:
```ts
it('every parent and guardian mobile is a Singapore number', () => {
  seedFaker('s')
  const rows = parentGenerator.generate({ count: 20, len: 'normal' }, ctx())
  const sg = /^[89]\d{3} \d{4}$/
  for (const r of rows) {
    expect(r.mobile).toMatch(sg)
    for (const g of r.guardians) expect(g.mobile).toMatch(sg)
  }
})
```

- [ ] **Step 2: Run** — `npx vitest run src/core/__tests__/generators-people.test.ts`. Expected: PASS (phones already SG). This is a regression guard, not a red→green cycle; note that in the commit.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "test(phone): guard that parent/guardian mobiles are Singapore-format"`

---

### Task 4: Full verification gate

- [ ] **Step 1:** `npm test` — all pass.
- [ ] **Step 2:** `npm run build` — success, tsc clean (no unused `stripDiacritics`, no stale `country`/`fullName`).
- [ ] **Step 3:** Exercise: `generate('parent', {seed})` twice → deep-equal; print sample parent + children + guardian showing ethnicity-based names, guardian first/last, SG mobiles, mailinator.com emails.
- [ ] **Step 4:** Exercise UI via screenshot: guardian sub-card now shows First name + Last name rows.

## Self-Review

- **Coverage:** ethnicity axis (T1), guardian first/last (T2), SG phone guard (T3), verify (T4). Covered.
- **Placeholder scan:** none.
- **Type consistency:** `ETHNICITIES`/`Ethnicity`/`Person.ethnicity` defined in T1 and used in T1's family.ts edit; `Guardian` without `fullName` in T2 consumed by parent's `nameKeys`/`GUARDIAN_FIELDS`. `LOCALE_FAKERS` keys match `ETHNICITIES` exactly.
