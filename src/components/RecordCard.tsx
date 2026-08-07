import type { FieldMeta, Record } from '@/core'
import { cn } from '@/lib/cn'
import { Check, Copy, Eye } from 'lucide-react'

interface Props {
  row: Record
  fields: FieldMeta[]
  index: number
  copiedId: string | null
  onCopy: (text: string, id: string) => void
  onCopyRow: (row: Record) => void
  onPreview: (html: string) => void
}

export function RecordCard({ row, fields, index, copiedId, onCopy, onCopyRow, onPreview }: Props) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500">#{index + 1}</span>
        <button onClick={() => onCopyRow(row)} className="text-xs underline opacity-70 hover:opacity-100">
          Copy row (JSON)
        </button>
      </div>
      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[minmax(120px,auto)_1fr]">
        {fields.map(f => {
          const id = `${index}:${f.key}`
          const val = row[f.key] ?? ''
          return (
            <div key={f.key} className="contents">
              <dt className="text-neutral-500">{f.label}</dt>
              <dd className="flex items-center gap-2">
                {f.html ? (
                  <button onClick={() => onPreview(val)} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Eye size={14} /> Preview HTML
                  </button>
                ) : (
                  <button onClick={() => onCopy(val, id)}
                    className={cn('group flex items-center gap-1 text-left', 'hover:text-blue-600')}
                    title="Click to copy">
                    <span className="truncate">{val}</span>
                    {copiedId === id
                      ? <Check size={14} className="text-green-600" />
                      : <Copy size={14} className="opacity-0 group-hover:opacity-60" />}
                  </button>
                )}
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}
