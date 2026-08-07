import type { Rng } from './rng'
import type { Uniqueness } from './uniqueness'

export type TextLen = 'normal' | 'long' | 'stress'
export type Record = { [key: string]: string }

export interface FieldMeta {
  key: string
  label: string
  html?: boolean
}

export interface GenerateOptions {
  count: number
  len: TextLen
  seed?: string
  messagesPerTicket?: number
}

export interface GenContext {
  rng: Rng
  uniq: Uniqueness
}

export interface Generator<T extends Record = Record> {
  key: string
  label: string
  shortcut: number
  fields: FieldMeta[]
  generate(opts: GenerateOptions, ctx: GenContext): T[]
}
