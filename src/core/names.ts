import type { Rng } from './rng'
import { Uniqueness } from './uniqueness'
import { LOCALE_FAKERS } from './faker-seed'
import { CHINESE_CHARS, NICKNAMES, EMAIL_DOMAIN } from './data'

// Singapore's main ethnic groups; each maps to a Latin-romanising faker locale
// (see faker-seed.ts LOCALE_FAKERS).
export const ETHNICITIES = ['chinese', 'malay', 'indian', 'eurasian'] as const
export type Ethnicity = (typeof ETHNICITIES)[number]

export interface Person {
  first: string; last: string; full: string
  gender: 'male' | 'female'; ethnicity: Ethnicity
}

/**
 * A person drawn from Singapore's main ethnic groups, names sourced from
 * Latin-romanising faker locales. Native-script locales (Chinese/Tamil) are
 * intentionally avoided so every name stays ASCII-friendly; a Chinese person's
 * CJK name is added separately (see `chineseName`).
 */
export function makePerson(rng: Rng): Person {
  const ethnicity = rng.pick(ETHNICITIES)
  const gender: 'male' | 'female' = rng.bool() ? 'male' : 'female'
  const f = LOCALE_FAKERS[ethnicity]
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

export function makeEmail(person: Person, uniq: Uniqueness): string {
  const local = `${person.first}.${person.last}`
    .toLowerCase().replace(/[^a-z0-9.]+/g, '')
  let seq = 0
  return uniq.ensure('email', () => {
    const suffix = seq === 0 ? '' : String(seq)
    seq++
    // Uniqueness comes from the numeric suffix; mailinator.com is a disposable
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
