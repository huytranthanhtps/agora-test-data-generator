import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { seedFaker } from '@/core/faker-seed'
import { Uniqueness } from '@/core/uniqueness'
import { generate } from '@/core/registry'
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

const EMOJI = /\p{Extended_Pictographic}/u

describe('iconicName icons option', () => {
  it('icons:false never contains an emoji', () => {
    seedFaker('s')
    const r = new Rng('s')
    for (const len of ['normal', 'long', 'stress'] as const) {
      for (let i = 0; i < 60; i++) expect(EMOJI.test(iconicName(r, len, { icons: false }))).toBe(false)
    }
  })
  it('Update Message and Calendar titles carry no emoji', () => {
    for (const [key, field] of [['message', 'title'], ['calendar', 'name']] as const) {
      const rows = generate(key, { count: 60, len: 'stress', seed: 'no-icons' })
      for (const row of rows) expect(EMOJI.test(String(row[field]))).toBe(false)
    }
  })
})

describe('conversation bubbles', () => {
  const bubblesOf = (n: number) => {
    seedFaker('s')
    const html = chatTranscript(new Rng('s'), 'Alice', 'Bob', n, 'normal', new Uniqueness(new Rng('s')))
    return { html, bubbles: [...html.matchAll(/<span class="bubble">(.*?)<\/span>/g)].map((m) => m[1]) }
  }
  it('are plain text — never bold or formatted', () => {
    expect(bubblesOf(200).html).not.toContain('<strong>')
  })
  it('include emoji-only reactions, but most bubbles are text', () => {
    const { bubbles } = bubblesOf(300)
    const emojiOnly = bubbles.filter((b) => /^(\p{Extended_Pictographic}\uFE0F?\s?)+$/u.test(b))
    expect(emojiOnly.length).toBeGreaterThan(10)
    expect(emojiOnly.length).toBeLessThan(bubbles.length / 2)
    // Emoji-only bubbles repeat legitimately — they must not go through `uniq`,
    // which would append a ' XXXX' suffix.
    expect(bubbles.filter((b) => / [A-Z]{4}$/.test(b) && EMOJI.test(b))).toEqual([])
  })
  it('mention dates, times or amounts only rarely', () => {
    const { html } = bubblesOf(300)
    const hits = (html.match(/\$\d+|\b\d{2}:\d{2}\b|\b\d{2}\/\d{2}\b/g) ?? []).length
    expect(hits).toBeLessThan(60)
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
