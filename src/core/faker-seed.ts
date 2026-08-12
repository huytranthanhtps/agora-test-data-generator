import { faker, fakerEN_US, fakerEN_GB, fakerID_ID, fakerVI } from '@faker-js/faker'
import { hashSeed } from './rng'

export { faker }

// Locale-specific faker instances used for multi-country person names.
// Malaysia has no faker locale, so Indonesian (ID_ID) stands in — Malay and
// Indonesian names are both Latin and closely related.
export const LOCALE_FAKERS = {
  us: fakerEN_US,
  uk: fakerEN_GB,
  malaysia: fakerID_ID,
  vietnam: fakerVI,
} as const

export function seedFaker(seed?: string): void {
  if (seed && seed.length) {
    const s = hashSeed(seed)
    faker.seed(s)
    // Offset each locale so they don't emit correlated sequences, while staying
    // fully reproducible for a given seed.
    Object.values(LOCALE_FAKERS).forEach((f, i) => f.seed(s + i + 1))
  } else {
    faker.seed() // reset to random
    Object.values(LOCALE_FAKERS).forEach((f) => f.seed())
  }
}
