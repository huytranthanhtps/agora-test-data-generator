import type { Generator, TextLen } from '../types'
import { makePerson } from '../names'
import { chatTranscript, TICKET_SCENARIOS } from '../text'

// Text length scales the bubble count too: Long doubles, Stress triples the
// per-ticket base (from the stepper), capped at the stepper maximum.
const LEN_BUBBLES: Record<TextLen, number> = { normal: 1, long: 2, stress: 3 }

export const ticketGenerator: Generator = {
  key: 'ticket',
  label: 'Ticket',
  shortcut: 8,
  fields: [
    { key: 'subject', label: 'Subject' },
    { key: 'participantA', label: 'Participant A' },
    { key: 'participantB', label: 'Participant B' },
    { key: 'messages', label: 'Messages' },
    { key: 'conversation', label: 'Conversation', html: true },
  ],
  generate({ count, len, messagesPerTicket }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const a = uniq.ensure('ticket.participant', () => makePerson(rng).full)
      const b = uniq.ensure('ticket.participant', () => makePerson(rng).full)
      const base = messagesPerTicket ?? rng.int(3, 10)
      const n = Math.min(50, base * LEN_BUBBLES[len])
      const scenario = rng.pick(TICKET_SCENARIOS)
      return {
        subject: scenario.label,
        participantA: a,
        participantB: b,
        messages: String(n),
        conversation: chatTranscript(rng, a, b, n, len, uniq),
      }
    })
  },
}
