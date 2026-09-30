# Email Suffix, Child Chinese Name, Message/Conversation UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five user-requested tweaks: 2-digit email suffix, every child has a Chinese name, nav label Ticket→Message, no icons in Update/Calendar titles, and a longer, more realistic Conversation (plain-text bubbles, emoji-only bubbles, lorem subject).

**Architecture:** All generation changes stay in `src/core` and keep randomness on `rng`/seeded faker. Generator `key: 'ticket'` is internal (KB) so only its `label` changes. Conversation height is a per-field `FieldMeta.tall` flag consumed by `RichBlock`.

**Tech Stack:** TypeScript, React 19, Tailwind, Vitest.

**Spec:** none — user requests in chat.

## Global Constraints

- Seeded reproducibility + no duplicates in a batch (`docs/rules/architecture.md`); a seed's output legitimately changes.
- Only wrap human-noticeable repeats in `uniq` — emoji-only bubbles legitimately repeat, so they stay outside `uniq` (else they get a ` XXXX` suffix).
- No `console.log`; `import type` for type-only imports; mobile-first UI.
- Commits English `type(scope): summary`; never push without approval.

---

### Task 1: Email gets a 2-digit suffix

**Files:** Modify `src/core/names.ts:40-51`, `src/core/generators/parent.ts:82-84`, `src/core/generators/family.ts:79`; Test `src/core/__tests__/names.test.ts`, `generators-people.test.ts:35`.

**Interfaces:** Produces `makeEmail(person: Person, uniq: Uniqueness, rng: Rng): string` → `first.last` lowercased + two digits `00`–`99` + `@yopmail.com`.

- [ ] **Step 1: Failing tests.** Replace `email is unique on collision` in `names.test.ts` with:

```ts
  it('email is firstname.lastname plus a 2-digit number, unique on collision', () => {
    const r = new Rng('s')
    const uniq = new Uniqueness(r)
    const p = { first: 'Franklin', last: 'Wong', full: 'Franklin Wong', gender: 'male', ethnicity: 'chinese' } as const
    const emails = Array.from({ length: 60 }, () => makeEmail(p, uniq, r))
    for (const e of emails) expect(e).toMatch(/^franklin\.wong\d{2}@yopmail\.com$/)
    expect(new Set(emails).size).toBe(emails.length)
  })
```
and in `generators-people.test.ts:35` change the regex to `/^[a-z0-9.]+\d{2}@yopmail\.com$/` (test name → `parent email is firstname.lastname + 2 digits on the yopmail.com domain`).

- [ ] **Step 2: Run** `npx vitest run src/core/__tests__/names.test.ts src/core/__tests__/generators-people.test.ts` → FAIL (old code: no digits / wrong arity).

- [ ] **Step 3: Implement.** In `names.ts`:

```ts
export function makeEmail(person: Person, uniq: Uniqueness, rng: Rng): string {
  const local = `${person.first}.${person.last}`
    .toLowerCase().replace(/[^a-z0-9.]+/g, '')
  return uniq.ensure('email', () => {
    const num = String(rng.int(0, 99)).padStart(2, '0')
    // yopmail.com is a disposable inbox service, so these never reach a real mailbox.
    return `${local}${num}@${EMAIL_DOMAIN}`
  })
}
```
Callers: `makeEmail(p, uniq, rng)` in `parent.ts` (also replace the "clean firstname.lastname" comment with "every email carries a 2-digit number; children/guardians draw from the same uniqueness bucket") and `family.ts`.

- [ ] **Step 4: Run** `npm test` → PASS. **Step 5: Commit** `feat(names): add a 2-digit number to generated emails`.

### Task 2: Every child has a Chinese name

**Files:** Modify `src/core/generators/family.ts:47-51`; Test `src/core/__tests__/family.test.ts`.

- [ ] **Step 1: Failing test** (add to `family.test.ts`):

```ts
  it('every child has a Chinese name', () => {
    seedFaker('s')
    const r = rng()
    for (let i = 0; i < 40; i++) {
      for (const k of makeChildren(r, 'Tan', 'normal')) expect(k.chineseName).toMatch(/^[一-鿿]{2,3}$/)
    }
  })
```
- [ ] **Step 2: Run** `npx vitest run src/core/__tests__/family.test.ts` → FAIL (some children have `''`).
- [ ] **Step 3: Implement.** Replace the `cn` lines with `const cn = chineseName(rng)` (drop the "only fits Chinese-Singaporean" comment).
- [ ] **Step 4: `npm test`** PASS. **Step 5: Commit** `feat(family): give every child a Chinese name`.

