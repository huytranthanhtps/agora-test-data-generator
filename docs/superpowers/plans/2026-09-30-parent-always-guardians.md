# Parent Always Has Guardians Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every generated Parent row has at least one child and at least one guardian.

**Architecture:** `makeChildren` already draws 1–3 children, so only `makeGuardians` changes: its count goes from `rng.int(0, 2)` (0–2) to `rng.int(1, 2)` (1–2). Same draw count, so the rng sequence shape is unchanged; a seed's output still legitimately changes.

**Tech Stack:** TypeScript, Vitest.

**Spec:** none — user request in chat.

## Global Constraints

- Guardian emails keep going through the shared `uniq` `'email'` bucket (`docs/rules/architecture.md`).
- Commits English `type(scope): summary`; never push without approval.

---

### Task 1: Guardians are never empty

**Files:** Modify `src/core/generators/family.ts` (`makeGuardians`); Test `src/core/__tests__/family.test.ts:36-43`, `src/core/__tests__/generators-people.test.ts`.

**Interfaces:** `makeGuardians(rng: Rng, uniq: Uniqueness): Guardian[]` — unchanged signature, now returns 1–2 guardians.

- [ ] **Step 1: Failing tests.** In `family.test.ts` rename the guardians test to `makeGuardians yields 1-2 guardians with gender-consistent relationships` and change `expect(gs.length).toBeGreaterThanOrEqual(0)` to `toBeGreaterThanOrEqual(1)`. In `generators-people.test.ts` add:

```ts
  it('every parent has at least one child and one guardian', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 200, len: 'normal' }, ctx())
    for (const r of rows) {
      expect(r.children.length).toBeGreaterThanOrEqual(1)
      expect(r.guardians.length).toBeGreaterThanOrEqual(1)
    }
  })
```
- [ ] **Step 2:** `npx vitest run src/core/__tests__/family.test.ts src/core/__tests__/generators-people.test.ts` → FAIL (some rows have 0 guardians).
- [ ] **Step 3:** in `makeGuardians` change `const n = rng.int(0, 2)` to `const n = rng.int(1, 2)`.
- [ ] **Step 4:** `npm test && npm run build` → PASS.
- [ ] **Step 5: Commit** `feat(parent): always generate at least one guardian`.

## Self-Review

- Request covered (children already ≥1, guardians now ≥1). No new names introduced.
