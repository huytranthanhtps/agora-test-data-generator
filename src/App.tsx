import { useEffect, useState } from 'react'
import { GENERATORS } from '@/core'
import { toJSON } from '@/export/to-json'
import { useGenerator } from '@/hooks/use-generator'
import { useTheme } from '@/hooks/use-theme'
import { useCopy } from '@/hooks/use-copy'
import { TopNav } from '@/components/TopNav'
import { Console } from '@/components/Console'
import { RecordCard } from '@/components/RecordCard'
import { HtmlPreviewDialog } from '@/components/HtmlPreviewDialog'
import { Terminal } from 'lucide-react'

export default function App() {
  const g = useGenerator()
  const { theme, toggle } = useTheme()
  const { copied, copy, copyRich } = useCopy()
  const [preview, setPreview] = useState<string | null>(null)
  const [runId, setRunId] = useState(0)

  useEffect(() => setRunId((n) => n + 1), [g.rows])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
      const match = GENERATORS.find((x) => x.shortcut === Number(e.key))
      if (match) g.selectEntity(match.key)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [g])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas font-sans text-ink">
      <TopNav active={g.entityKey} onSelect={g.selectEntity} theme={theme} onToggleTheme={toggle} />

      <Console
        entityKey={g.entityKey}
        count={g.count}
        setCount={g.setCount}
        seed={g.seed}
        setSeed={g.setSeed}
        len={g.len}
        setLen={g.setLen}
        messages={g.messages}
        setMessages={g.setMessages}
        showMessages={g.entityKey === 'ticket'}
        onGenerate={g.run}
        rows={g.rows}
        fields={g.generator.fields}
      />

      <p className="shrink-0 px-6 pb-1 pt-3 text-[12.5px] text-muted">
        Click any value to copy.{' '}
        <span className="font-medium text-ink">Update Message</span> and{' '}
        <span className="font-medium text-ink">Ticket</span> show a formatted preview — use{' '}
        <span className="font-medium text-ink">Copy formatted</span> to keep rich text for a WYSIWYG
        editor. No duplicate names within a batch.
      </p>

      <main className="min-h-0 flex-1 overflow-y-auto px-6 pb-12 pt-3">
        {g.rows.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-lineStrong text-faint">
              <Terminal size={22} />
            </div>
            <p className="font-display text-[15px] font-medium text-ink">Ready to generate</p>
            <p className="max-w-xs font-mono text-[12px] text-muted">
              ▸ hit Generate to spin up a batch of {g.generator.label} records
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {g.rows.map((row, i) => (
              <div
                key={`${runId}-${i}`}
                className="specimen-in"
                style={{ animationDelay: `${Math.min(i, 14) * 30}ms` }}
              >
                <RecordCard
                  row={row}
                  index={i}
                  fields={g.generator.fields}
                  entityLabel={g.generator.label}
                  entityKey={g.entityKey}
                  copiedId={copied}
                  onCopy={copy}
                  onCopyRow={(r) => copy(toJSON([r]), `row-${i}`)}
                  onCopyRich={copyRich}
                  onPreview={setPreview}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <HtmlPreviewDialog html={preview} onClose={() => setPreview(null)} />
    </div>
  )
}
