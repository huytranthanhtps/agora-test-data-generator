interface Props { html: string | null; onClose: () => void }

export function HtmlPreviewDialog({ html, onClose }: Props) {
  if (html === null) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 dark:bg-neutral-900"
        onClick={e => e.stopPropagation()}>
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        <button onClick={onClose} className="mt-4 rounded-md border px-3 py-1 text-sm">Close</button>
      </div>
    </div>
  )
}
