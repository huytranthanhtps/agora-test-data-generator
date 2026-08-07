import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'

describe('Uniqueness', () => {
  it('never returns a duplicate within a bucket', () => {
    const uniq = new Uniqueness(new Rng('s'))
    const pool = ['a', 'b', 'c']
    let i = 0
    const out = Array.from({ length: 5 }, () =>
      uniq.ensure('names', () => pool[i++ % pool.length]),
    )
    expect(new Set(out).size).toBe(5) // suffixes added after pool exhausts
  })
  it('separate buckets are independent', () => {
    const uniq = new Uniqueness(new Rng('s'))
    const x = uniq.ensure('b1', () => 'same')
    const y = uniq.ensure('b2', () => 'same')
    expect(x).toBe('same')
    expect(y).toBe('same')
  })
})
