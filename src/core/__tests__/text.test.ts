import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { seedFaker } from '@/core/faker-seed'
import { loremByLen, htmlMessage, chatTranscript } from '@/core/text'

describe('text', () => {
  it('stress is longer than normal', () => {
    seedFaker('s')
    const r = new Rng('s')
    const normal = loremByLen(r, 'normal')
    const stress = loremByLen(new Rng('s'), 'stress')
    expect(stress.length).toBeGreaterThan(normal.length)
  })
  it('htmlMessage contains tags', () => {
    seedFaker('s')
    expect(htmlMessage(new Rng('s'), 'normal')).toMatch(/<\w+/)
  })
  it('chatTranscript mentions both participants', () => {
    seedFaker('s')
    const html = chatTranscript(new Rng('s'), 'Alice', 'Bob', 4)
    expect(html).toContain('Alice')
    expect(html).toContain('Bob')
  })
})
