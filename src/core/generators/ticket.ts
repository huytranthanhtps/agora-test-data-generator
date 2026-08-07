import type { Generator } from '../types'
import { makePerson } from '../names'
import { chatTranscript } from '../text'

export const ticketGenerator: Generator = {
  key: 'ticket',
  label: 'Ticket',
  shortcut: 8,
  fields: [
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
      return {
        participantA: a,
        participantB: b,
        messages: String(n),
        conversation: chatTranscript(rng, a, b, n),
      }
    })
  },
}
