# Course Rich-Text Description Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Course generator's `description` field a rich-text (HTML) value produced by the same `htmlMessage()` generator used by the Update Message `message` field.

**Architecture:** Swap `courseDescription()` for `htmlMessage(rng, len)` in `course.ts` and mark the `description` field `html: true` so `RecordCard` renders it via the `.rich` container — identical to the existing Message field. Course-flavoured subject/grade/focus picks (only fed `courseDescription`) are removed with their now-unused imports.

**Tech Stack:** Vite + React 19 + TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`) + Vitest.

**Spec:** N/A — trivial single-file change; design settled inline (user chose "reuse `htmlMessage()`").

## Global Constraints

- Seeded reproducibility: randomness only from `ctx.rng` + seeded faker; `htmlMessage(rng, len)` already complies.
- No duplicates within a batch: unaffected — description is not a unique field; `name` still routes through `uniq.ensure`.
- `noUnusedLocals`/`noUnusedParameters` are on — remove every import/var that stops being used or the build fails.

---

### Task 1: Course description → rich HTML via `htmlMessage`

**Files:**
- Modify: `src/core/generators/course.ts`

**Interfaces:**
- Consumes: `htmlMessage(r: Rng, len: TextLen): string` from `@/core/text` (already exported).
- Produces: Course rows whose `description` is an HTML string; the `description` FieldMeta gains `html: true`.

- [ ] **Step 1:** In `course.ts`, change the import line from `import { courseDescription, iconicName } from '../text'` to `import { htmlMessage, iconicName } from '../text'`.

- [ ] **Step 2:** Trim the data import to only what remains used: `import { SUBJECT_TYPE } from '../data'` (drop `SUBJECTS`, `GRADES`, `COURSE_FOCUS`).

- [ ] **Step 3:** In the `fields` array, change the description entry to `{ key: 'description', label: 'Description', html: true }`.

- [ ] **Step 4:** In `generate`, delete the three now-unused picks (`subject`, `grade`, `focus`) and change the record's `description` to `description: htmlMessage(rng, len)`. Keep the explanatory comment accurate (or remove the stale line about subject/grade/focus driving the description).

- [ ] **Step 5: Run the academic generator tests** — `npx vitest run src/core/__tests__/generators-academic.test.ts` — Expected: PASS (course name uniqueness + maxAge≥minAge unaffected).

- [ ] **Step 6: Full verify** — `npm test` and `npm run build` both green; exercise the change by generating a course batch and confirming `description` is HTML; confirm same-seed determinism.

- [ ] **Step 7: Commit** on the feature branch.
