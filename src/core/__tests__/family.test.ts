import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { makeChildren, makeGuardians } from '@/core/generators/family'

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

  it('children carry no email field', () => {
    seedFaker('s')
    const kids = makeChildren(rng(), uniq(), 'Tan', 'normal')
    for (const k of kids) expect('email' in k).toBe(false)
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

  it('each guardian has separate first and last names on the mailinator.com domain', () => {
    seedFaker('s')
    const gs = makeGuardians(rng(), uniq())
    for (const g of gs) {
      expect(g.firstName).toBeTruthy()
      expect(g.lastName).toBeTruthy()
      expect('fullName' in g).toBe(false)
      expect(g.email).toMatch(/@mailinator\.com$/)
    }
  })
})
