import { describe, it, expect } from 'vitest'
import { faker, seedFaker } from '@/core/faker-seed'

describe('seedFaker', () => {
  it('produces identical faker output for the same seed', () => {
    seedFaker('abc'); const a = faker.person.firstName()
    seedFaker('abc'); const b = faker.person.firstName()
    expect(a).toBe(b)
  })
})
