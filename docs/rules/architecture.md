# Architecture — the `src/core` generation pipeline

## How generation works

Entry point: `generate(key, opts)` in `src/core/registry.ts`.

1. `seedFaker(opts.seed)` — seeds the default faker + every locale faker.
2. `new Rng(opts.seed)` — a fresh Mulberry32 PRNG for this call.
3. `new Uniqueness(rng)` — a fresh per-call dedup tracker.
4. `gen.generate(opts, { rng, uniq })` — the generator produces its records.

Because faker, `Rng`, and `Uniqueness` are **all rebuilt per call**, generation
is a pure function of `(key, opts)`. Nothing carries state between calls.

Generators self-register in `GENERATORS` (`src/core/registry.ts`) and are sorted
by `shortcut`. Each implements the `Generator` interface (`src/core/types.ts`):
`key`, `label`, `shortcut`, `fields: FieldMeta[]`, `generate(opts, ctx)`, where
`ctx: GenContext = { rng, uniq }`.

## Invariants (MANDATORY — never regress these)

These two are the product's core promise. A change that breaks either is a
STOP, not a caveat.

### 1. Seeded reproducibility

Same non-empty seed → **identical** batch. A blank seed is *intentionally*
random (`Rng` falls back to `Math.random()*2**32`, `faker.seed()` resets).

- Inside a generator, get randomness from **`ctx.rng`** (`int/bool/pick/shuffle/
  sample`) and from the seeded `faker` (`src/core/faker-seed.ts`).
- **Never** call bare `Math.random()`, `Date.now()`, or an unseeded source in a
  generator — it silently breaks reproducibility for a given seed.
- Multi-country names: use `LOCALE_FAKERS` (us / uk / malaysia=`ID_ID` /
  vietnam). Each locale is seeded at `s + i + 1` so locales don't emit
  correlated sequences while staying reproducible — keep that offset if you add
  a locale.

### 2. No duplicates within a batch

Route any field that must be unique through
`ctx.uniq.ensure(bucket, produce, { maxTries })` (`src/core/uniqueness.ts`):

- It tracks a `Set` per `bucket`; after `maxTries` (default 50) it appends a
  random 4-letter A–Z suffix until unique, so it **always** returns a unique
  value.
- Pick a stable `bucket` string per logical field (e.g. email, course name).
- **Never hand-roll dedup** in a generator — reuse `Uniqueness` so the guarantee
  stays in one place.
- A generator that emits **several people per record** (e.g. Parent + nested
  children + guardians) must route every email through the **same** `ctx.uniq`
  and the **same** `'email'` bucket, so nested values never collide with the
  top-level one.
