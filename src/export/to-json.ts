import type { Record } from '@/core/types'

export function toJSON(rows: Record[]): string {
  return JSON.stringify(rows, null, 2)
}
