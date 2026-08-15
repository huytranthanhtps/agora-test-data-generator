import type { Generator } from '../types'
import { makePerson, makeEmail, sgMobile, sgPostcode } from '../names'
import { dobForAge } from './shared'
import { makeChildren, makeGuardians, childrenHtml, guardiansHtml } from './family'
import { faker } from '../faker-seed'

export const parentGenerator: Generator = {
  key: 'parent',
  label: 'Parent',
  shortcut: 1,
  fields: [
    { key: 'firstName', label: 'First name' },
    { key: 'lastName', label: 'Last name' },
    { key: 'email', label: 'Email' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'gender', label: 'Gender' },
    { key: 'relationship', label: 'Relationship' },
    { key: 'dob', label: 'Date of birth' },
    { key: 'address', label: 'Address' },
    { key: 'postcode', label: 'Postcode' },
    { key: 'children', label: 'Children', html: true },
    { key: 'guardians', label: 'Guardians', html: true },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const p = makePerson(rng)
      const { dob } = dobForAge(rng, 28, 50)
      // Parent email is registered first so it keeps the clean firstname.lastname
      // form; children/guardians then draw from the same uniqueness bucket.
      const email = makeEmail(p, uniq)
      const mobile = sgMobile(rng)
      const address =
        len === 'stress'
          ? faker.location.streetAddress(true).repeat(6)
          : faker.location.streetAddress(len === 'long')
      const postcode = sgPostcode(rng)
      const children = makeChildren(rng, uniq, p.last, len)
      const guardians = makeGuardians(rng, uniq)
      return {
        firstName: p.first,
        lastName: p.last,
        email,
        mobile,
        gender: p.gender,
        relationship: p.gender === 'male' ? 'father' : 'mother',
        dob,
        address,
        postcode,
        children: childrenHtml(children),
        guardians: guardiansHtml(guardians),
      }
    })
  },
}
