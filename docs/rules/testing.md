# Testing

## Setup

- **Vitest** + **@testing-library/react**, `environment: 'jsdom'`,
  `globals: true` (`vitest.config.ts`). The `@` alias resolves to `src`.
- `globals: true` means `describe/it/expect` are available without importing,
  but the existing tests **do** import them from `vitest` — match the
  neighbouring file for consistency.
- **jest-dom matchers are NOT loaded** (`setupFiles: []`, even though
  `@testing-library/jest-dom` is installed). Use native Vitest matchers —
  `expect(container.firstChild).toBeNull()`, not `.toBeEmptyDOMElement()`;
  `expect(el).toBeTruthy()`, not `.toBeInTheDocument()`.
- `@testing-library/react` `getByText` matches only an element's **direct** text
  nodes, so text inside a nested `<b>`/`<span>` is a single match on that inner
  element — query a substring unique to the branch you're asserting.
- Tests live in `src/**/__tests__/<name>.test.ts` and import subjects via `@/…`
  (e.g. `import { generate } from '@/core/registry'`).

## Commands

- `npm test` → `vitest run --passWithNoTests` (CI runs this).
- `npm run test:watch` → `vitest` (watch mode).
- `npm run build` → `tsc -b && vite build` — the **type gate**. Must be green
  before a task is done; TS-strict + `noUnused*` will fail on dead code.

## The determinism test pattern (canonical)

The reproducibility invariant (see architecture.md) is guarded by generating
twice with the same seed and asserting equality — see
`src/core/__tests__/registry.test.ts`:

```ts
const a = generate('parent', { count: 5, len: 'normal', seed: 'abc' })
const b = generate('parent', { count: 5, len: 'normal', seed: 'abc' })
expect(a).toEqual(b)
```

**When you add or change a generator, add/extend a determinism test like this**
for it — it's the cheapest guard against silently reintroducing a non-seeded
random source.

## Proving a refactor inside a generator is output-preserving

A generator's output for a seed depends on the **exact sequence and count** of
`ctx.rng` / `faker` calls — so reordering, adding or dropping a draw is a
behaviour change, not a refactor, and the existing determinism test (which
compares two calls of the *same* code) cannot catch it. To prove a refactor is
safe, hash a seeded batch **before and after** the edit and compare:

```ts
const rows = generate('calendar', { count: 50, len: 'long', seed: 'hash-check' })
console.log(createHash('sha256').update(JSON.stringify(rows)).digest('hex'))
```

Run it on the edited tree, `git stash` the edit, run it again, `git stash pop`.
Same hash = same output. Do this whenever an agent (or you) calls a change
"behaviour-preserving" — an assertion is not evidence. Note `console.log` needs
`npx vitest run <file> --disable-console-intercept` to reach the terminal.

## Beware "output varies with `len`" assertions

The same call-sequence coupling makes a whole class of test **pass for the wrong
reason**. `htmlMessage` and `iconicName` consume a *different number* of `rng`
draws per `len`, so every draw after them shifts too — which means an unrelated
field's value also changes between `len: 'normal'` and `len: 'stress'`. A test
like this therefore proves nothing:

```ts
// BAD — passes even if `name` is a fixed pool that ignores `len` entirely
expect(totalNameLength(stressRows)).toBeGreaterThan(totalNameLength(normalRows))
```

It was written to prove Calendar's `name` scaled with `len`, and it passed
against the old code, where `name` was a 26-string pool with no `len` input at
all — the totals differed only because the shifted rng sequence picked different
pool entries.

**Assert on something intrinsic to the field instead.** For "this field now has
unbounded variety", the discriminator was the batch-size behaviour: a 26-entry
pool at `count: 100` forces `Uniqueness` into its `' XXXX'` suffix fallback,
while an unbounded source never needs it — so `expect(suffixedNames).toEqual([])`
fails loudly on the old code and passes on the new. Before trusting a new test,
**run it against the pre-change code** and confirm it actually goes red.

## What to test

- Every generator: determinism (above) + no-duplicate for uniqueness-sensitive
  fields + field shape (all `fields[].key` present).
- `npm test` must pass and `npm run build` must be green before done — exercise
  the actual change, don't assert "done" from memory.
- **Adding a generator** also breaks `registry.test.ts`: it asserts the exact
  `GENERATORS` length and that shortcuts are the contiguous run `[1..N]`. Give the
  new generator shortcut `N+1` and bump both assertions.
