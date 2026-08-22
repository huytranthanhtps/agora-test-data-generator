import type { Rng } from '../rng'

// Fixed reference so seeded output is reproducible (never use Date.now()).
export const BASE_DATE = new Date(Date.UTC(2026, 0, 1))

export function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d.getTime())
  out.setUTCDate(out.getUTCDate() + n)
  return out
}

export function fmtDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0')
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getUTCFullYear()}`
}

export function fmtTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function futureDate(rng: Rng, minDays: number, maxDays: number): Date {
  return addDays(BASE_DATE, rng.int(minDays, maxDays))
}

export function dobForAge(rng: Rng, minAge: number, maxAge: number): { dob: string; age: number } {
  const age = rng.int(minAge, maxAge)
  const birth = new Date(Date.UTC(BASE_DATE.getUTCFullYear() - age, rng.int(0, 11), rng.int(1, 28)))
  return { dob: fmtDate(birth), age }
}
