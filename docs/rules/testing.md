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

## What to test

- Every generator: determinism (above) + no-duplicate for uniqueness-sensitive
  fields + field shape (all `fields[].key` present).
- `npm test` must pass and `npm run build` must be green before done — exercise
  the actual change, don't assert "done" from memory.
- **Adding a generator** also breaks `registry.test.ts`: it asserts the exact
  `GENERATORS` length and that shortcuts are the contiguous run `[1..N]`. Give the
  new generator shortcut `N+1` and bump both assertions.
