import { useCallback, useEffect, useRef, useState } from 'react'

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt(): { canInstall: boolean; promptInstall: () => void } {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault() // stop Chrome's default mini-infobar; we drive the UI
      deferred.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }
    const onInstalled = () => {
      deferred.current = null
      setCanInstall(false)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(() => {
    const evt = deferred.current
    if (!evt) return
    void evt.prompt()
    deferred.current = null
    setCanInstall(false)
  }, [])

  return { canInstall, promptInstall }
}
