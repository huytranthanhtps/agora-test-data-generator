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
  it('parent relationship matches gender', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) {
      expect(r.relationship).toBe(r.gender === 'male' ? 'father' : 'mother')
    }
  })
  it('parent email is firstname.lastname on the maildrop.cc domain', () => {
    seedFaker('s')
    const [r] = parentGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.email).toMatch(/^[a-z0-9.]+@maildrop\.cc$/)
  })
  it('parent emails are unique within a batch', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 30, len: 'normal' }, ctx())
    expect(new Set(rows.map((r) => r.email)).size).toBe(rows.length)
  })
  it('parent exposes children and guardians as nested html fields', () => {
    const htmlKeys = parentGenerator.fields.filter((f) => f.html).map((f) => f.key)
    expect(htmlKeys).toContain('children')
    expect(htmlKeys).toContain('guardians')
  })
  it('each parent record embeds a children block inheriting the parent surname', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 10, len: 'normal' }, ctx())
    for (const r of rows) {
      expect(r.children).toContain('Children (')
      expect(r.children).toContain(r.lastName)
    }
  })
  it('no email is duplicated across parents, children and guardians in a batch', () => {
    seedFaker('s')
    const rows = parentGenerator.generate({ count: 15, len: 'normal' }, ctx())
    const emails = rows.flatMap((r) =>
      `${r.email} ${r.children} ${r.guardians}`.match(/[a-z0-9.]+@maildrop\.cc/g) ?? [],
    )
    expect(emails.length).toBeGreaterThan(15)
    expect(new Set(emails).size).toBe(emails.length)
  })
})
