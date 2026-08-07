import { useEffect, useState } from 'react'
import { GENERATORS } from '@/core'
import { toJSON } from '@/export/to-json'
import { useGenerator } from '@/hooks/use-generator'
import { useTheme } from '@/hooks/use-theme'
import { useCopy } from '@/hooks/use-copy'
import { Sidebar } from '@/components/Sidebar'
import { Toolbar } from '@/components/Toolbar'
import { RecordCard } from '@/components/RecordCard'
import { ExportBar } from '@/components/ExportBar'
import { HtmlPreviewDialog } from '@/components/HtmlPreviewDialog'

export default function App() {
  const g = useGenerator()
  const { theme, toggle } = useTheme()
  const { copied, copy } = useCopy()
  const [preview, setPreview] = useState<string | null>(null)

  // Keyboard shortcuts 1..8 select entity.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      const n = Number(e.key)
      const match = GENERATORS.find(x => x.shortcut === n)
      if (match) g.setEntityKey(match.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [g])

  return (
    <div className="flex h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <Sidebar active={g.entityKey} onSelect={g.setEntityKey} theme={theme} onToggleTheme={toggle} />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Toolbar
          count={g.count} setCount={g.setCount}
          seed={g.seed} setSeed={g.setSeed}
          len={g.len} setLen={g.setLen}
          messages={g.messages} setMessages={g.setMessages}
          showMessages={g.entityKey === 'ticket'}
          onGenerate={g.run}
        />
        <ExportBar entityKey={g.entityKey} rows={g.rows} fields={g.generator.fields} />
        <div className="grid flex-1 gap-4 overflow-auto p-4 md:grid-cols-2 xl:grid-cols-3">
          {g.rows.map((row, i) => (
            <RecordCard
              key={i} row={row} index={i} fields={g.generator.fields}
              copiedId={copied} onCopy={copy}
              onCopyRow={r => copy(toJSON([r]))}
              onPreview={setPreview}
            />
          ))}
          {g.rows.length === 0 && (
            <p className="text-sm text-neutral-500">Click Generate to create records.</p>
          )}
        </div>
      </main>
      <HtmlPreviewDialog html={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
