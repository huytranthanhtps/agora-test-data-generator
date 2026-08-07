import { describe, it, expect } from 'vitest'
import { buildFilename } from '@/lib/download'

describe('buildFilename', () => {
  it('composes entity and extension', () => {
    expect(buildFilename('parent', 'json')).toBe('agora-parent.json')
  })
})
