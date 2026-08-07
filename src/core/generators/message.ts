import type { Generator } from '../types'
import { htmlMessage, messageTitle } from '../text'
import { SEND_TO } from '../data'

export const messageGenerator: Generator = {
  key: 'message',
  label: 'Update Message',
  shortcut: 7,
  fields: [
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message', html: true },
    { key: 'sendTo', label: 'Send to' },
    { key: 'type', label: 'Type' },
  ],
  generate({ count, len }, { rng }) {
    return Array.from({ length: count }, () => ({
      title: messageTitle(rng),
      message: htmlMessage(rng, len),
      sendTo: rng.pick(SEND_TO),
      type: 'update',
    }))
  },
}
