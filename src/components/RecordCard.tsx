import type { FieldMeta, Record } from '@/core'
import { cn } from '@/lib/cn'
import { fieldCategory, categoryColorVar, initialsFrom, hueFromString } from '@/lib/field-meta'
import { Braces, Check, Copy, Maximize2 } from 'lucide-react'

interface Props {
  row: Record
  fields: FieldMeta[]
  index: number
  entityLabel: string
  entityKey: string
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onCopyRow: (row: Record) => void
  onCopyRich: (html: string, plain: string, id: string) => void
  onPreview: (html: string) => void
}

const htmlToPlain = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

export function RecordCard({
  row,
  fields,
  index,
  entityLabel,
  entityKey,
  copiedId,
  onCopy,
  onCopyRow,
  onCopyRich,
  onPreview,
}: Props) {
  const specimenId = `${entityKey.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, '0')}`
  const rowAction =
    'flex items-center gap-1.5 rounded-md border border-line bg-surface2 px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-lineStrong hover:text-ink'

  // People entities carry first/last — show an initials chip for scannability.
  const chipName =
    row.firstName && row.lastName
      ? `${row.firstName} ${row.lastName}`.replace(/\[.*?\]/g, '').trim()
      : ''

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-card transition-shadow duration-300 hover:shadow-pop">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3">
        {chipName ? (
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-[12px] font-semibold text-white"
            style={{ background: `hsl(${hueFromString(chipName)} 50% 45%)` }}
          >
            {initialsFrom(chipName)}
          </span>
        ) : (
          <div className="font-display text-[24px] font-bold leading-none tracking-tight text-ink tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
            {entityLabel}
          </div>
          <div className="font-mono text-[11px] text-muted">{specimenId}</div>
        </div>
        <button className={rowAction} onClick={() => onCopyRow(row)}>
          <Braces size={13} /> JSON
        </button>
      </header>

      <dl className="flex flex-col px-4 py-2">
        {fields.map((f) => {
          const cat = fieldCategory(f.key)
          const val = row[f.key] ?? ''

          if (f.html) {
            const fmtId = `${index}:${f.key}:fmt`
            return (
              <div key={f.key} className="border-t border-line py-3 first:border-t-0">
                <dt className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
                  <span className="h-[6px] w-[6px] rounded-full" style={{ background: categoryColorVar(cat) }} />
                  {f.label}
                </dt>
                <div className="max-h-72 overflow-auto rounded-lg border border-line bg-surface2 p-3">
                  <div className="rich" dangerouslySetInnerHTML={{ __html: val }} />
                </div>
                <div className="mt-2 flex gap-2">
                  <button className={rowAction} onClick={() => onCopyRich(val, htmlToPlain(val), fmtId)}>
                    {copiedId === fmtId ? (
                      <Check size={12} style={{ color: 'var(--accent)' }} />
                    ) : (
                      <Copy size={12} />
                    )}
                    Copy formatted
                  </button>
                  <button className={rowAction} onClick={() => onPreview(val)}>
                    <Maximize2 size={12} /> Expand
                  </button>
                </div>
              </div>
            )
          }

          const id = `${index}:${f.key}`
          const copied = copiedId === id
          return (
            <div
              key={f.key}
              className="grid grid-cols-[100px_1fr] items-start gap-3 border-t border-line py-2 first:border-t-0"
            >
              <dt className="flex items-start gap-1.5 pt-[3px] text-[10px] font-medium uppercase leading-[1.4] tracking-[0.1em] text-faint">
                <span
                  className="mt-[3px] h-[6px] w-[6px] shrink-0 rounded-full"
                  style={{ background: categoryColorVar(cat) }}
                />
                <span>{f.label}</span>
              </dt>
              <dd className="min-w-0">
                <button
                  onClick={() => onCopy(val, id)}
                  title="Click to copy"
                  className={cn(
                    'group/v -mx-1.5 flex max-w-full items-start gap-1.5 rounded px-1.5 py-0.5 text-left text-[13.5px] leading-snug text-ink transition-colors hover:bg-accentSoft',
                  )}
                >
                  <span className="break-words">{val}</span>
                  {copied ? (
                    <Check size={12} className="mt-1 shrink-0" style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Copy
                      size={12}
                      className="mt-1 shrink-0 opacity-0 transition-opacity group-hover/v:opacity-50"
                    />
                  )}
                </button>
              </dd>
            </div>
          )
        })}
      </dl>
    </article>
  )
}
