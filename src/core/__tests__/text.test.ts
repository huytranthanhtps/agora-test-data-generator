import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { seedFaker } from '@/core/faker-seed'
import { loremByLen, htmlMessage, chatTranscript, iconicName } from '@/core/text'

// Typographic symbols that must no longer appear in generated names.
const BANNED_SYMBOLS = ['★', '✦', '✽', '◆', '▶']

describe('iconicName icon policy', () => {
  it('inserts at most one icon and never a typographic symbol', () => {
    seedFaker('s')
    const r = new Rng('s')
    for (const len of ['normal', 'long', 'stress'] as const) {
      for (let i = 0; i < 40; i++) {
        const name = iconicName(r, len)
        for (const sym of BANNED_SYMBOLS) expect(name).not.toContain(sym)
        const icons = [...name].filter(ch => /\p{Extended_Pictographic}/u.test(ch)).length
        expect(icons).toBeLessThanOrEqual(1)
      }
    }
  })
})

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
