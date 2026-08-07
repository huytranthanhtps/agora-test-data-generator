// Mulberry32 PRNG — small, fast, deterministic.
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

export class Rng {
  private state: number
  constructor(seed?: string) {
    // Non-deterministic when no seed: derive from performance/time-free source.
    const s = seed && seed.length ? hashSeed(seed) : Math.floor(Math.random() * 2 ** 32)
    this.state = s >>> 0
  }
  next(): number {
    this.state |= 0
    this.state = (this.state + 0x6d2b79f5) | 0
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1))
  }
  bool(p = 0.5): boolean {
    return this.next() < p
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }
  weighted<T>(items: readonly [T, number][]): T {
    const total = items.reduce((s, [, w]) => s + w, 0)
    let r = this.next() * total
    for (const [val, w] of items) {
      if ((r -= w) < 0) return val
    }
    return items[items.length - 1][0]
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const out = arr.slice()
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
  }
  sample<T>(arr: readonly T[], n: number): T[] {
    return this.shuffle(arr).slice(0, n)
  }
}