### Task 3: Nav label Ticket → Message

**Files:** Modify `src/core/generators/ticket.ts` (`label: 'Message'`), `src/App.tsx:71-82` (copy: "Ticket" → "Message"); Test `src/core/__tests__/registry.test.ts` (add).

- [ ] **Step 1: Failing test:** `expect(GENERATORS.find((g) => g.key === 'ticket')?.label).toBe('Message')` (import `GENERATORS` from `@/core/registry` if not already).
- [ ] **Step 2:** run → FAIL (`'Ticket'`). **Step 3:** edit label + the two help-text spans. **Step 4:** `npm test`. **Step 5: Commit** `feat(ticket): rename the nav label to Message`.

### Task 4: No icons in Update / Calendar titles

**Files:** Modify `src/core/text.ts` (`iconicName` gains `opts?: { icons?: boolean }`), `src/core/generators/message.ts:17`, `src/core/generators/calendar.ts:28`; Test `src/core/__tests__/text.test.ts`.

**Interfaces:** `iconicName(r: Rng, len: TextLen, opts?: { icons?: boolean }): string` — `icons` defaults to `true`; `false` skips both the icon draw and the splice.

- [ ] **Step 1: Failing test** (in `text.test.ts`):

```ts
  it('iconicName with icons:false never contains an emoji', () => {
    seedFaker('s')
    const r = new Rng('s')
    for (const len of ['normal', 'long', 'stress'] as const) {
      for (let i = 0; i < 60; i++) {
        expect(/\p{Extended_Pictographic}/u.test(iconicName(r, len, { icons: false }))).toBe(false)
      }
    }
  })
  it('Update Message and Calendar titles carry no emoji', () => {
    for (const key of ['message', 'calendar'] as const) {
      const rows = generate(key, { count: 60, len: 'stress', seed: 'no-icons' })
      const field = key === 'message' ? 'title' : 'name'
      for (const row of rows) expect(/\p{Extended_Pictographic}/u.test(String(row[field]))).toBe(false)
    }
  })
```
(import `generate` from `@/core/registry`).
- [ ] **Step 2:** run → FAIL (extra arg ignored, icons still appear; the generator test fails on old code).
- [ ] **Step 3: Implement.** Signature above; body: `const iconCount = opts?.icons === false ? 0 : r.int(0, 1)`. `message.ts`: `iconicName(rng, len, { icons: false })`; `calendar.ts` likewise.
- [ ] **Step 4:** `npm test`. **Step 5: Commit** `feat(text): drop emoji icons from Update and Calendar titles`.

### Task 5: Realistic Conversation

**Files:** Modify `src/core/text.ts` (replace `TICKET_SCENARIOS`/`TicketScenario`/`bubbleText`; add `ticketSubject`, `CHAT_EMOJI`), `src/core/generators/ticket.ts`, `src/core/types.ts` (`FieldMeta.tall?`), `src/components/RecordCard.tsx` (`RichBlock` `tall`); Test `src/core/__tests__/text.test.ts`, `generators-misc.test.ts` (ticket tests live there — add next to them), `src/components/__tests__/RecordCard.test.tsx`.

**Interfaces:**
- `ticketSubject(r: Rng, len: TextLen): string` — capitalised lorem, words normal 4–8 / long 8–14 / stress 15–25.
- `chatTranscript(...)` signature unchanged; bubbles are plain text (no `<strong>`), ~10% emoji-only, ~30% lorem + trailing emoji, ~10% lorem + a plain date/time/amount, rest plain lorem. Only lorem bubbles go through `uniq`.
- `FieldMeta.tall?: boolean`; ticket's `conversation` field sets `tall: true`; `RichBlock` uses `max-h-[28rem]` when tall, else `max-h-64`.

- [ ] **Step 1: Failing tests.**

