import { describe, it, expect } from 'vitest'
import { fieldCategory } from '@/lib/field-meta'

describe('fieldCategory', () => {
  it('treats nested html blocks as rich content', () => {
    expect(fieldCategory('conversation')).toBe('rich')
    expect(fieldCategory('children')).toBe('rich')
    expect(fieldCategory('guardians')).toBe('rich')
  })
  it('classifies contact and identity fields', () => {
    expect(fieldCategory('email')).toBe('contact')
    expect(fieldCategory('firstName')).toBe('identity')
  })
})
