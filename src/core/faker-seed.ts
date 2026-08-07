import { faker } from '@faker-js/faker'
import { hashSeed } from './rng'

export { faker }

export function seedFaker(seed?: string): void {
  if (seed && seed.length) faker.seed(hashSeed(seed))
  else faker.seed() // reset to random
}
