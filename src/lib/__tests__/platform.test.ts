import { describe, it, expect, afterEach, vi } from 'vitest'
import { detectPlatform, isStandalone } from '@/lib/platform'

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const IPAD =
  'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
const ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
const DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

describe('detectPlatform', () => {
  it('detects iOS (iPhone and iPad)', () => {
    expect(detectPlatform(IPHONE)).toBe('ios')
    expect(detectPlatform(IPAD)).toBe('ios')
  })
  it('detects Android', () => {
    expect(detectPlatform(ANDROID)).toBe('android')
  })
  it('falls back to other for desktop', () => {
    expect(detectPlatform(DESKTOP)).toBe('other')
  })
})

describe('isStandalone', () => {
  afterEach(() => vi.unstubAllGlobals())
  it('is true when display-mode standalone matches', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('standalone') }))
    expect(isStandalone()).toBe(true)
  })
  it('is false in a normal browser tab', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isStandalone()).toBe(false)
  })
})
