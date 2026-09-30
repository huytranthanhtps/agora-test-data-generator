import { faker, fakerEN_GB, fakerEN_HK, fakerEN_IN, fakerEN_NG, fakerEN_ZA } from '@faker-js/faker'
import type { Faker } from '@faker-js/faker'
import type { Ethnicity } from './names'
import { hashSeed } from './rng'

export { faker }

// Person names are drawn from Latin-script faker locales grouped by name origin
// (faker has no en_SG locale). EN_HK gives romanised Chinese surnames
// (Lam/Mak/Cheng), EN_IN romanised Indian names, EN_NG/EN_ZA African names, EN_GB
// English. Native-script locales (zh_*, ta_IN) are avoided so every name stays
// ASCII-friendly, and en_CA is omitted on purpose: it ships the same data as the
// base `en` locale.
export const LOCALE_FAKERS: Record<Ethnicity, readonly Faker[]> = {
  chinese: [fakerEN_HK],
  indian: [fakerEN_IN],
  african: [fakerEN_NG, fakerEN_ZA],
  western: [fakerEN_GB],
}

const ALL_LOCALES: readonly Faker[] = Object.values(LOCALE_FAKERS).flat()

export function seedFaker(seed?: string): void {
  if (seed && seed.length) {
    const s = hashSeed(seed)
    faker.seed(s)
    // Offset each locale so they don't emit correlated sequences, while staying
    // fully reproducible for a given seed.
    ALL_LOCALES.forEach((f, i) => f.seed(s + i + 1))
  } else {
    faker.seed() // reset to random
    ALL_LOCALES.forEach((f) => f.seed())
  }
}
