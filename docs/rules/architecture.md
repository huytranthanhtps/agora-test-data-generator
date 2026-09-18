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

Keep shortcuts a contiguous `1..N` run (a new generator gets `N+1`) — the
keyboard selector in `App.tsx` matches a single keypress (`Number(e.key)`), so a
shortcut ≥ 10 is registered and clickable but never keyboard-selectable.

A generator's `key` is **internal**: `App.tsx` and the UI iterate `GENERATORS`,
CSV/JSON export writes `label` + field values, and nothing persists the key (the
selected entity lives in `useState`, not `localStorage` or the URL). So renaming
a generator key breaks no stored state — only its own imports, the registry
entry, and its `uniq` bucket strings need to follow.

## Invariants (MANDATORY — never regress these)

These two are the product's core promise. A change that breaks either is a
STOP, not a caveat.

### 1. Seeded reproducibility

Same non-empty seed → **identical** batch. A blank seed is *intentionally*
random (`Rng` falls back to `Math.random()*2**32`, `faker.seed()` resets).

The promise is **per build**: same seed → same batch from the same code. It is
*not* stability across code changes — adding, removing or reordering a field
shifts the `ctx.rng`/faker draw sequence, so a seed's output legitimately
changes. Dropping Calendar's `location` did exactly that. Don't contort a
deliberate change to preserve old output hashes; the hash check in
`docs/rules/testing.md` is for proving a *refactor* is output-preserving, not a
behaviour change.

- Inside a generator, get randomness from **`ctx.rng`** (`int/bool/pick/shuffle/
  sample`) and from the seeded `faker` (`src/core/faker-seed.ts`).
- **Never** call bare `Math.random()`, `Date.now()`, or an unseeded source in a
  generator — it silently breaks reproducibility for a given seed.
- Multi-ethnic names: use `LOCALE_FAKERS`, keyed by Singapore ethnicity —
  `chinese`=`EN_HK` (romanised Chinese surnames), `malay`=`ID_ID`,
  `indian`=`EN_IN`, `eurasian`=`EN_GB`. Keys MUST match `ETHNICITIES`
  (`names.ts`). Each locale is seeded at `s + i + 1` so locales don't emit
  correlated sequences while staying reproducible — keep that offset if you add
  one. Only add **Latin-romanising** locales (native-script ones like `zh_*` /
  `ta_IN` are avoided); and verify a candidate actually ships person data —
  some (e.g. `ta_IN`) silently fall back to generic English names.

### 2. No duplicates within a batch

Route any field that must be unique through
`ctx.uniq.ensure(bucket, produce, { maxTries })` (`src/core/uniqueness.ts`):

- It tracks a `Set` per `bucket`; after `maxTries` (default 50) it appends a
  random 4-letter A–Z suffix until unique, so it **always** returns a unique
  value.
- **That fallback degrades data quality silently — size the source to the
  batch.** Nothing errors when `produce()` runs out of variety; you just start
  getting values like `September Holidays BMBL`. Calendar's `name` used a
  26-string pool, so a 100-row batch emitted **74** suffixed names before anyone
  noticed. A fixed pool is only safe for a `uniq`-wrapped field if it comfortably
  exceeds realistic batch sizes; otherwise use a faker/lorem-backed builder
  (`iconicName`), as `course`, `product`, `klass`, `message` and now `calendar`
  all do. The trailing ` XXXX` is the observable smell — assert its absence to
  catch a regression (`docs/rules/testing.md`).
- Pick a stable `bucket` string per logical field (e.g. email, course name).
- **Never hand-roll dedup** in a generator — reuse `Uniqueness` so the guarantee
  stays in one place.
- **Not every field belongs in `uniq`.** Only wrap what a human would notice
  repeating (name, email, course title). A field whose real-world values
  legitimately repeat must stay unwrapped — Calendar's `venue` is a campus, and
  many entries sharing a campus is correct data, not a duplicate. Same for
  lorem-backed rich text (`description`), where collisions are already
  vanishingly unlikely. Wrapping these would fabricate variety the domain
  doesn't have.
- A generator that emits **several people per record** (e.g. Parent + nested
  guardians — children carry no email) must route every email through the
  **same** `ctx.uniq` and the **same** `'email'` bucket, so nested values never
  collide with the top-level one.
