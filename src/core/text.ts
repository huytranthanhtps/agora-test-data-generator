import type { Rng } from './rng'
import type { TextLen } from './types'
import type { Uniqueness } from './uniqueness'
import { faker } from './faker-seed'

export function loremByLen(_rng: Rng, len: TextLen): string {
  if (len === 'normal') return faker.lorem.sentence()
  if (len === 'long') return faker.lorem.paragraph()
  return faker.lorem.paragraphs(6, '\n\n')
}

// ---- Rich-text building blocks ---------------------------------------------
// Message/ticket prose is drawn from faker's lorem generator so every record is
// unique, while a light dusting of emoji, <strong> fragments, numbers and
// symbols keeps the rich-text rendering under test.

const TITLE_EMOJI = ['📅', '📣', '📌', '⚠️', '✅', '🕒', '🎒', '💡', '📝', '📎', '💬', '🎉'] as const
const MSG_EMOJI = ['😊', '🙏', '👍', '📚', '✅', '🕒', '💬', '📌', '🎉', '⚠️'] as const

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const words = (n: number) => cap(faker.lorem.words(n))
const time = (r: Rng) => `${String(r.int(9, 18)).padStart(2, '0')}:${r.pick(['00', '15', '30', '45'])}`
const date = (r: Rng) => `${String(r.int(1, 28)).padStart(2, '0')}/${String(r.int(1, 12)).padStart(2, '0')}`
const money = (r: Rng) => `$${r.int(80, 900)}`

/** A lorem sentence with an occasional bold number/date and a trailing emoji. */
function richSentence(r: Rng): string {
  let s = faker.lorem.sentence()
  const roll = r.int(0, 3)
  if (roll === 0) s = `${s} <strong>${money(r)}</strong>.`
  else if (roll === 1) s = `${s} <strong>${date(r)}</strong>.`
  else if (roll === 2) s = `${s} <strong>${time(r)}</strong>.`
  if (r.int(0, 2) === 0) s = `${s} ${r.pick(MSG_EMOJI)}`
  return s
}

function link(r: Rng): string {
  const slug = faker.lorem.words(r.int(2, 3)).replace(/\s+/g, '-')
  return `<a href="https://agora.example/${slug}">${words(r.int(2, 4))} →</a>`
}

const ul = (r: Rng, n: number) =>
  `<ul>${Array.from({ length: n }, () => `<li>${richSentence(r)}</li>`).join('')}</ul>`
const ol = (r: Rng, n: number) =>
  `<ol>${Array.from({ length: n }, () => `<li>${words(r.int(3, 7))}</li>`).join('')}</ol>`
const para = (r: Rng, n: number) =>
  `<p>${Array.from({ length: n }, () => richSentence(r)).join(' ')}</p>`

// Emoji icons (school/education-flavoured, no typographic symbols) dropped into
// generated names to exercise emoji rendering.
const NAME_ICONS = ['📘', '📗', '📙', '📚', '📖', '✏️', '🖍️', '📝', '📐', '📏', '🧪', '🔬', '🔭', '🎨', '🧮', '🔢', '🚀', '⭐', '🎯', '🎓', '🏫', '🏆', '🥇', '🧩', '💡', '🎵', '🎭', '⚽', '🏀', '🌍', '💻', '🧠'] as const

const capWords = (s: string) => s.split(/\s+/).map(cap).join(' ')

/** A few real words drawn from faker.js — the "meaningful" anchor of a name. */
function fakerAnchor(r: Rng): string {
  switch (r.int(0, 3)) {
    case 0:
      return faker.commerce.productName()
    case 1:
      return capWords(faker.word.words({ count: r.int(2, 3) }))
    case 2:
      return capWords(faker.company.catchPhrase())
    default:
      return faker.commerce.department()
  }
}

/**
 * A unique display name: faker.js data (the meaningful anchor) + some lorem for
 * entropy + at most one emoji icon dropped in at a random position. Lorem length
 * still scales with `len`. Used for entity names and the Update Message title.
 * Pass `{ icons: false }` for a title with no emoji (no icon draw is made).
 */
