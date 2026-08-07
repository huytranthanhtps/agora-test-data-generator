import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { productGenerator } from '@/core/generators/product'
import { messageGenerator } from '@/core/generators/message'
import { ticketGenerator } from '@/core/generators/ticket'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

describe('misc generators', () => {
  it('product SKU matches AGR- format and is unique', () => {
    seedFaker('s')
    const rows = productGenerator.generate({ count: 25, len: 'normal' }, ctx())
    for (const r of rows) expect(r.sku).toMatch(/^AGR-[A-Z0-9]{6}$/)
    expect(new Set(rows.map(r => r.sku)).size).toBe(rows.length)
  })
  it('product currency is SGD', () => {
    seedFaker('s')
    const [r] = productGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.currency).toBe('SGD')
  })
  it('message field is HTML and type=update', () => {
    seedFaker('s')
    const [r] = messageGenerator.generate({ count: 1, len: 'normal' }, ctx())
    expect(r.type).toBe('update')
    expect(r.message).toMatch(/<\w+/)
  })
  it('ticket participants differ and conversation mentions both', () => {
    seedFaker('s')
    const [r] = ticketGenerator.generate({ count: 1, len: 'normal', messagesPerTicket: 4 }, ctx())
    expect(r.participantA).not.toBe(r.participantB)
    expect(r.conversation).toContain(r.participantA)
    expect(r.conversation).toContain(r.participantB)
  })
})
