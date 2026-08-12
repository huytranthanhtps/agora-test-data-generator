import type { MouseEvent } from 'react'

/**
 * Chat bubbles are rendered via `dangerouslySetInnerHTML`, so copying is done by
 * event delegation: find the tapped `.bubble`, copy its text, and flash it.
 * Returns true when a bubble was handled (so callers can ignore other clicks).
 */
export function copyBubbleFromEvent(e: MouseEvent<HTMLElement>): boolean {
  const bubble = (e.target as HTMLElement).closest('.bubble') as HTMLElement | null
  if (!bubble) return false
  const text = bubble.textContent?.trim() ?? ''
  if (!text) return false
  navigator.clipboard?.writeText(text)
  bubble.classList.add('bubble--copied')
  window.setTimeout(() => bubble.classList.remove('bubble--copied'), 1000)
  return true
}
