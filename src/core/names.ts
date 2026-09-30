import type { Rng } from './rng'
import { Uniqueness } from './uniqueness'
import { LOCALE_FAKERS } from './faker-seed'
import { CHINESE_CHARS, NICKNAMES, EMAIL_DOMAIN } from './data'

// Name-origin groups; each maps to a pool of Latin-script faker locales
// (see faker-seed.ts LOCALE_FAKERS).
export const ETHNICITIES = ['chinese', 'indian', 'african', 'western'] as const
export type Ethnicity = (typeof ETHNICITIES)[number]

export interface Person {
  first: string; last: string; full: string
  gender: 'male' | 'female'; ethnicity: Ethnicity
}

/**
 * A person drawn from a name-origin group, with names sourced from a locale in
 * that group's Latin-script faker pool. Native-script locales (Chinese/Tamil) are
 * intentionally avoided so every name stays ASCII-friendly; a Chinese person's
 * CJK name is added separately (see `chineseName`).
 */
export function makePerson(rng: Rng): Person {
  const ethnicity = rng.pick(ETHNICITIES)
  const gender: 'male' | 'female' = rng.bool() ? 'male' : 'female'
  const f = rng.pick(LOCALE_FAKERS[ethnicity])
  const first = f.person.firstName(gender)
  const last = f.person.lastName()
  return { first, last, full: `${first} ${last}`, gender, ethnicity }
}

export function chineseName(rng: Rng): string {
  const n = rng.int(2, 3)
  return Array.from({ length: n }, () => rng.pick(CHINESE_CHARS)).join('')
}

export function preferredName(rng: Rng): string {
  return rng.pick(NICKNAMES)
}

export function makeEmail(person: Person, uniq: Uniqueness, rng: Rng): string {
  const local = `${person.first}.${person.last}`
    .toLowerCase().replace(/[^a-z0-9.]+/g, '')
  return uniq.ensure('email', () => {
    const num = String(rng.int(0, 99)).padStart(2, '0')
    // yopmail.com is a disposable inbox service, so these never reach a real
    // person's mailbox.
    return `${local}${num}@${EMAIL_DOMAIN}`
  })
}

// Singapore plan: 8xxx xxxx, or 9yxx xxxx with y in 0-8 (99xx is not a mobile range).
export function sgMobile(rng: Rng): string {
  const first = rng.pick(['8', '9'] as const)
  const second = rng.int(0, first === '9' ? 8 : 9)
  const rest = Array.from({ length: 6 }, () => rng.int(0, 9)).join('')
  return `${first}${second}${rest.slice(0, 2)} ${rest.slice(2)}`
}

export function sgPostcode(rng: Rng): string {
  return Array.from({ length: 6 }, () => rng.int(0, 9)).join('')
}
