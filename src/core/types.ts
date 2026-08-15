import type { Rng } from './rng'
import type { Uniqueness } from './uniqueness'

export type TextLen = 'normal' | 'long' | 'stress'

/** A nested sub-record (a child or guardian) — always plain string values. */
export type MemberRecord = { [key: string]: string }
/** A field is either a plain string or a list of nested member records. */
export type FieldValue = string | MemberRecord[]
export type Record = { [key: string]: FieldValue }

/** Describes how a member-list field (children/guardians) renders. */
export interface MemberSpec {
  refPrefix: string // e.g. 'CHD' | 'GRD'
  nameKeys: string[] // keys joined to form the member's display name
  badgeKey?: string // optional pill value (e.g. 'relationship')
  fields: FieldMeta[] // per-member copyable sub-fields
}

export interface FieldMeta {
  key: string
  label: string
  html?: boolean
  members?: MemberSpec
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
