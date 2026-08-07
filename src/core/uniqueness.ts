import type { Rng } from './rng'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export class Uniqueness {
  private buckets = new Map<string, Set<string>>()
  constructor(private rng: Rng) {}

  private set(bucket: string): Set<string> {
    let s = this.buckets.get(bucket)
    if (!s) { s = new Set(); this.buckets.set(bucket, s) }
    return s
  }

  private suffix(): string {
    return Array.from({ length: 4 }, () => LETTERS[this.rng.int(0, 25)]).join('')
  }

  ensure(bucket: string, produce: () => string, opts?: { maxTries?: number }): string {
    const seen = this.set(bucket)
    const maxTries = opts?.maxTries ?? 50
    for (let i = 0; i < maxTries; i++) {
      const v = produce()
      if (!seen.has(v)) { seen.add(v); return v }
    }
    let base = produce(), candidate = `${base} ${this.suffix()}`
    while (seen.has(candidate)) candidate = `${base} ${this.suffix()}`
    seen.add(candidate)
    return candidate
  }

  reset(): void { this.buckets.clear() }
}
