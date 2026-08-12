# Mobile-first rework + scroll fix + lorem message text

Date: 2026-08-12

## Problem

The app is hard to use on a phone. Concretely:

1. **Nav** — logo + "TEST DATA STUDIO" label + 8 horizontally-scrolling tabs +
   theme toggle jammed into one 56px row. On a 390px screen only ~3 tabs show
   and there is no affordance that the rest exist.
2. **Console** — controls `flex-wrap` and the `ml-auto` export buttons collapse
   messily; the mono "command readout" overflows; `Generate` is not prominent.
3. **`px-6` (24px)** padding on every surface wastes ~48px of a 390px screen.
4. **`h-screen` fixed shell** fights mobile browser chrome (dynamic toolbars cut
   off the bottom).
5. **Nested scroll regions** — the desktop app-shell's scrolling `main` PLUS each
   card's rich-content box (`max-h-72 overflow-auto`) and the ticket conversation
   are each their own scroll trap, so scrolling one region steals scroll from the
   page. This is the top-priority complaint.
6. **Message/ticket text repeats** — bubble and update text is drawn from small
   fixed phrase pools (6 items, cycled), so it is not unique across a batch.

## Approach

Mobile-first responsive rework driven by Tailwind breakpoints. One component
tree. Mobile (`<640px`, i.e. below `sm`) gets a stacked, thumb-friendly layout;
`sm+` keeps today's desktop feel (multi-column grid, tab strip). **No desktop
regression.** Entity switching on mobile uses a full-width dropdown/sheet.

## Changes

### 1. Shell — `src/App.tsx`
- `h-screen` → `min-h-[100dvh]`; drop `overflow-hidden` on mobile.
- Mobile scrolls the whole document naturally (robust against browser toolbars).
- `sm+` keeps the fixed app-shell (pinned header/console, only cards scroll)
  via `sm:h-screen sm:overflow-hidden`.
- Padding `px-4 sm:px-6`.
- Help text: one short line on mobile, full text at `sm+`.

### 2. Nav — `src/components/TopNav.tsx`
- Mobile: slim sticky bar (logo + theme toggle) + a full-width **dropdown button**
  showing the current entity; tapping opens a sheet listing all 8 with large tap
  rows and a check on the active one. Closes on select / outside tap / Escape.
- `sm+`: unchanged horizontal tab strip.
- Shortcut numbers hidden on mobile.

### 3. Console — `src/components/Console.tsx`
- Mobile: hide the decorative mono command readout (or one-line summary).
  Controls stack full-width: Records stepper, Text-length segmented (full-width),
  Seed input full-width, Messages/ticket when relevant.
- **Generate** = full-width primary button on mobile.
- Export JSON/CSV = two equal half-width buttons in a row (only when rows exist),
  not `ml-auto`.
- `sm+`: current inline flex layout preserved.

### 4. Cards — `src/components/RecordCard.tsx`
- Mobile label column `grid-cols-[84px_1fr]`; ensure copy tap target spans row.
- **Rich content box:** stop using inner `overflow-auto`. Fixed max-height +
  bottom fade (mask) + **"Expand"** opens the full dialog. Kills the nested
  scroll trap everywhere (mobile and desktop).
- **Ticket bubbles are tap-to-copy:** event delegation on the rich container —
  click finds the nearest `.bubble`, copies its `textContent`, flashes the
  bubble + shows a "Copied" cue. `cursor: pointer` affordance.

### 5. Preview dialog — `src/components/HtmlPreviewDialog.tsx`
- Mobile: near-fullscreen sheet (`max-h-[92dvh]`, `p-3`) instead of centered 2xl.
- Bubble tap-to-copy works here too (same delegation).
- `overscroll-behavior: contain` on its scroll area.

### 6. Scroll hygiene — `src/index.css`
- `overscroll-behavior: contain` on the desktop `main` scroller and the modal.
- `.bubble` gets `cursor: pointer` + a `.bubble--copied` flash state.
- Bottom-fade mask utility for the card rich-content box.

### 7. Content — unique lorem message text
- `src/core/text.ts`:
  - `messageTitle(r)` → `emoji + lorem words`.
  - `htmlMessage(r, len)` → keep h1–h4 + ul/ol + link structure, fill prose with
    lorem (unique per record). Keep light emoji + one `<strong>` fragment.
  - `chatTranscript(...)` → bubbles use lorem sentences (length scales with
    `len`), alternating speakers, each with a light emoji + one `<strong>`
    fragment, **deduped** so no two bubbles in a batch are identical.
- Thread `uniq` where needed (`message.ts` generate gains `uniq` from context;
  `ticket.ts` already has it). Dedup via `uniq.ensure(...)`.
- Rationale: only the *prose* becomes lorem; markup/emoji stay because this is a
  rich-text test tool. (User approved; could strip to pure lorem later.)

## Out of scope
- No generator schema/field changes beyond text content.
- No changes to CSV/JSON export logic, RNG, or uniqueness core.

## Verification
- `npm run build` (tsc + vite) passes; `npm test` passes.
- Manual: Chrome at 390px — nav dropdown, stacked console, single scroll,
  bubble tap-to-copy, Expand dialog; desktop unchanged at ≥1280px.
