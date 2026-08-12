export type Platform = 'ios' | 'android' | 'other'

// UA-only detection. Note: iPadOS 13+ can masquerade as desktop Safari; such
// iPads fall through to 'other' and get the generic guide (acceptable — the
// generic guide still explains the Share → Add to Home Screen flow).
export function detectPlatform(ua: string): Platform {
  if (/android/i.test(ua)) return 'android'
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  return 'other'
}

// Reads runtime display mode. iOS Safari exposes the legacy navigator.standalone.
export function isStandalone(): boolean {
  const mm = typeof window !== 'undefined' ? window.matchMedia : undefined
  if (mm?.('(display-mode: standalone)').matches) return true
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}
