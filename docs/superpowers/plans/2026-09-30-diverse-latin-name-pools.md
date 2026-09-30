# Diverse Latin-Script Name Pools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Malay/Indonesian (`id_ID`) name pool with a more diverse, Latin-script set of faker locales.

**Architecture:** `Person.ethnicity` becomes a "name-origin group": `chinese`, `indian`, `african`, `western`. `LOCALE_FAKERS` maps each group to a *pool* of faker locales; `makePerson` picks a group (`rng.pick(ETHNICITIES)`, uniform), then a locale from the group's pool (`rng.pick`). `seedFaker` seeds every unique locale once with the existing `s + i + 1` offset.

**Tech Stack:** TypeScript, `@faker-js/faker` v10.5.0, Vitest.

**Spec:** none — user-approved design in chat. Locale evidence (3000 draws each, seeded): `en_HK` 97 distinct Latin Chinese surnames; `en_NG` 309 distinct surnames + own first names; `en_ZA` own surname set; `en_GB` fine as the western pool; **`en_CA` is identical to base `en` (630/630 surnames) so it is NOT added**; `id_ID` dropped per user. All chosen locales are ≤0.1% non-ASCII.

## Global Constraints

- Randomness only via `rng` + seeded faker; never `Math.random()`.
- Every locale must be Latin-script and ship distinct person data (`docs/rules/architecture.md`).
- Keep the per-locale seed offset `s + i + 1`.
- Chinese-name (CJK) gating stays on `ethnicity === 'chinese'`.
- A seed's output legitimately changes (per-build reproducibility).
- Commits in English `type(scope): summary`; never push.

---

### Task 1: Name-origin pools

**Files:**
- Modify: `src/core/faker-seed.ts`
- Modify: `src/core/names.ts:6-27`
- Modify: `docs/rules/architecture.md` (Multi-ethnic names bullet)
- Test: `src/core/__tests__/names.test.ts`

**Interfaces:**
- Consumes: `Rng.pick<T>(arr: readonly T[]): T`, `Faker` type from `@faker-js/faker`.
- Produces: `ETHNICITIES = ['chinese', 'indian', 'african', 'western'] as const`; `type Ethnicity`; `LOCALE_FAKERS: Record<Ethnicity, readonly Faker[]>`; `makePerson(rng): Person` unchanged signature.

- [ ] **Step 1: Write the failing tests** — in `names.test.ts` add `seedFaker` import (`import { seedFaker } from '@/core/faker-seed'`) and, before the `makePerson ethnicity...` test:

```ts
  it('name-origin groups are chinese, indian, african and western', () => {
    expect([...ETHNICITIES]).toEqual(['chinese', 'indian', 'african', 'western'])
  })
  it('makePerson covers every group with printable-ASCII names', () => {
    seedFaker('origins')
    const r = new Rng('origins')
    const seen = new Set<string>()
    for (let i = 0; i < 400; i++) {
      const p = makePerson(r)
      seen.add(p.ethnicity)
      expect(p.full).toMatch(/^[\x20-\x7E]+$/)
    }
    expect([...seen].sort()).toEqual([...ETHNICITIES].sort())
  })
  it('makePerson is reproducible for the same seed', () => {
    const run = () => {
      seedFaker('repro')
      const r = new Rng('repro')
      return Array.from({ length: 30 }, () => makePerson(r).full)
    }
    expect(run()).toEqual(run())
  })
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/core/__tests__/names.test.ts`
Expected: FAIL on the group-list test (old list has `malay`/`eurasian`).

- [ ] **Step 3: Implement**

`src/core/faker-seed.ts`:

```ts
import { faker, fakerEN_GB, fakerEN_HK, fakerEN_IN, fakerEN_NG, fakerEN_ZA } from '@faker-js/faker'
import type { Faker } from '@faker-js/faker'
import type { Ethnicity } from './names'
import { hashSeed } from './rng'

export { faker }

// Person names are drawn from Latin-script faker locales grouped by name origin
// (faker has no en_SG locale). EN_HK gives romanised Chinese surnames, EN_IN
// romanised Indian names, EN_NG/EN_ZA African names, EN_GB English. Native-script
// locales (zh_*, ta_IN) are avoided so every name stays ASCII-friendly, and
// en_CA is omitted on purpose: it ships the same data as the base `en` locale.
export const LOCALE_FAKERS: Record<Ethnicity, readonly Faker[]> = {
  chinese: [fakerEN_HK],
  indian: [fakerEN_IN],
  african: [fakerEN_NG, fakerEN_ZA],
  western: [fakerEN_GB],
}

const ALL_LOCALES: readonly Faker[] = Object.values(LOCALE_FAKERS).flat()

export function seedFaker(seed?: string): void {
  if (seed && seed.length) {
    const s = hashSeed(seed)
    faker.seed(s)
    // Offset each locale so they don't emit correlated sequences, while staying
    // fully reproducible for a given seed.
    ALL_LOCALES.forEach((f, i) => f.seed(s + i + 1))
  } else {
    faker.seed() // reset to random
    ALL_LOCALES.forEach((f) => f.seed())
  }
}
```

`src/core/names.ts`: change the header comment + `ETHNICITIES` to `['chinese', 'indian', 'african', 'western'] as const` (comment: "name-origin groups; each maps to a pool of Latin-script faker locales, see faker-seed.ts LOCALE_FAKERS"), update the `makePerson` doc comment accordingly, and replace `const f = LOCALE_FAKERS[ethnicity]` with `const f = rng.pick(LOCALE_FAKERS[ethnicity])`.

`docs/rules/architecture.md`: rewrite the "Multi-ethnic names" bullet — `LOCALE_FAKERS` maps each `ETHNICITIES` group to a **pool** (`chinese`=`EN_HK`, `indian`=`EN_IN`, `african`=`EN_NG`+`EN_ZA`, `western`=`EN_GB`); keys MUST match `ETHNICITIES`; `makePerson` picks a locale from the pool via `rng.pick`; keep the `s + i + 1` offset over every unique locale; only Latin-script locales with distinct person data — `ta_IN` falls back to generic names and `en_CA` is identical to base `en`, so both are unusable; verify a candidate before adding it.

- [ ] **Step 4: Run tests and build**

Run: `npm test && npm run build`
Expected: all PASS, build green.

- [ ] **Step 5: Commit**

```bash
git add src/core/faker-seed.ts src/core/names.ts src/core/__tests__/names.test.ts docs/rules/architecture.md docs/superpowers/plans/2026-09-30-diverse-latin-name-pools.md
git commit -m "feat(names): replace Malay pool with diverse Latin-script name pools"
```

## Self-Review

- Coverage: id_ID/malay/eurasian removed, en_HK/en_NG/en_ZA/en_GB/en_IN pools, en_CA excluded with reason, seed offset kept, KB updated, chinese gating unchanged (`family.ts` untouched).
- Type consistency: `Ethnicity`, `LOCALE_FAKERS`, `ETHNICITIES` names identical across tasks; `import type` avoids a runtime circular import.
