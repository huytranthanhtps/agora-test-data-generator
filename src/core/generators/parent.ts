import type { Generator, FieldMeta } from '../types'
import { makePerson, makeEmail, sgMobile, sgPostcode } from '../names'
import { dobForAge } from './shared'
import { makeChildren, makeGuardians, type Child, type Guardian } from './family'
import { faker } from '../faker-seed'

// Row shape is declared explicitly (a `type`, so it stays assignable to the
// index-signature `Record`) so downstream code sees children/guardians as typed
// arrays rather than opaque field values.
type ParentRow = {
  firstName: string
  lastName: string
  email: string
  mobile: string
  gender: 'male' | 'female'
  relationship: string
  dob: string
  address: string
  postcode: string
  children: Child[]
  guardians: Guardian[]
}

const CHILD_FIELDS: FieldMeta[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'preferredName', label: 'Preferred name' },
  { key: 'chineseName', label: 'Chinese name' },
  { key: 'gender', label: 'Gender' },
  { key: 'dob', label: 'Date of birth' },
  { key: 'age', label: 'Age' },
  { key: 'gradeLevel', label: 'Grade level' },
  { key: 'allergies', label: 'Allergies' },
  { key: 'email', label: 'Email' },
]

const GUARDIAN_FIELDS: FieldMeta[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'relationship', label: 'Relationship' },
  { key: 'gender', label: 'Gender' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'email', label: 'Email' },
]

export const parentGenerator: Generator<ParentRow> = {
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
    { key: 'children', label: 'Children', members: { refPrefix: 'CHD', nameKeys: ['firstName', 'lastName'], fields: CHILD_FIELDS } },
    { key: 'guardians', label: 'Guardians', members: { refPrefix: 'GRD', nameKeys: ['fullName'], badgeKey: 'relationship', fields: GUARDIAN_FIELDS } },
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
        children,
        guardians,
      }
    })
  },
}
