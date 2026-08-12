import type { Generator } from '../types'
import { courseDescription, iconicName } from '../text'
import { SUBJECTS, SUBJECT_TYPE, GRADES, COURSE_FOCUS } from '../data'

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
      // Name is faker + lorem + icons; subject/grade/focus still drive the
      // (education-flavoured) description.
      const subject = rng.pick(SUBJECTS)
      const grade = rng.pick(GRADES)
      const focus = rng.pick(COURSE_FOCUS)
      const name = uniq.ensure('course.name', () => iconicName(rng, len))
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
