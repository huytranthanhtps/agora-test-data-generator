import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { makePerson, makeEmail, sgMobile, sgPostcode, chineseName, ETHNICITIES } from '@/core/names'

describe('names', () => {
  it('mobile matches SG format', () => {
    const r = new Rng('s')
    for (let i = 0; i < 50; i++) expect(sgMobile(r)).toMatch(/^[89]\d{3} \d{4}$/)
  })
  it('postcode is 6 digits', () => {
    const r = new Rng('s')
    expect(sgPostcode(r)).toMatch(/^\d{6}$/)
  })
  it('email is unique on collision', () => {
    const uniq = new Uniqueness(new Rng('s'))
    const p = { first: 'Jon', last: 'Tan', full: 'Jon Tan', gender: 'male', ethnicity: 'chinese' } as const
    const e1 = makeEmail(p, uniq), e2 = makeEmail(p, uniq)
    expect(e1).not.toBe(e2)
    expect(e1).toMatch(/@mailinator\.com$/)
  })
  it('chineseName is 2-3 CJK chars', () => {
    const r = new Rng('s')
    expect(chineseName(r)).toMatch(/^[一-鿿]{2,3}$/)
  })
  it('makePerson full = first + last', () => {
    const p = makePerson(new Rng('s'))
    expect(p.full).toBe(`${p.first} ${p.last}`)
  })
  it('makePerson ethnicity is one of the Singapore ethnicities', () => {
    const p = makePerson(new Rng('s'))
    expect(ETHNICITIES).toContain(p.ethnicity)
  })
})
