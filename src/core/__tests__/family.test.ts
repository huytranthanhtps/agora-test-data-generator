import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import {
  makeChildren,
  makeGuardians,
  childrenHtml,
  guardiansHtml,
  type Child,
  type Guardian,
} from '@/core/generators/family'

function rng() { return new Rng('s') }
function uniq() { return new Uniqueness(new Rng('s')) }

describe('family', () => {
  it('makeChildren yields 1-3 children, all sharing the parent last name', () => {
    seedFaker('s')
    const r = rng(), u = uniq()
    for (let i = 0; i < 20; i++) {
      const kids = makeChildren(r, u, 'Tan', 'normal')
      expect(kids.length).toBeGreaterThanOrEqual(1)
      expect(kids.length).toBeLessThanOrEqual(3)
      for (const k of kids) expect(k.lastName).toBe('Tan')
    }
  })

  it('child email is firstname.lastname on the maildrop.cc domain', () => {
    seedFaker('s')
    const kids = makeChildren(rng(), uniq(), 'Tan', 'normal')
    for (const k of kids) expect(k.email).toMatch(/^[a-z0-9.]+@maildrop\.cc$/)
  })

  it('makeGuardians yields 0-2 guardians with gender-consistent relationships', () => {
    seedFaker('s')
    const r = rng(), u = uniq()
    const male = new Set(['Grandfather', 'Uncle', 'Family Friend'])
    const female = new Set(['Grandmother', 'Aunt', 'Family Friend'])
    for (let i = 0; i < 20; i++) {
      const gs = makeGuardians(r, u)
      expect(gs.length).toBeGreaterThanOrEqual(0)
      expect(gs.length).toBeLessThanOrEqual(2)
      for (const g of gs) {
        expect((g.gender === 'male' ? male : female).has(g.relationship)).toBe(true)
      }
    }
  })

  it('childrenHtml renders each child as a list item with its name and count', () => {
    const kids: Child[] = [{
      firstName: 'Amy', lastName: 'Tan', preferredName: 'Sunny', chineseName: '',
      gender: 'female', dob: '01/01/2018', age: '8', gradeLevel: 'K2',
      allergies: 'nuts', email: 'amy.tan@maildrop.cc',
    }]
    const html = childrenHtml(kids)
    expect(html).toContain('<li>')
    expect(html).toContain('Amy Tan')
    expect(html).toContain('Children (1)')
  })

  it('guardiansHtml notes when there are no guardians', () => {
    expect(guardiansHtml([])).toMatch(/no additional guardians/i)
  })

  it('guardiansHtml lists each guardian with relationship', () => {
    const gs: Guardian[] = [{
      firstName: 'Bo', lastName: 'Lim', fullName: 'Bo Lim', gender: 'male',
      relationship: 'Uncle', mobile: '9123 4567', email: 'bo.lim@maildrop.cc',
    }]
    const html = guardiansHtml(gs)
    expect(html).toContain('Bo Lim')
    expect(html).toContain('Uncle')
    expect(html).toContain('Guardians (1)')
  })
})
