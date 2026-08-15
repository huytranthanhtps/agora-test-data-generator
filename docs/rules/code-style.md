# Code Style

## Stack conventions

- **React 19** function components; hooks live in `src/hooks/`.
- **TypeScript `strict`** with `noUnusedLocals` + `noUnusedParameters`
  (`tsconfig.json`). Unused imports / vars / params **fail the build** — remove
  them, don't `// eslint-disable` them away.
- `isolatedModules` is on — use `import type { … }` for type-only imports (the
  codebase already does, e.g. `import type { Generator } from '../types'`).
- Using `import.meta.env` (`PROD`, `BASE_URL`, …) requires `src/vite-env.d.ts`
  with `/// <reference types="vite/client" />`; without it `tsc -b` fails with
  "Property 'env' does not exist on type 'ImportMeta'".
- **Path alias** `@/*` → `src/*`. Use it for cross-directory imports
  (`@/core/registry`); relative imports are fine within the same folder.
- **Tailwind** for styling; the typography plugin is available (`@tailwindcss/
  typography`). Follow the existing calm indigo/slate palette — don't invent a
  new design language.

## Randomness (see architecture.md)

- Randomness in a generator comes from **`ctx.rng`** and the seeded `faker`
  (`@/core/faker-seed`) — **never** bare `Math.random()`. This preserves the
  seeded-reproducibility invariant.

## Reuse before you create

Before adding a new helper, check for an existing one:

| Need | Look in |
|------|---------|
| Person name / email / SG mobile / SG postcode | `src/core/names.ts` (`makePerson`, `makeEmail`, `sgMobile`, `sgPostcode`) |
| Shared generator util (e.g. dob-for-age) | `src/core/generators/shared.ts` |
| Text length handling (normal/long/stress) | `src/core/text.ts` + the `len` param |
| Seeded RNG helpers | `src/core/rng.ts` (`int/bool/pick/shuffle/sample`) |
| Uniqueness | `src/core/uniqueness.ts` (`ensure`) |

If a helper almost fits, extend it (add a param / sibling export) rather than
copy-paste-tweak.

## Rich HTML fields (`html: true`)

- A `html: true` field renders its string via `dangerouslySetInnerHTML` inside a
  `.rich` container (`RecordCard`). `.rich` (`src/index.css`) styles only
  **h1–h3** (NOT h4), `p`, `ul`/`ol`/`li`, `strong`, `em`, `a`, and the
  `.chat`/`.msg` classes. Author nested content with those tags — an `<h4>`
  renders unstyled (browser default).
- Put nested sub-entity rendering in its own module, not inline in the generator
  — e.g. Parent's `children`/`guardians` blocks live in
  `src/core/generators/family.ts`, which builds the records and emits their HTML.

## Misc

- No `console.log` in committed code.
- Keep files focused — the `src/core/generators/<entity>.ts` split is one
  generator per file; follow it when adding an entity.
