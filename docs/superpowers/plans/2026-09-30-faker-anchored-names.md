# Faker-Anchored Names Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Course / Class / Product names read `[faker value] [short lorem]` with no icons, using the faker data that best fits each model.

**Architecture:** Add `anchoredName(r, len, anchor)` to `src/core/text.ts` (capitalised anchor + the existing `len`-scaled lorem tail). Course anchors on `faker.book.genre()`, Class on `faker.animal.type()`, Product `name` and `variantName` on `faker.commerce.productName()`. With every caller icon-free, drop `NAME_ICONS` and the `icons` option and rename the now-misnamed `iconicName` to `fakerName` (still used, with its mixed anchor, by Update Message and Calendar).

**Tech Stack:** TypeScript, `@faker-js/faker` v10.5.0, Vitest.

**Spec:** none — user request + choices in chat (Course = `book.genre`, drop icons on `variantName` too). No faker module targets education, so these are nearest-fit sources (sampled: productName → "Fantastic Steel Chair", animal.type → "tiger", book.genre → "Fantasy").

## Global Constraints

- Randomness via `rng` + seeded faker only; a seed's output legitimately changes.
- `uniq`-wrapped names must not hit the ` XXXX` fallback at batch 100 (`docs/rules/architecture.md`); assert its absence.
- Commits English; never push without approval.

---

### Task 1: anchoredName + wire Course / Class / Product, drop icons

**Files:** Modify `src/core/text.ts`, `src/core/generators/{course,klass,product,message,calendar}.ts`, `docs/rules/{architecture,testing}.md` (rename), `src/core/__tests__/generators-calendar.test.ts:92` (comment); Test `src/core/__tests__/text.test.ts`.

**Interfaces:**
- Produces: `anchoredName(r: Rng, len: TextLen, anchor: string): string`; `fakerName(r: Rng, len: TextLen): string` (was `iconicName`, no options, never emits emoji).

- [ ] **Step 1: Failing tests** — replace the two `iconicName` describe blocks in `text.test.ts` (keep the `Update Message and Calendar titles carry no emoji` test, moved into the new block) with:

```ts
const EMOJI = /\p{Extended_Pictographic}/u
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

describe('entity names', () => {
  it('anchoredName is the capitalised anchor plus a lorem tail, with no emoji', () => {
    seedFaker('s')
    const r = new Rng('s')
    for (const len of ['normal', 'long', 'stress'] as const) {
      const name = anchoredName(r, len, 'fantasy')
      expect(name).toMatch(/^Fantasy( \S+)+$/)
      expect(EMOJI.test(name)).toBe(false)
    }
  })
  it('Update Message and Calendar titles carry no emoji', () => {
    for (const [key, field] of [['message', 'title'], ['calendar', 'name']] as const) {
      for (const row of generate(key, { count: 60, len: 'stress', seed: 'no-icons' })) {
        expect(EMOJI.test(String(row[field]))).toBe(false)
      }
    }
  })
  it('Course, Class and Product names are anchored on faker values, icon-free and unsuffixed', () => {
    seedFaker('anchor')
    const genres = new Set(Array.from({ length: 400 }, () => faker.book.genre().toLowerCase()))
    const animals = new Set(Array.from({ length: 400 }, () => faker.animal.type().toLowerCase()))
    const startsWithAny = (name: string, set: Set<string>) =>
      [...set].some((v) => name.toLowerCase().startsWith(`${v} `))
    for (const len of ['normal', 'long', 'stress'] as const) {
      const opts = { count: 100, len, seed: 'anchor' }
      const courses = generate('course', opts).map((r) => String(r.name))
      const classes = generate('class', opts).map((r) => String(r.className))
      const products = generate('product', opts).flatMap((r) => [String(r.name), String(r.variantName)])
      for (const n of courses) expect(startsWithAny(n, genres)).toBe(true)
      for (const n of classes) expect(startsWithAny(n, animals)).toBe(true)
      for (const n of [...courses, ...classes, ...products]) {
        expect(EMOJI.test(n)).toBe(false)
        expect(n).not.toMatch(/ [A-Z]{4}$/)
      }
      for (const n of products) expect(n.split(' ').length).toBeGreaterThanOrEqual(4)
      expect(new Set(courses).size).toBe(100)
      expect(new Set(classes).size).toBe(100)
    }
  })
})
```
(update imports: `faker` from `@/core/faker-seed`, `anchoredName` from `@/core/text`; drop `iconicName` and `BANNED_SYMBOLS`; `cap` only if used — remove if unused.)

- [ ] **Step 2:** `npx vitest run src/core/__tests__/text.test.ts` → FAIL (`anchoredName` not exported; generator names not anchored).
- [ ] **Step 3: Implement** in `text.ts`: extract the lorem tail

```ts
function loremTail(r: Rng, len: TextLen): string[] {
  const loremCount = len === 'stress' ? r.int(3, 5) : len === 'long' ? 2 : 1
  return faker.lorem.words(loremCount).split(/\s+/).map(cap)
}

/** `[anchor] [short lorem]` — the anchor is a faker value; lorem scales with `len` for uniqueness. */
export function anchoredName(r: Rng, len: TextLen, anchor: string): string {
  return [...capWords(anchor).split(/\s+/), ...loremTail(r, len)].join(' ')
}

/** Mixed-anchor name (Update Message title, Calendar name): faker anchor + lorem, no emoji. */
export function fakerName(r: Rng, len: TextLen): string {
  return [...fakerAnchor(r).split(/\s+/), ...loremTail(r, len)].join(' ')
}
```
delete `NAME_ICONS`, the old `iconicName` and its doc comment. Generators (`faker` from `'../faker-seed'`):
- `course.ts`: `uniq.ensure('course.name', () => anchoredName(rng, len, faker.book.genre()))`
- `klass.ts`: `uniq.ensure('class.name', () => anchoredName(rng, len, faker.animal.type()))`
- `product.ts`: `uniq.ensure('product.name', () => anchoredName(rng, len, faker.commerce.productName()))`, `variantName: anchoredName(rng, len, faker.commerce.productName())`
- `message.ts` / `calendar.ts`: `fakerName(rng, len)`.
Rename `iconicName` → `fakerName` in `docs/rules/architecture.md`, `testing.md` and the `generators-calendar.test.ts` comment; in `course.ts`/`product.ts` fix the "faker + lorem + icons" comments.
- [ ] **Step 4:** `npm test && npm run build` → PASS.
- [ ] **Step 5: Commit** `feat(names): anchor Course/Class/Product names on faker values, drop icons`.

## Self-Review

- Request covered: three models anchored, `variantName` included, no icons. `iconicName` callers all updated (course, klass, product ×2, message, calendar); `icons` option and `NAME_ICONS` removed. Names `anchoredName` / `fakerName` consistent.
