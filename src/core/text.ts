import type { Rng } from './rng'
import type { TextLen } from './types'
import { faker } from './faker-seed'
import { SUBJECTS, GRADES, VENUES } from './data'

export function loremByLen(_rng: Rng, len: TextLen): string {
  if (len === 'normal') return faker.lorem.sentence()
  if (len === 'long') return faker.lorem.paragraph()
  return faker.lorem.paragraphs(6, '\n\n')
}

// ---- Meaningful, education-context building blocks -------------------------
// Copy is composed from small realistic pools so generated Update Messages and
// Tickets read like real Agora notices — with capitals, numbers, symbols and
// emoji to stress-test rich-text rendering.

const TOPICS = [
  'Schedule Change',
  'Class Update',
  'Holiday Notice',
  'Fee Reminder',
  'Exam Timetable',
  'Parent–Teacher Meeting',
  'Venue Change',
  'Enrolment Open',
] as const
const TITLE_EMOJI = ['📅', '📣', '📌', '⚠️', '✅', '🕒', '🎒', '💡'] as const
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const TERMS = ['Term 1', 'Term 2', 'Term 3', 'Term 4'] as const
const MATERIALS = [
  'workbook',
  'scientific calculator',
  'laptop',
  'art kit',
  'reading folder',
] as const

const time = (r: Rng) => `${String(r.int(9, 18)).padStart(2, '0')}:${r.pick(['00', '15', '30', '45'])}`
const date = (r: Rng) => `${String(r.int(1, 28)).padStart(2, '0')}/${String(r.int(1, 12)).padStart(2, '0')}`
const money = (r: Rng) => `$${r.int(80, 900)}`
const phone = (r: Rng) => `+65 ${r.int(6, 9)}${r.int(100, 999)} ${r.int(1000, 9999)}`

function announce(r: Rng): string {
  return r.pick([
    `The ${r.pick(DAYS)} ${r.pick(SUBJECTS)} session moves to <strong>${time(r)}</strong> in ${r.pick(VENUES)}.`,
    `${r.pick(TERMS)} fees (<strong>${money(r)}</strong>) are due by <strong>${date(r)}</strong> — please pay via the parent portal.`,
    `${r.pick(GRADES)} class size is capped at <strong>${r.int(8, 24)}</strong> students this term.`,
    `Attendance is now <strong>${r.int(85, 99)}%</strong> — great work! 👍`,
    `Questions? Call us at <strong>${phone(r)}</strong> or reply here 💬`,
    `Please bring your <em>${r.pick(MATERIALS)}</em> to every ${r.pick(SUBJECTS)} lesson.`,
  ])
}

function bullet(r: Rng): string {
  // Emoji sit inline (not as leading pseudo-markers) so the CSS disc marker shows.
  return r.pick([
    `Confirm attendance by <strong>${date(r)}</strong> ✅`,
    `Pack the ${r.pick(MATERIALS)} for ${r.pick(DAYS)} 🎒`,
    `Late pickup after <strong>${time(r)}</strong> incurs a ${money(r)} fee ⚠️`,
    `${r.pick(GRADES)} materials updated for ${r.pick(TERMS)} 📌`,
    `Review the ${r.pick(SUBJECTS)} syllabus online →`,
  ])
}

function step(r: Rng): string {
  return r.pick([
    'Log in to the parent portal',
    `Select ${r.pick(TERMS)} enrolment`,
    `Pay the <strong>${money(r)}</strong> deposit`,
    'Download the timetable (PDF)',
    `Confirm the ${r.pick(DAYS)} slot`,
  ])
}

function link(r: Rng): string {
  const subj = r.pick(SUBJECTS).toLowerCase().replace(/\s+/g, '-')
  return `<a href="https://agora.example/schedule/${subj}-${r.int(100, 999)}">View the ${r.pick(SUBJECTS)} schedule →</a>`
}

const ul = (r: Rng, n: number) => `<ul>${Array.from({ length: n }, () => `<li>${bullet(r)}</li>`).join('')}</ul>`
const ol = (r: Rng, n: number) => `<ol>${Array.from({ length: n }, () => `<li>${step(r)}</li>`).join('')}</ol>`
const para = (r: Rng, n: number) => `<p>${Array.from({ length: n }, () => announce(r)).join(' ')}</p>`

/** A meaningful Update Message title — emoji + topic + subject/grade + venue. */
export function messageTitle(r: Rng): string {
  return `${r.pick(TITLE_EMOJI)} ${r.pick(TOPICS)} — ${r.pick(SUBJECTS)} ${r.pick(GRADES)} (${r.pick(VENUES)})`
}

/**
 * Rich HTML update message. Richness scales with `len`:
 *  - normal: h2 + paragraph + bullet list + link
 *  - long:   adds h1, h3 and an ordered step list
 *  - stress: adds h4 and long multi-paragraph sections
 */
