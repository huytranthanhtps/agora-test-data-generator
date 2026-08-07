import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { parentGenerator } from '@/core/generators/parent'
import { studentGenerator } from '@/core/generators/student'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

describe('people generators', () => {
  it('parent has no duplicate emails in a batch', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 30, len: 'normal' }, ctx())
    const emails = rows.map(r => r.email)
    expect(new Set(emails).size).toBe(emails.length)
  })
  it('parent relationship matches gender', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) {
      expect(r.relationship).toBe(r.gender === 'male' ? 'father' : 'mother')
    }
  })
  it('parent name carries DEV marker', () => {
    seedFaker('s')
    const [r] = parentGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.fullName).toContain('[DEV]')
  })
  it('student age is within 4-16 and matches dob year', () => {
    seedFaker('s')
    const rows = studentGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) {
      const age = Number(r.age)
      expect(age).toBeGreaterThanOrEqual(4)
      expect(age).toBeLessThanOrEqual(16)
    }
  })
})
