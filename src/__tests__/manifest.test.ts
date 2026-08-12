import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const manifest = JSON.parse(
  readFileSync(resolve(process.cwd(), 'public/manifest.webmanifest'), 'utf8'),
)

describe('web app manifest', () => {
  it('scope and start_url match the Vite base', () => {
    expect(manifest.start_url).toBe('/agora-test-data-generator/')
    expect(manifest.scope).toBe('/agora-test-data-generator/')
  })
  it('is installable: standalone + 192 and 512 icons', () => {
    expect(manifest.display).toBe('standalone')
    const sizes = manifest.icons.map((i: { sizes: string }) => i.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
  })
  it('has a maskable icon', () => {
    expect(manifest.icons.some((i: { purpose?: string }) => i.purpose?.includes('maskable'))).toBe(
      true,
    )
  })
})
