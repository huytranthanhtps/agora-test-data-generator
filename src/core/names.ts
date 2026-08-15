import type { Rng } from './rng'
import { Uniqueness } from './uniqueness'
import { LOCALE_FAKERS } from './faker-seed'
import { CHINESE_CHARS, NICKNAMES, EMAIL_DOMAIN } from './data'

export const COUNTRIES = ['us', 'uk', 'malaysia', 'vietnam'] as const
export type Country = (typeof COUNTRIES)[number]

export interface Person {
  first: string; last: string; full: string
  gender: 'male' | 'female'; country: Country
}

// Vietnamese faker names are Latin but carry diacritics; strip them to a plain
// ASCII romanisation (đ/Đ have no combining-mark decomposition, so map them).
const stripDiacritics = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')

/**
 * A person from one of several countries, names sourced from faker's locale
 * data. Korea/China are intentionally excluded — faker only emits native
 * script for them and cannot romanise. Vietnamese is romanised to ASCII.
 */
export function makePerson(rng: Rng): Person {
  const country = rng.pick(COUNTRIES)
  const gender: 'male' | 'female' = rng.bool() ? 'male' : 'female'
  const f = LOCALE_FAKERS[country]
  let first = f.person.firstName(gender)
  let last = f.person.lastName()
  if (country === 'vietnam') {
    first = stripDiacritics(first)
    last = stripDiacritics(last)
  }
  return { first, last, full: `${first} ${last}`, gender, country }
}

export function chineseName(rng: Rng): string {
  const n = rng.int(2, 3)
  return Array.from({ length: n }, () => rng.pick(CHINESE_CHARS)).join('')
}

export function preferredName(rng: Rng): string {
  return rng.pick(NICKNAMES)
}

export function makeEmail(person: Person, uniq: Uniqueness): string {
  const local = `${person.first}.${person.last}`
    .toLowerCase().replace(/[^a-z0-9.]+/g, '')
  let seq = 0
  return uniq.ensure('email', () => {
    const suffix = seq === 0 ? '' : String(seq)
    seq++
    // Uniqueness comes from the numeric suffix; maildrop.cc is a disposable
    // inbox service, so these never reach a real person's mailbox.
    return `${local}${suffix}@${EMAIL_DOMAIN}`
  })
}

export function sgMobile(rng: Rng): string {
  const first = rng.pick(['8', '9'] as const)
  const rest = Array.from({ length: 7 }, () => rng.int(0, 9)).join('')
  return `${first}${rest.slice(0, 3)} ${rest.slice(3)}`
}

export function sgPostcode(rng: Rng): string {
  return Array.from({ length: 6 }, () => rng.int(0, 9)).join('')
}