export function iconicName(r: Rng, len: TextLen, opts?: { icons?: boolean }): string {
  const loremCount = len === 'stress' ? r.int(3, 5) : len === 'long' ? 2 : 1
  const tokens = [
    ...fakerAnchor(r).split(/\s+/),
    ...faker.lorem.words(loremCount).split(/\s+/).map(cap),
  ]
  const iconCount = opts?.icons === false ? 0 : r.int(0, 1)
  for (let i = 0; i < iconCount; i++) {
    tokens.splice(r.int(0, tokens.length), 0, r.pick(NAME_ICONS))
  }
  return tokens.join(' ')
}

/** Meaningful, length-scaled description for a Product. */
export function productDescription(
  r: Rng,
  p: { subject: string; grade: string; base: string; edition: string },
  len: TextLen,
): string {
  const s = [
    `The ${p.base.toLowerCase()} for ${p.subject} (${p.grade}) — ${p.edition}.`,
    `Includes ${r.int(6, 12)} units and ${r.int(20, 60)} graded practice sets.`,
    `Aligned to the ${r.pick(['MOE', 'Cambridge', 'IB'])} syllabus for ${r.int(2025, 2027)}.`,
    `Ships with answer keys and a progress tracker.`,
    `Bulk pricing available for classes of ${r.int(10, 30)}+.`,
  ]
  if (len === 'normal') return s[0]
  if (len === 'long') return s.slice(0, 3).join(' ')
  return `${s.join(' ')} ${faker.lorem.paragraph()}`
}

/**
 * Rich HTML update message. Structure (and thus richness) scales with `len`:
 *  - normal: h2 + paragraph + bullet list + link
 *  - long:   adds h1, h3 and an ordered list
 *  - stress: adds h4 and long multi-paragraph sections
 * Prose is lorem so every message is unique.
 */
export function htmlMessage(r: Rng, len: TextLen): string {
  const parts: string[] = []

  if (len !== 'normal') parts.push(`<h1>${r.pick(TITLE_EMOJI)} ${words(r.int(2, 4))}</h1>`)
  parts.push(`<h2>${words(r.int(2, 3))}</h2>`)
  parts.push(para(r, len === 'stress' ? 4 : len === 'long' ? 2 : 1))
  parts.push(`<h3>${words(r.int(2, 3))}</h3>`)
  parts.push(ul(r, len === 'stress' ? 5 : len === 'long' ? 4 : 3))

  if (len !== 'normal') {
    parts.push(`<h3>${words(r.int(2, 3))}</h3>`)
    parts.push(ol(r, len === 'stress' ? 5 : 3))
  }
  if (len === 'stress') {
    parts.push(`<h4>⚠️ ${words(r.int(2, 4))}</h4>`)
    parts.push(para(r, 4))
  }
  parts.push(`<p>${link(r)}</p>`)
  return parts.join('\n')
}

/** Emoji people actually send in chat (faces / gestures); MSG_EMOJI stays for rich messages. */
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

/** Conversation subject: capitalised lorem, length scaled by `len`. */
export function ticketSubject(r: Rng, len: TextLen): string {
  const n = len === 'stress' ? r.int(15, 25) : len === 'long' ? r.int(8, 14) : r.int(4, 8)
  return words(n)
}

/**
 * A chat between two participants, alternating speakers. Text bubbles are unique
 * lorem (passing `uniq` guarantees no two are identical); ~10% are emoji-only
 * reactions, which legitimately repeat and so stay outside `uniq`.
 */
export function chatTranscript(
  r: Rng,
  a: string,
  b: string,
  messages: number,
  len: TextLen = 'normal',
  uniq?: Uniqueness,
): string {
  const lines: string[] = []
  for (let i = 0; i < messages; i++) {
    const isA = i % 2 === 0
    const who = isA ? a : b
    const side = isA ? 'msg--a' : 'msg--b'
    const text = r.bool(0.1)
      ? emojiBubble(r)
      : uniq
        ? uniq.ensure('ticket.bubble', () => textBubble(r, len))
        : textBubble(r, len)
    lines.push(
      `<div class="msg ${side}"><span class="who">${who}</span><span class="bubble">${text}</span></div>`,
    )
  }
  return `<div class="chat">\n${lines.join('\n')}\n</div>`
}
