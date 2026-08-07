import type { Record, FieldMeta } from '@/core/types'

function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export function toCSV(rows: Record[], fields: FieldMeta[]): string {
  const header = fields.map(f => cell(f.label)).join(',')
  const body = rows.map(r => fields.map(f => cell(r[f.key] ?? '')).join(',')).join('\n')
  return `${header}\n${body}`
}
