import type { Generator, GenerateOptions, Record } from './types'
import { Rng } from './rng'
import { Uniqueness } from './uniqueness'
import { seedFaker } from './faker-seed'
import { parentGenerator } from './generators/parent'
import { courseGenerator } from './generators/course'
import { instanceGenerator } from './generators/instance'
import { klassGenerator } from './generators/klass'
import { productGenerator } from './generators/product'
import { messageGenerator } from './generators/message'
import { ticketGenerator } from './generators/ticket'
import { schoolDateGenerator } from './generators/schoolDate'

export const GENERATORS: Generator[] = [
  parentGenerator, courseGenerator, instanceGenerator,
  klassGenerator, productGenerator, messageGenerator, ticketGenerator,
  schoolDateGenerator,
].sort((a, b) => a.shortcut - b.shortcut)

const BY_KEY = new Map(GENERATORS.map(g => [g.key, g]))

export function getGenerator(key: string): Generator | undefined {
  return BY_KEY.get(key)
}

export function generate(key: string, opts: GenerateOptions): Record[] {
  const gen = BY_KEY.get(key)
  if (!gen) throw new Error(`Unknown generator: ${key}`)
  seedFaker(opts.seed)
  const rng = new Rng(opts.seed)
  const uniq = new Uniqueness(rng)
  return gen.generate(opts, { rng, uniq })
}
