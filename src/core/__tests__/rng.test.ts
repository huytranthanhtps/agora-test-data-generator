import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'

describe('Rng', () => {
  it('is reproducible for the same seed', () => {
    const a = new Rng('abc'), b = new Rng('abc')
    const seqA = Array.from({ length: 20 }, () => a.next())
    const seqB = Array.from({ length: 20 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })
  it('differs across seeds', () => {
    const a = new Rng('abc'), b = new Rng('xyz')
    expect(a.next()).not.toEqual(b.next())
  })
  it('int is within inclusive bounds', () => {
    const r = new Rng('s')
    for (let i = 0; i < 200; i++) {
      const v = r.int(5, 8)
      expect(v).toBeGreaterThanOrEqual(5)
      expect(v).toBeLessThanOrEqual(8)
    }
  })
  it('sample returns n distinct items', () => {
    const r = new Rng('s')
    const out = r.sample(['a', 'b', 'c', 'd', 'e'], 3)
    expect(out).toHaveLength(3)
    expect(new Set(out).size).toBe(3)
  })
})