```ts
  it('conversation bubbles are plain text — never bold or formatted', () => {
    seedFaker('s')
    const html = chatTranscript(new Rng('s'), 'Alice', 'Bob', 200, 'normal', new Uniqueness(new Rng('s')))
    expect(html).not.toContain('<strong>')
  })
  it('some conversation bubbles are emoji-only, and most are not', () => {
    seedFaker('s')
    const html = chatTranscript(new Rng('s'), 'Alice', 'Bob', 300, 'normal', new Uniqueness(new Rng('s')))
    const bubbles = [...html.matchAll(/<span class="bubble">(.*?)<\/span>/g)].map((m) => m[1])
    const emojiOnly = bubbles.filter((b) => /^(\p{Extended_Pictographic}️?\s?)+$/u.test(b))
    expect(emojiOnly.length).toBeGreaterThan(10)
    expect(emojiOnly.length).toBeLessThan(bubbles.length / 2)
    expect(emojiOnly.filter((b) => /XXXX|[A-Z]{4}$/.test(b))).toEqual([])
  })
  it('date/time/amount mentions are rare', () => {
    seedFaker('s')
    const html = chatTranscript(new Rng('s'), 'Alice', 'Bob', 300, 'normal', new Uniqueness(new Rng('s')))
    const hits = (html.match(/\$\d+|\b\d{2}:\d{2}\b|\b\d{2}\/\d{2}\b/g) ?? []).length
    expect(hits).toBeLessThan(60)
  })
```
(import `Uniqueness`). In the ticket generator tests: `subject` has ≥4 words and is not one of the old `'Absence Notice'`/`'General Enquiry'`; and `fields.find(f => f.key === 'conversation')?.tall` is `true`. In `RecordCard.test.tsx` (match the file's render helper): a `tall` html field renders a `.rich-clip` element whose class contains `max-h-[28rem]`, a non-tall one `max-h-64`.
- [ ] **Step 2:** run → FAIL (bold present, no emoji-only bubbles, old subjects, no `tall`).
- [ ] **Step 3: Implement.** `text.ts`:

```ts
// Emoji people actually send in chat (faces / gestures); MSG_EMOJI stays for rich messages.
const CHAT_EMOJI = ['😊', '😂', '🙏', '👍', '👌', '🙌', '😅', '😢', '❤️', '🎉', '😀', '🤝'] as const

/** Chat-style plain text: lorem sentences, sometimes a trailing emoji or a plain date/time/amount. */
function textBubble(r: Rng, len: TextLen): string {
  const n = len === 'stress' ? r.int(3, 5) : len === 'long' ? 2 : 1
  let s = Array.from({ length: n }, () => faker.lorem.sentence()).join(' ')
  const roll = r.int(0, 9)
  if (roll === 0) s = `${s} ${r.pick([date(r), time(r), money(r)])}`
  else if (roll <= 3) s = `${s} ${r.pick(CHAT_EMOJI)}`
  return s
}

/** A reaction bubble made only of 1–3 emoji — real chats have plenty of these. */
function emojiBubble(r: Rng): string {
  return Array.from({ length: r.int(1, 3) }, () => r.pick(CHAT_EMOJI)).join(' ')
}

/** Conversation subject: lorem, capitalised, length scaled by `len`. */
export function ticketSubject(r: Rng, len: TextLen): string {
  const n = len === 'stress' ? r.int(15, 25) : len === 'long' ? r.int(8, 14) : r.int(4, 8)
  return words(n)
}
```
In `chatTranscript`: `const text = r.bool(0.1) ? emojiBubble(r) : uniq ? uniq.ensure('ticket.bubble', () => textBubble(r, len)) : textBubble(r, len)`. Delete `TICKET_SCENARIOS`, `TicketScenario`, old `bubbleText`. `ticket.ts`: import `ticketSubject`, `subject: ticketSubject(rng, len)`, drop `scenario`, add `tall: true` to the conversation field. `types.ts`: `tall?: boolean`. `RecordCard.tsx`: pass `tall={f.tall}` into `RichBlock`; class `cn`-style switch between `max-h-64` and `max-h-[28rem]`.
- [ ] **Step 4:** `npm test && npm run build` PASS. **Step 5: Commit** `feat(ticket): plain-text, emoji-aware conversation with lorem subject and taller preview`.

## Self-Review

- All five requests map to Tasks 1–5. `makeEmail` arity change updates both callers (parent, family) in Task 1. `TICKET_SCENARIOS` removal is safe (only `ticket.ts` imported it). Names `ticketSubject`, `tall`, `iconicName(..., { icons })`, `makeEmail(..., rng)` are consistent across tasks.
