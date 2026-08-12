---
name: capture-kb
description: Use at the end of a task (or on demand) to record durable learnings into docs/rules/ so future sessions don't repeat the same mistakes — e.g. "capture what we learned", "update the rules", "/capture-kb". Harvests gotchas + user corrections, keeps only what can't be derived from code/git, and proposes a diff for approval before writing.
---

# Capture Knowledge Base

Turn what this session learned into durable KB in `docs/rules/`. Runs at the end
of a task (`implement-task` Phase 8) or on demand. A session that surfaced
nothing still runs and lands on "nothing to capture" explicitly — never invent
KB to justify the step.

The KB is only useful if it stays true and small. **A wrong rule is worse than a
missing one.**

## Recipe — run in order

### 1. Harvest candidates

Gather from **both** sources (don't stop at one):

- **User requests / corrections in this thread** — anything the user told you to
  remember, or a correction they made while you worked.
- **Self-derived learnings** — non-obvious gotchas found while coding
  (structural facts, helper locations, traps that cost real debugging time).

A harvested item is only a *candidate* until it clears the filter.

### 2. Filter — Capture Criteria

Keep ONLY what **cannot be derived from the code or git history**:

- Implicit rules / invariants discovered while working.
- Gotchas that cost real debugging time.
- New or easily-forked canonical helpers/components worth reusing.
- Commands or processes every dev will need.

Drop anything that just restates code (it rots the day the code changes).
**Nothing survives → say "nothing to capture" explicitly and stop.**

### 3. Route

Send each surviving learning to a `docs/rules/<topic>.md` by **domain**, never by
convenience:

| Learning | Destination |
|----------|-------------|
| Generation pipeline / determinism / uniqueness invariant | `architecture.md` |
| React / TS / Tailwind / faker convention, reuse helper | `code-style.md` |
| Vitest / test pattern / build gate | `testing.md` |
| Branch / commit / deploy process | `git-workflow.md` |
| Genuinely new topic | a new `docs/rules/<topic>.md` (+ add a row to `README.md`'s index) |

### 4. Read the destination BEFORE writing — then reconcile

Open the target file first (no blind append). Then:

- **Already covered** → make NO edit. Re-stating it is noise.
- **Refines an existing rule** → edit it **in place** so it stays single-source;
  never add a second, divergent copy.
- **Contradicts an existing rule** → **STOP. Surface the conflict to the user and
  let them decide** which is correct. Never leave two conflicting rules.
- **Genuinely new** → add it to the right section, matching the file's structure
  and voice.

### 5. Propose a diff, then write only on approval

Show every change as a diff with a one-line **why**. Write only what the user
approves. Rule edits ride the **same branch** as the code that motivated them.

## Red flags — stop and correct

- Blind-appended without reading the destination file first.
- Added a second copy of a rule that already exists (or one that contradicts it).
- Captured a "rule" that just restates code → drop it.
- Wrote to `docs/rules/` without showing the diff and getting approval first.
- Invented a learning to make the step look productive → "nothing to capture" is
  a valid, honest outcome.
