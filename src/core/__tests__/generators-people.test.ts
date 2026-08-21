import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { parentGenerator } from '@/core/generators/parent'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

describe('people generators', () => {
  it('parent has no duplicate emails in a batch', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 30, len: 'normal' }, ctx())
    const emails = rows.map(r => r.email)
    expect(new Set(emails).size).toBe(emails.length)
  })
  it('every parent and guardian mobile is a Singapore number', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 20, len: 'normal' }, ctx())
    const sg = /^[89]\d{3} \d{4}$/
    for (const r of rows) {
      expect(r.mobile).toMatch(sg)
      for (const g of r.guardians) expect(g.mobile).toMatch(sg)
    }
  })
  it('parent relationship matches gender', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) {
      expect(r.relationship).toBe(r.gender === 'male' ? 'father' : 'mother')
    }
  })
  it('parent email is firstname.lastname on the yopmail.com domain', () => {
    seedFaker('s')
    const [r] = parentGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.email).toMatch(/^[a-z0-9.]+@yopmail\.com$/)
  })
  it('parent emails are unique within a batch', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 30, len: 'normal' }, ctx())
    expect(new Set(rows.map((r) => r.email)).size).toBe(rows.length)
  })
  it('parent exposes children and guardians as member fields', () => {
    const memberKeys = parentGenerator.fields.filter((f) => f.members).map((f) => f.key)
    expect(memberKeys).toContain('children')
    expect(memberKeys).toContain('guardians')
  })
  it('each parent has 1-3 children, all inheriting the parent surname', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 10, len: 'normal' }, ctx())
    for (const r of rows) {
      expect(r.children.length).toBeGreaterThanOrEqual(1)
      expect(r.children.length).toBeLessThanOrEqual(3)
      for (const c of r.children) expect(c.lastName).toBe(r.lastName)
      expect(r.guardians.length).toBeGreaterThanOrEqual(0)
      expect(r.guardians.length).toBeLessThanOrEqual(2)
    }
  })
  it('no email is duplicated across parents and guardians in a batch', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 15, len: 'normal' }, ctx())
    const emails = rows.flatMap((r) => [
      r.email,
      ...r.guardians.map((g) => g.email),
    ])
    expect(emails.length).toBeGreaterThanOrEqual(15)
    expect(new Set(emails).size).toBe(emails.length)
  })
})
