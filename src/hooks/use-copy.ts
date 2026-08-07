import { useCallback, useRef, useState } from 'react'

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const copy = useCallback((text: string, id?: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id ?? text)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1200)
  }, [])
  return { copied, copy }
}
