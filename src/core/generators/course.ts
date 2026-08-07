import type { Generator } from '../types'
import { courseDescription } from '../text'
import { faker } from '../faker-seed'
import { SUBJECTS, SUBJECT_TYPE, GRADES, COURSE_FOCUS } from '../data'

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

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
      const sessions = rng.int(4, 12)
      const duration = rng.pick([60, 90, 120] as const)
      // Pick the parts INSIDE the uniqueness producer so a collision re-rolls
      // to a genuinely different name; the closure vars keep the accepted pick.
      let subject = '',
        grade = '',
        focus = ''
      const name = uniq.ensure('course.name', () => {
        subject = rng.pick(SUBJECTS)
        grade = rng.pick(GRADES)
        focus = rng.pick(COURSE_FOCUS)
        // Faker adjective lifts the combination space into the millions so a
        // batch is unique in practice; the tracker is still the hard guarantee.
        const base = `${grade} ${subject} — ${cap(faker.word.adjective())} ${focus}`
        return len === 'stress' ? `${base} (Intake ${faker.number.int({ min: 1, max: 99 })})` : base
      })
      const minAge = rng.int(4, 12)
      return {
        name,
        description: courseDescription(rng, { subject, grade, focus, sessions, duration }, len),
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
