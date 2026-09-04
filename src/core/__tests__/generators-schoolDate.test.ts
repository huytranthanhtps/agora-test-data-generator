import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { generate } from '@/core/registry'
import { schoolDateGenerator } from '@/core/generators/schoolDate'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

// Dates render dd/mm/yyyy; compare as a sortable yyyy-mm-dd key.
function dateKey(d: string): string {
  const [dd, mm, yyyy] = d.split('/')
  return `${yyyy}-${mm}-${dd}`
}

describe('school date generator', () => {
  it('same seed yields identical output', () => {
    const a = generate('schoolDate', { count: 10, len: 'normal', seed: 'abc' })
    const b = generate('schoolDate', { count: 10, len: 'normal', seed: 'abc' })
    expect(a).toEqual(b)
  })

  it('emits every declared field', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 5, len: 'normal' }, ctx())
    for (const r of rows) {
      for (const f of schoolDateGenerator.fields) expect(r[f.key]).toBeTruthy()
    }
  })

  it('names are unique within a batch', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 40, len: 'normal' }, ctx())
    expect(new Set(rows.map(r => r.name)).size).toBe(rows.length)
  })

  it('honours the SQL all-day / timed and date-order constraints', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 60, len: 'normal' }, ctx())
    for (const r of rows) {
      // end_date >= start_date
      expect(dateKey(r.endDate as string) >= dateKey(r.startDate as string)).toBe(true)
      if (r.allDay === 'Yes') {
        // all-day ⇒ no times
        expect(r.startTime).toBe('—')
        expect(r.endTime).toBe('—')
      } else {
        // timed ⇒ both times present, single-day, end_time > start_time
        expect(r.allDay).toBe('No')
        expect(r.startTime).toMatch(/^\d{2}:\d{2}$/)
        expect(r.endTime).toMatch(/^\d{2}:\d{2}$/)
        expect(r.startDate).toBe(r.endDate)
        expect((r.endTime as string) > (r.startTime as string)).toBe(true) // lexical works for HH:MM
      }
    }
  })

  it('only Events are ever timed', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 60, len: 'normal' }, ctx())
    for (const r of rows) {
      if (r.allDay === 'No') expect(r.type).toBe('Event')
    }
  })

  it('emits a non-empty location for every row, spanning several shapes', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 60, len: 'normal' }, ctx())
    for (const r of rows) expect((r.location as string).length).toBeGreaterThan(0)
    // The four shapes are distinguishable: a room name starts with one of the
    // room words, a civic venue ends with a civic suffix, a street address
    // starts with a house number. Seeing >1 shape proves the picker isn't
    // stuck on a single branch.
    const shape = (v: string) =>
      /^(Room|Studio|Lab|Hall) /.test(v)
        ? 'room'
        : /(Community Club|Sports Complex|Public Library|Convention Centre)$/.test(v)
          ? 'civic'
          : /^\d/.test(v)
            ? 'street'
            : 'landmark'
    expect(new Set(rows.map(r => shape(r.location as string))).size).toBeGreaterThan(1)
  })

  it('description is rich HTML', () => {
    seedFaker('s')
    const rows = schoolDateGenerator.generate({ count: 10, len: 'normal' }, ctx())
    for (const r of rows) {
      const html = r.description as string
      expect(html).toContain('<h2>')
      expect(html).toContain('<p>')
      expect(html).toContain('<ul>')
    }
  })

  it('description richness scales with len', () => {
    const normal = generate('schoolDate', { count: 5, len: 'normal', seed: 'abc' })
    const stress = generate('schoolDate', { count: 5, len: 'stress', seed: 'abc' })
    const total = (rows: { description?: unknown }[]) =>
      rows.reduce((n, r) => n + String(r.description).length, 0)
    expect(total(stress)).toBeGreaterThan(total(normal))
  })
})
