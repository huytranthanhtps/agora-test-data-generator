import type { FieldValue, Record, FieldMeta } from '@/core/types'

function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

// Member-list fields (children/guardians) hold arrays; a flat CSV cell carries
// them as a JSON string so the nested data survives the export.
function stringify(v: FieldValue | undefined): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return JSON.stringify(v)
}

export function toCSV(rows: Record[], fields: FieldMeta[]): string {
  const header = fields.map(f => cell(f.label)).join(',')
  const body = rows.map(r => fields.map(f => cell(stringify(r[f.key]))).join(',')).join('\n')
  return `${header}\n${body}`
}
