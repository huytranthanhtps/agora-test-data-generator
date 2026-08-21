import type { Rng } from '../rng'
import type { Uniqueness } from '../uniqueness'
import type { TextLen } from '../types'
import { makePerson, makeEmail, sgMobile, chineseName, preferredName } from '../names'
import { dobForAge } from './shared'
import { loremByLen } from '../text'
import { faker } from '../faker-seed'
import { GRADES, GUARDIAN_RELATIONSHIPS } from '../data'

// A parent's household: 1–3 children (who share the parent's surname) and
// 0–2 guardians (non-parent relatives / trusted contacts). Both are returned as
// structured records nested inside the parent record — the merged Child data
// lives here rather than in a standalone generator.
//
// Child/Guardian are `type` aliases (not interfaces) so they carry an implicit
// index signature and stay assignable to `MemberRecord` (`{ [k]: string }`).

export type Child = {
  firstName: string
  lastName: string
  preferredName: string
  chineseName: string
  gender: 'male' | 'female'
  dob: string
  age: string
  gradeLevel: string
  allergies: string
}

export type Guardian = {
  firstName: string
  lastName: string
  gender: 'male' | 'female'
  relationship: string
  mobile: string
  email: string
}

/** Children inherit the parent's surname, keeping the family link explicit. */
export function makeChildren(
  rng: Rng,
  parentLast: string,
  len: TextLen,
): Child[] {
  const n = rng.int(1, 3)
  return Array.from({ length: n }, () => {
    const p = makePerson(rng)
    const { dob, age } = dobForAge(rng, 4, 16)
    // A Chinese name only fits Chinese-Singaporean children.
    const cn = p.ethnicity === 'chinese' && rng.bool(0.5) ? chineseName(rng) : ''
    const nick = preferredName(rng)
    const grade = rng.pick(GRADES)
    const allergies = len === 'normal' ? faker.lorem.words(2) : loremByLen(rng, len)
    return {
      firstName: p.first,
      lastName: parentLast,
      preferredName: nick,
      chineseName: cn,
      gender: p.gender,
      dob,
      age: String(age),
      gradeLevel: grade,
      allergies,
    }
  })
}

/** Guardians are unrelated in surname; the relationship stays gender-consistent. */
export function makeGuardians(rng: Rng, uniq: Uniqueness): Guardian[] {
  const n = rng.int(0, 2)
  return Array.from({ length: n }, () => {
    const p = makePerson(rng)
    return {
      firstName: p.first,
      lastName: p.last,
      gender: p.gender,
      relationship: rng.pick(GUARDIAN_RELATIONSHIPS[p.gender]),
      mobile: sgMobile(rng),
      email: makeEmail(p, uniq),
    }
  })
}
