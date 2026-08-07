import type { Generator } from '../types'
import { makePerson } from '../names'
import { chatTranscript, TICKET_SCENARIOS } from '../text'

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
  generate({ count, messagesPerTicket }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const a = uniq.ensure('ticket.participant', () => makePerson(rng).full)
      const b = uniq.ensure('ticket.participant', () => makePerson(rng).full)
      const n = messagesPerTicket ?? rng.int(3, 10)
      const scenario = rng.pick(TICKET_SCENARIOS)
      return {
        subject: scenario.label,
        participantA: a,
        participantB: b,
        messages: String(n),
        conversation: chatTranscript(rng, a, b, n, scenario.key),
      }
    })
  },
}