export function htmlMessage(r: Rng, len: TextLen): string {
  const parts: string[] = []
  const topic = r.pick(TOPICS)

  if (len !== 'normal') parts.push(`<h1>${r.pick(TITLE_EMOJI)} ${topic}</h1>`)
  parts.push(`<h2>What's changing</h2>`)
  parts.push(para(r, len === 'stress' ? 4 : len === 'long' ? 2 : 1))
  parts.push(`<h3>Action items</h3>`)
  parts.push(ul(r, len === 'stress' ? 5 : len === 'long' ? 4 : 3))

  if (len !== 'normal') {
    parts.push(`<h3>How to confirm</h3>`)
    parts.push(ol(r, len === 'stress' ? 5 : 3))
  }
  if (len === 'stress') {
    parts.push(`<h4>⚠️ Important notes</h4>`)
    parts.push(para(r, 4))
  }
  parts.push(`<p>${link(r)} for the full ${r.pick(TERMS)} details.</p>`)
  return parts.join('\n')
}

const REASONS = [
  'a medical appointment',
  'a family trip abroad',
  'illness (fever)',
  'a dental appointment',
  'a religious holiday',
  'an overseas competition',
] as const

/** Ticket topics — the parent-facing purpose of the conversation. */
export const TICKET_SCENARIOS = [
  { key: 'absence', label: 'Absence Notice' },
  { key: 'enquiry', label: 'General Enquiry' },
] as const
export type TicketScenario = (typeof TICKET_SCENARIOS)[number]['key']

/**
 * A meaningful support-style chat between two participants, alternating
 * speakers, with numbers, symbols and emoji. The `scenario` shapes the topic:
 * an absence notice (parent requesting leave) or a general class enquiry.
 */
export function chatTranscript(
  r: Rng,
  a: string,
  b: string,
  messages: number,
  scenario: TicketScenario = 'enquiry',
): string {
  const firstA = a.split(' ')[0]
  const firstB = b.split(' ')[0]
  const child = r.pick(['my son', 'my daughter', 'my child'])
  const Child = child[0].toUpperCase() + child.slice(1)

  let fromA: string[]
  let fromB: string[]

  if (scenario === 'absence') {
    fromA = [
      `Hi ${firstB}, I'd like to submit an <strong>absence notice</strong> for ${child} 🙏`,
      `${Child} will be away from <strong>${date(r)}</strong> to <strong>${date(r)}</strong>, due to ${r.pick(REASONS)}.`,
      `Will ${child} miss any ${r.pick(SUBJECTS)} assessments? 📚`,
      `Should I email a supporting document?`,
      `Thank you so much! 😊`,
      `Noted — really appreciate the help 🙏`,
    ]
    fromB = [
      `Hi ${firstA}, of course. Which dates will ${child} be away? 📅`,
      `Noted 📝 I'll mark it as an <strong>excused absence</strong> ✅`,
      `There's a ${r.pick(SUBJECTS)} quiz on <strong>${date(r)}</strong> — we'll arrange a make-up session 🕒`,
      `Yes please, send the MC to admin@agora.example 📎`,
      `You're welcome. Get well soon! 🤒`,
      `All done — attendance updated for ${r.pick(TERMS)} ✅`,
    ]
  } else {
    fromA = [
      `Hi ${firstB}, quick question about ${r.pick(SUBJECTS)} ${r.pick(GRADES)} 😊`,
      `Got it. Is the ${r.pick(TERMS)} fee still ${money(r)}?`,
      `Can ${child} bring a ${r.pick(MATERIALS)}?`,
      `Thanks! What time on ${r.pick(DAYS)}?`,
      `Perfect, see you then 👍`,
      `One more thing — is ${r.pick(VENUES)} still the room?`,
    ]
    fromB = [
      `Hi ${firstA}! The ${r.pick(DAYS)} class is at <strong>${time(r)}</strong> in ${r.pick(VENUES)}.`,
      `Yes — <strong>${money(r)}</strong>, due by ${date(r)}. Pay online ✅`,
      `Of course 👍 Just bring the ${r.pick(MATERIALS)}.`,
      `We start at <strong>${time(r)}</strong>. Please arrive 10 min early 🕒`,
      `Call us at ${phone(r)} if anything changes 💬`,
      `Confirmed! Attendance is ${r.int(85, 99)}% this term 🎉`,
    ]
  }

  const lines: string[] = []
  for (let i = 0; i < messages; i++) {
    const isA = i % 2 === 0
    const who = isA ? a : b
    const side = isA ? 'msg--a' : 'msg--b'
    const text = isA ? fromA[(i >> 1) % fromA.length] : fromB[(i >> 1) % fromB.length]
    lines.push(
      `<div class="msg ${side}"><span class="who">${who}</span><span class="bubble">${text}</span></div>`,
    )
  }
  return `<div class="chat">\n${lines.join('\n')}\n</div>`
}
