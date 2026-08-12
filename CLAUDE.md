# CLAUDE.md

Static test-data generator for Agora forms — Vite + React 19 + TypeScript +
Tailwind, tested with Vitest, deployed to GitHub Pages.

## Knowledge Base — `docs/rules/`

Before working in an area, **read the matching `docs/rules/*.md`**
(`architecture`, `code-style`, `testing`, `git-workflow`). Capture new,
non-obvious learnings via the **`capture-kb`** skill (it proposes a diff you
approve). See `docs/rules/README.md`.

## Skills — `.claude/skills/`

- **`implement-task`** — conducts a dev task: understand → plan (superpowers
  spine) → TDD → verify → review → capture KB, with git-safety.
- **`capture-kb`** — records durable learnings into `docs/rules/`.

## Pinned invariants (must survive context compaction)

- **Seeded reproducibility** — same non-empty seed → identical batch. In a
  generator, randomness comes from `ctx.rng` + the seeded faker, **never** bare
  `Math.random()` (`docs/rules/architecture.md`).
- **No duplicates within a batch** — route unique fields through
  `ctx.uniq.ensure(...)`; never hand-roll dedup.
- **Git-safety** — branch-first, never commit on `main`, never `git push` / PR /
  merge without explicit approval. **Pushing `main` deploys to GitHub Pages
  (production)** (`docs/rules/git-workflow.md`).
