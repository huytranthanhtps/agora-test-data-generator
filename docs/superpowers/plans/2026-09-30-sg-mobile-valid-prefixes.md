# Singapore Mobile Valid Prefixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop `sgMobile()` emitting `99xx xxxx` numbers, which are not valid Singapore mobile numbers.

**Architecture:** `sgMobile` (`src/core/names.ts`) picks the leading digit (8 or 9) then 7 random digits. Constrain the *second* digit to 0–8 when the leading digit is 9; leave the 8-prefix unconstrained. Randomness stays on `rng`, so seeded reproducibility is preserved (a seed's output legitimately changes — see `docs/rules/architecture.md`).

**Tech Stack:** TypeScript, Vitest.

**Spec:** none — a bug fix. Research basis: Singapore numbering scheme, `8xxx xxxx` and `9yxx xxxx` are mobile/data/prepaid with `y` = 0–8 only ([Wikipedia: Telephone numbers in Singapore](https://en.wikipedia.org/wiki/Telephone_numbers_in_Singapore), "Numbering scheme and format"). `99x` also collides with emergency codes 993/995/999. IMDA's own PDF could not be machine-read, so this rests on Wikipedia.

## Global Constraints

- Output format stays `NXXX XXXX` (4-4 grouping), 8 digits.
- Randomness only via `rng` — never `Math.random()`.
- Commits in English, `type(scope): summary`; never push.

---

### Task 1: Exclude 99xx from sgMobile

**Files:**
- Modify: `src/core/names.ts:53-57`
- Test: `src/core/__tests__/names.test.ts:7-10`

**Interfaces:**
- Consumes: `Rng.pick`, `Rng.int(min, max)` (inclusive) from `src/core/rng.ts`.
- Produces: `sgMobile(rng: Rng): string` — unchanged signature; callers in `parent.ts` and `family.ts` need no edits.

- [ ] **Step 1: Write the failing test**

Replace the `mobile matches SG format` test in `src/core/__tests__/names.test.ts` with:

```ts
  it('mobile matches SG format', () => {
    const r = new Rng('s')
    for (let i = 0; i < 50; i++) expect(sgMobile(r)).toMatch(/^[89]\d{3} \d{4}$/)
  })
  it('mobile follows the SG numbering plan: 8xxx or 9yxx with y in 0-8', () => {
    const r = new Rng('plan')
    const seen = new Set<string>()
    for (let i = 0; i < 2000; i++) {
      const m = sgMobile(r)
      expect(m).toMatch(/^(8\d{3}|9[0-8]\d{2}) \d{4}$/)
      seen.add(m.slice(0, 2))
    }
    // Every valid two-digit prefix is reachable (80-89 and 90-98), 99 never is.
    expect(seen.has('99')).toBe(false)
    expect(seen.size).toBe(19)
  })
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/core/__tests__/names.test.ts`
Expected: FAIL on the new test (a `99xx` number matches neither branch of the regex).

- [ ] **Step 3: Write minimal implementation**

In `src/core/names.ts`, replace `sgMobile` with:

```ts
// Singapore plan: 8xxx xxxx, or 9yxx xxxx with y in 0-8 (99xx is not a mobile range).
export function sgMobile(rng: Rng): string {
  const first = rng.pick(['8', '9'] as const)
  const second = rng.int(0, first === '9' ? 8 : 9)
  const rest = Array.from({ length: 6 }, () => rng.int(0, 9)).join('')
  return `${first}${second}${rest.slice(0, 2)} ${rest.slice(2)}`
}
```

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: all PASS, build green.

- [ ] **Step 5: Commit**

```bash
git add src/core/names.ts src/core/__tests__/names.test.ts docs/superpowers/plans/2026-09-30-sg-mobile-valid-prefixes.md
git commit -m "fix(names): exclude 99xx from generated Singapore mobile numbers"
```

## Self-Review

- Coverage: 99xx exclusion (Task 1), 8-range unchanged, both callers unaffected, determinism covered by the existing `registry.test.ts` determinism test.
- No placeholders; `sgMobile` signature consistent throughout.
