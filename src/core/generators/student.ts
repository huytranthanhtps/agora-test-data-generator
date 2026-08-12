import type { Generator } from '../types'
import { makePerson, chineseName, preferredName } from '../names'
import { dobForAge } from './shared'
import { loremByLen } from '../text'
import { faker } from '../faker-seed'
import { GRADES } from '../data'

export const studentGenerator: Generator = {
  key: 'student',
  label: 'Student/Child',
  shortcut: 2,
  fields: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'preferredName', label: 'Preferred name' },
    { key: 'chineseName', label: 'Chinese name' },
    { key: 'gender', label: 'Gender' },
    { key: 'dob', label: 'Date of birth' },
    { key: 'age', label: 'Age' },
    { key: 'gradeLevel', label: 'Grade level' },
    { key: 'allergies', label: 'Allergies' },
  ],
  generate({ count, len }, { rng }) {
    return Array.from({ length: count }, () => {
      const p = makePerson(rng)
      const { dob, age } = dobForAge(rng, 4, 16)
      return {
        firstName: p.first,
        lastName: p.last,
        preferredName: preferredName(rng),
        // A Chinese name only fits some students — here, Chinese-Malaysians.
        chineseName: p.country === 'malaysia' && rng.bool(0.5) ? chineseName(rng) : '',
        gender: p.gender,
        dob,
        age: String(age),
        gradeLevel: rng.pick(GRADES),
        allergies: len === 'normal' ? faker.lorem.words(2) : loremByLen(rng, len),
      }
    })
  },
}
