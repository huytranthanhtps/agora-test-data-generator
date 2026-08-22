import { describe, it, expect } from 'vitest'
import { Rng } from '@/core/rng'
import { Uniqueness } from '@/core/uniqueness'
import { seedFaker } from '@/core/faker-seed'
import { courseGenerator } from '@/core/generators/course'
import { instanceGenerator } from '@/core/generators/instance'
import { klassGenerator } from '@/core/generators/klass'

function ctx() { return { rng: new Rng('s'), uniq: new Uniqueness(new Rng('s')) } }

describe('academic generators', () => {
  it('course names are unique within a batch', () => {
    seedFaker('s')
    const rows = courseGenerator.generate({ count: 25, len: 'normal' }, ctx())
    expect(new Set(rows.map(r => r.name)).size).toBe(rows.length)
  })
  it('course maxAge >= minAge', () => {
    seedFaker('s')
    const rows = courseGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) expect(Number(r.maxAge)).toBeGreaterThanOrEqual(Number(r.minAge))
  })
  it('course description is rich HTML and the field is marked html', () => {
    const field = courseGenerator.fields.find(f => f.key === 'description')
    expect(field?.html).toBe(true)
    seedFaker('s')
    const rows = courseGenerator.generate({ count: 5, len: 'normal' }, ctx())
    for (const r of rows) expect(String(r.description)).toMatch(/<\w+/)
  })
  it('instance codes are unique 8-letter strings', () => {
    seedFaker('s')
    const rows = instanceGenerator.generate({ count: 20, len: 'normal' }, ctx())
    for (const r of rows) expect(r.courseCode).toMatch(/^[A-Z]{8}$/)
    expect(new Set(rows.map(r => r.courseCode)).size).toBe(rows.length)
  })
  it('class name is unique', () => {
    seedFaker('s')
    const rows = klassGenerator.generate({ count: 20, len: 'normal' }, ctx())
    expect(new Set(rows.map(r => r.className)).size).toBe(rows.length)
  })
})
