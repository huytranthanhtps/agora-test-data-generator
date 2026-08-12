import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'

function fireBeforeInstallPrompt() {
  const prompt = vi.fn().mockResolvedValue(undefined)
  const evt = Object.assign(new Event('beforeinstallprompt'), {
    prompt,
    userChoice: Promise.resolve({ outcome: 'accepted' as const }),
  })
  act(() => {
    window.dispatchEvent(evt)
  })
  return prompt
}

describe('useInstallPrompt', () => {
  it('starts with canInstall false', () => {
    const { result } = renderHook(() => useInstallPrompt())
    expect(result.current.canInstall).toBe(false)
  })

  it('captures beforeinstallprompt and can install', () => {
    const { result } = renderHook(() => useInstallPrompt())
    const prompt = fireBeforeInstallPrompt()
    expect(result.current.canInstall).toBe(true)
    act(() => result.current.promptInstall())
    expect(prompt).toHaveBeenCalledTimes(1)
  })

  it('clears canInstall after appinstalled', () => {
    const { result } = renderHook(() => useInstallPrompt())
    fireBeforeInstallPrompt()
    expect(result.current.canInstall).toBe(true)
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(result.current.canInstall).toBe(false)
  })
})
