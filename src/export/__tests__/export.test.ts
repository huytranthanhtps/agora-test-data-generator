import { describe, it, expect } from 'vitest'
import { toJSON } from '@/export/to-json'
import { toCSV } from '@/export/to-csv'

const fields = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }]

describe('export', () => {
  it('toJSON round-trips', () => {
    const rows = [{ a: '1', b: '2' }]
    expect(JSON.parse(toJSON(rows))).toEqual(rows)
  })
  it('toCSV quotes values with commas', () => {
    const csv = toCSV([{ a: 'x,y', b: 'z' }], fields)
    expect(csv.split('\n')[0]).toBe('A,B')
    expect(csv.split('\n')[1]).toBe('"x,y",z')
  })
  it('toCSV escapes quotes', () => {
    const csv = toCSV([{ a: 'he said "hi"', b: 'z' }], fields)
    expect(csv.split('\n')[1]).toBe('"he said ""hi""",z')
  })
})
