import { useCallback, useRef, useState } from 'react'

export function useCopy() {
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flash = useCallback((id: string) => {
    setCopied(id)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1200)
  }, [])

  const copy = useCallback(
    (text: string, id?: string) => {
      navigator.clipboard?.writeText(text)
      flash(id ?? text)
    },
    [flash],
  )

  // Writes rich HTML to the clipboard so pasting into a WYSIWYG editor keeps
  // formatting; falls back to plain text where ClipboardItem is unavailable.
  const copyRich = useCallback(
    (html: string, plain: string, id: string) => {
      try {
        const item = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        })
        navigator.clipboard.write([item])
      } catch {
        navigator.clipboard?.writeText(plain)
      }
      flash(id)
    },
    [flash],
  )

  return { copied, copy, copyRich }
}
