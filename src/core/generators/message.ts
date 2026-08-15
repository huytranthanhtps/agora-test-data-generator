import type { Generator } from '../types'
import { htmlMessage, iconicName } from '../text'
import { SEND_TO } from '../data'

export const messageGenerator: Generator = {
  key: 'message',
  label: 'Update Message',
  shortcut: 6,
  fields: [
    { key: 'title', label: 'Title' },
    { key: 'message', label: 'Message', html: true },
    { key: 'sendTo', label: 'Send to' },
    { key: 'type', label: 'Type' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => ({
      title: uniq.ensure('message.title', () => iconicName(rng, len)),
      message: htmlMessage(rng, len),
      sendTo: rng.pick(SEND_TO),
      type: 'update',
    }))
  },
}
