import type { Rng } from './rng'
import { Uniqueness } from './uniqueness'
import {
  ETHNICITY_WEIGHTS, CHINESE_SURNAMES, CHINESE_GIVEN, CHINESE_CHARS,
  MALAY_NAMES, INDIAN_NAMES, EURASIAN_SURNAMES, WESTERN_GIVEN, NICKNAMES,
  EMAIL_DOMAIN, type Ethnicity,
} from './data'

export interface Person {
  first: string; last: string; full: string
  gender: 'male' | 'female'; ethnicity: Ethnicity
}

export function makePerson(rng: Rng): Person {
  const ethnicity = rng.weighted(ETHNICITY_WEIGHTS)
  const gender: 'male' | 'female' = rng.bool() ? 'male' : 'female'
  let first: string, last: string
  switch (ethnicity) {
    case 'chinese':
      last = rng.pick(CHINESE_SURNAMES); first = rng.pick(CHINESE_GIVEN); break
    case 'malay':
      first = rng.pick(MALAY_NAMES); last = `bin ${rng.pick(MALAY_NAMES)}`; break
    case 'indian':
      first = rng.pick(INDIAN_NAMES); last = `s/o ${rng.pick(INDIAN_NAMES)}`; break
    default:
      first = rng.pick(WESTERN_GIVEN); last = rng.pick(EURASIAN_SURNAMES)
  }
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
    // `.agoradev` tag keeps generated addresses clear of real inboxes.
    return `${local}${suffix}.agoradev@${EMAIL_DOMAIN}`
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
