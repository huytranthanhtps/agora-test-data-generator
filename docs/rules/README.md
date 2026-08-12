# docs/rules — Knowledge Base

Durable, growing knowledge base for this repo. The point is simple: **capture a
learning once, so a later session doesn't rediscover it (or repeat the mistake).**

## Format

- Plain markdown, **one topic per file**; the filename **is** the topic
  (`architecture.md`, `code-style.md`, …).
- Write rules as short, checkable statements. Prefer "do X because Y", with a
  concrete anchor (`src/core/rng.ts`) when it helps.
- English only (like all repo artefacts).

## When to add a rule

Capture **only what cannot be derived from the code or git history**:

- Implicit rules / invariants discovered while working.
- Gotchas that cost real debugging time.
- New canonical helper/component locations worth reusing.
- Processes every dev will need.

Do **not** log something that just restates the code — that rots the moment the
code changes. A wrong rule is worse than a missing one.

## Who writes it

The **`capture-kb`** skill. It harvests learnings at the end of a task, keeps
only what clears the criteria above, reads the destination file first (no blind
append, no conflicting duplicate), and **proposes a diff you approve** before
writing. Rule edits ride the same branch as the code that motivated them.

The **`implement-task`** skill reads the relevant file here at the start of a
task (Phase 1) so known gotchas are not repeated.

## Index

| File | Purpose |
|------|---------|
| [architecture.md](architecture.md) | `src/core` generation pipeline + the determinism & no-duplicate invariants |
| [code-style.md](code-style.md) | React 19 / TS-strict / Tailwind / faker conventions + reuse-first |
| [testing.md](testing.md) | Vitest + Testing Library conventions; the determinism test pattern |
| [git-workflow.md](git-workflow.md) | Branch-first, no auto-push; pushing `main` deploys to GitHub Pages |
