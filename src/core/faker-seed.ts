import { faker, fakerEN_GB, fakerEN_HK, fakerEN_IN, fakerID_ID } from '@faker-js/faker'
import { hashSeed } from './rng'

export { faker }

// Agora runs in Singapore, so person names are drawn from its main ethnic
// groups. faker has no en_SG locale, so each ethnicity maps to a Latin-
// romanising stand-in: EN_HK gives romanised Chinese surnames (Lam/Mak/Cheng),
// ID_ID Malay/Indonesian names, EN_IN romanised Indian names, EN_GB English
// (Eurasian/expat). Native-script locales (zh_*, ta_IN) are avoided so every
// name stays ASCII-friendly.
export const LOCALE_FAKERS = {
  chinese: fakerEN_HK,
  malay: fakerID_ID,
  indian: fakerEN_IN,
  eurasian: fakerEN_GB,
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
