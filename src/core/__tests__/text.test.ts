import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { faker, seedFaker } from '@/core/faker-seed'
import { Uniqueness } from '@/core/uniqueness'
import { generate } from '@/core/registry'
import { loremByLen, htmlMessage, chatTranscript, anchoredName } from '@/core/text'

const EMOJI = /\p{Extended_Pictographic}/u

describe('entity names', () => {
  it('anchoredName is the capitalised anchor plus a lorem tail, with no emoji', () => {
    seedFaker('s')
    const r = new Rng('s')
    for (const len of ['normal', 'long', 'stress'] as const) {
      const name = anchoredName(r, len, 'fantasy')
      expect(name).toMatch(/^Fantasy( \S+)+$/)
      expect(EMOJI.test(name)).toBe(false)
    }
  })
  it('Update Message and Calendar titles carry no emoji', () => {
    for (const [key, field] of [['message', 'title'], ['calendar', 'name']] as const) {
      for (const row of generate(key, { count: 60, len: 'stress', seed: 'no-icons' })) {
        expect(EMOJI.test(String(row[field]))).toBe(false)
      }
    }
  })
  it('Course, Class and Product names are anchored on faker values, icon-free and unsuffixed', () => {
    seedFaker('anchor')
    const genres = new Set(Array.from({ length: 400 }, () => faker.book.genre().toLowerCase()))
    const animals = new Set(Array.from({ length: 400 }, () => faker.animal.type().toLowerCase()))
    const startsWithAny = (name: string, set: Set<string>) =>
      [...set].some((v) => name.toLowerCase().startsWith(`${v} `))
    for (const len of ['normal', 'long', 'stress'] as const) {
      const opts = { count: 100, len, seed: 'anchor' }
      const courses = generate('course', opts).map((r) => String(r.name))
      const classes = generate('klass', opts).map((r) => String(r.className))
      const products = generate('product', opts).flatMap((r) => [String(r.name), String(r.variantName)])
      for (const n of courses) expect(startsWithAny(n, genres)).toBe(true)
      for (const n of classes) expect(startsWithAny(n, animals)).toBe(true)
      for (const n of [...courses, ...classes, ...products]) {
        expect(EMOJI.test(n)).toBe(false)
        expect(n).not.toMatch(/ [A-Z]{4}$/)
      }
      for (const n of products) expect(n.split(' ').length).toBeGreaterThanOrEqual(4)
      expect(new Set(courses).size).toBe(100)
      expect(new Set(classes).size).toBe(100)
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
