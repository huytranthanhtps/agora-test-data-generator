import type { Generator } from '../types'
import { loremByLen } from '../text'
import { SUBJECTS, LEVELS, SUBJECT_TYPE } from '../data'

export const courseGenerator: Generator = {
  key: 'course',
  label: 'Course',
  shortcut: 3,
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
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
      const name = uniq.ensure('course.name', () => {
        const base = `${rng.pick(SUBJECTS)} ${rng.pick(LEVELS)}`
        return len === 'stress' ? `${base} ${rng.pick(SUBJECTS)} ${rng.pick(LEVELS)} Programme` : base
      })
      const minAge = rng.int(4, 12)
      return {
        name,
        description: loremByLen(rng, len),
        subjectType: rng.pick(SUBJECT_TYPE),
        minAge: String(minAge),
        maxAge: String(minAge + rng.int(2, 4)),
        price: String(rng.int(120, 800)),
        sessions: String(rng.int(4, 12)),
        duration: String(rng.pick([60, 90, 120] as const)),
        seats: String(rng.int(8, 30)),
      }
    })
  },
}
