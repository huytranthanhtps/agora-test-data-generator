import type { Generator } from '../types'
import { htmlMessage, iconicName } from '../text'
import { SUBJECT_TYPE } from '../data'

export const courseGenerator: Generator = {
  key: 'course',
  label: 'Course',
  shortcut: 2,
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description', html: true },
    { key: 'subjectType', label: 'Subject type' },
    { key: 'minAge', label: 'Min age' },
    { key: 'maxAge', label: 'Max age' },
    { key: 'price', label: 'Price (SGD)' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'duration', label: 'Duration (min)' },
    { key: 'seats', label: 'Seats' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const sessions = rng.int(4, 12)
      const duration = rng.pick([60, 90, 120] as const)
      // Name is faker + lorem + icons; description is rich HTML (same generator
      // as the Update Message message field).
      const name = uniq.ensure('course.name', () => iconicName(rng, len))
      const minAge = rng.int(4, 12)
      return {
        name,
        description: htmlMessage(rng, len),
        subjectType: rng.pick(SUBJECT_TYPE),
        minAge: String(minAge),
        maxAge: String(minAge + rng.int(2, 4)),
        price: String(rng.int(120, 800)),
        sessions: String(sessions),
        duration: String(duration),
        seats: String(rng.int(8, 30)),
      }
    })
  },
}
