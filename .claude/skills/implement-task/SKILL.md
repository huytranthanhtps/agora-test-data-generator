---
name: implement-task
description: Use when implementing a development task in this repo — "implement X", "add a Y generator", "fix the Z export", "build feature W". Conducts the full lifecycle (understand → plan via the superpowers spine → TDD → verify → review → capture KB) with git-safety guards. Not for a quick question about the code (just read it).
---

# Implement a Task

Conductor for the development lifecycle in the agora-test-data-generator repo.
Follow the phases in order; make a todo per phase. Never skip the Verify gate
(Phase 6) or the final STOP (Phase 9).

## Orchestration model (read first)

**This skill sequences the superpowers spine — it never authors a spine step
itself.** The spec comes from `superpowers:brainstorming`, the plan from
`superpowers:writing-plans`, a bug's root cause from
`superpowers:systematic-debugging`. The conductor feeds and orders them; it does
not hand-write a plan in the chat or substitute a TodoWrite list for one.

- **The superpowers spine is required and owns the workflow.** There is **no**
  "it's a small change / single file / no design questions" fast-path that skips
  `writing-plans` — for a trivial edit it just emits a one-line plan.
- **Suppress** superpowers' auto-chain to `finishing-a-development-branch`; the
  Phase 9 STOP replaces it. Local per-task commits during Implement are fine;
  pushing is not.
- The user's global `CLAUDE.md` and this repo's `docs/rules/git-workflow.md`
  always take precedence over anything here.

## Pipeline

| # | Phase | What to do |
|---|-------|------------|
| 0 | **Language** | Settle the chat language once (ask if unknown; sticky for the session). **Code, commits, spec, plan, and all git artefacts are English regardless** — only chat prose follows the chosen language. |
| 1 | **Understand + KB-ground** | Understand the request. **Read the relevant `docs/rules/*.md` first** (architecture / code-style / testing / git-workflow) so known gotchas aren't repeated. |
| 2 | **Explore** | Read the affected code (`src/core`, `src/core/generators`, `src/components`, `src/export`, …). Read-only — no branch yet. |
| 3 | **Branch** | **Branch-first — never work on `main`.** Cut a feature branch. Never auto-commit/push. |
| 4 | **Plan** | superpowers spine, mandatory. Feature with open design questions → `superpowers:brainstorming` (spec → `docs/superpowers/specs/`). Bug → `superpowers:systematic-debugging` (root cause first). Then **always** `superpowers:writing-plans`. Never plan inline. |
| 5 | **Implement** | `superpowers:test-driven-development`. **Choose the execution mode by task shape — don't default to subagents.** Inline (`superpowers:executing-plans`) fits a small plan whose tasks are sequential / interdependent (each needs the previous one's code) or that runs local tooling you want to watch. Subagent-driven (`superpowers:subagent-driven-development`) pays off on a large plan (≈10+ tasks), genuinely independent / parallelizable tasks, or when the main context must stay lean. Local commits on the branch allowed; **never push**. |
| 6 | **Verify (GATE)** | `superpowers:verification-before-completion`: run `npm test` and `npm run build`, exercise the actual change, show **real output**. **Confirm the two app invariants still hold** — seeded reproducibility (same seed → identical batch) and no duplicates within a batch (see `docs/rules/architecture.md`). Red test / red build / broken invariant = **STOP**, fix, re-verify. Pure-docs change → state there's no runtime surface and what you checked instead. |
| 7 | **Review** | `code-reviewer` agent (fix confirmed findings) → `code-simplifier` on the changed code. |
| 8 | **Capture KB** | Invoke the `capture-kb` skill — harvest learnings into `docs/rules/` (diff + approval before writing). "Nothing to capture" is a valid outcome. |
| 9 | **STOP** | Report: branch, files changed, Verify output + PASS, captured learnings. **Wait for explicit user approval before `git push` / PR / merge — pushing `main` deploys to GitHub Pages (production).** |

## Red flags — STOP and correct

- Started coding before cutting a branch → stop, branch first (Phase 3).
- Planned inline / used a TodoWrite list instead of invoking `writing-plans` →
  the plan must come from the spine skill.
- Self-judged the task "small / single-file / no design questions" and skipped
  `writing-plans` → there is no such fast-path; run it (it's a one-liner for a
  trivial edit).
- Treated "unit tests pass" as done without exercising the change or checking the
  determinism + no-duplicate invariants → not sufficient; run Phase 6 fully.
- About to `git push` / open a PR / merge — or push `main` (= a GitHub Pages
  deploy) — without explicit approval in the current turn → STOP, that's Phase 9.
- Switched chat language because the user's latest message was in another
  language → the chosen language is sticky; revert.
- Wrote a commit / spec / plan in the chat language instead of English → those
  artefacts are always English.
- A referenced spine skill seemed missing so a phase was skipped → attempt the
  invocation first; only after it actually fails, do that phase's intent
  manually and record the gap in the final report.
- Reached for subagent-driven execution on a small, sequential plan (or forced
  everything inline on a large / parallelizable one) → pick the mode per task
  shape in Phase 5; subagents are not the default.
