import { useEffect } from 'react'
import { X } from 'lucide-react'
import { copyBubbleFromEvent } from '@/lib/bubble-copy'

interface Props {
  html: string | null
  onClose: () => void
}

export function HtmlPreviewDialog({ html, onClose }: Props) {
  useEffect(() => {
    if (html === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [html, onClose])

  if (html === null) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: 'var(--overlay)' }}
      onClick={onClose}
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-5 sm:py-3.5">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">
            Preview
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-md border border-line bg-surface2 px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-lineStrong hover:text-ink"
          >
            <X size={13} /> Close
          </button>
        </div>
        <div className="overflow-auto overscroll-contain p-4 sm:p-6" onClick={copyBubbleFromEvent}>
          <div className="rich" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  )
}
