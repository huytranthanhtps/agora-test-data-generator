import type { Generator } from '../types'
import { makePerson, makeEmail, sgMobile, sgPostcode } from '../names'
import { dobForAge } from './shared'
import { faker } from '../faker-seed'
import { DEV_MARKER } from '../data'

export const parentGenerator: Generator = {
  key: 'parent',
  label: 'Parent',
  shortcut: 1,
  fields: [
    { key: 'avatar', label: 'Avatar' },
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'fullName', label: 'Full name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gender', label: 'Gender' },
    { key: 'relationship', label: 'Relationship' },
    { key: 'dob', label: 'Date of birth' },
    { key: 'address', label: 'Address' },
    { key: 'postcode', label: 'Postcode' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const p = makePerson(rng)
      const { dob } = dobForAge(rng, 28, 50)
      return {
        avatar: p.full,
        firstName: p.first,
        lastName: `${p.last} ${DEV_MARKER}`,
        fullName: `${p.full} ${DEV_MARKER}`,
        email: makeEmail(p, uniq),
        mobile: sgMobile(rng),
        gender: p.gender,
        relationship: p.gender === 'male' ? 'father' : 'mother',
        dob,
        address: len === 'stress' ? faker.location.streetAddress(true).repeat(6) : faker.location.streetAddress(len === 'long'),
        postcode: sgPostcode(rng),
      }
    })
  },
}
