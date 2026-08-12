import type { Generator } from '../types'
import { makePerson } from '../names'
import { iconicName } from '../text'
import { SUBJECTS, LEVELS, BUSINESS_UNITS, VENUES, PROGRAMMES } from '../data'

export const klassGenerator: Generator = {
  key: 'klass',
  label: 'Class',
  shortcut: 5,
  fields: [
    { key: 'className', label: 'Class name' },
    { key: 'businessUnit', label: 'Business unit' },
    { key: 'venue', label: 'Venue' },
    { key: 'teachers', label: 'Teachers' },
    { key: 'courses', label: 'Courses' },
    { key: 'programmes', label: 'Programmes' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const className = uniq.ensure('class.name', () => iconicName(rng, len))
      const teachers = Array.from({ length: rng.int(1, 3) }, () =>
        uniq.ensure('class.teacher', () => makePerson(rng).full)).join(', ')
      const courses = Array.from({ length: rng.int(1, 3) }, () =>
        `${rng.pick(SUBJECTS)} ${rng.pick(LEVELS)}`).join(', ')
      const programmes = rng.sample(PROGRAMMES, rng.int(1, 2)).join(', ')
      return {
        className,
        businessUnit: rng.pick(BUSINESS_UNITS),
        venue: rng.pick(VENUES),
        teachers,
        courses,
        programmes,
      }
    })
  },
}
