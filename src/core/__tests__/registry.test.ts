import { describe, it, expect } from 'vitest'
import { GENERATORS, getGenerator, generate } from '@/core/registry'

describe('registry', () => {
  it('has 7 generators with contiguous shortcuts 1..7', () => {
    expect(GENERATORS).toHaveLength(7)
    expect(GENERATORS.map(g => g.shortcut)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
  it('no longer exposes a standalone student generator', () => {
    expect(getGenerator('student')).toBeUndefined()
    expect(GENERATORS.map(g => g.key)).not.toContain('student')
  })
  it('same seed yields identical output', () => {
    const a = generate('parent', { count: 5, len: 'normal', seed: 'abc' })
    const b = generate('parent', { count: 5, len: 'normal', seed: 'abc' })
    expect(a).toEqual(b)
  })
  it('throws on unknown key', () => {
    expect(() => generate('nope', { count: 1, len: 'normal' })).toThrow()
  })
  it('getGenerator returns undefined for unknown key', () => {
    expect(getGenerator('nope')).toBeUndefined()
  })
})
