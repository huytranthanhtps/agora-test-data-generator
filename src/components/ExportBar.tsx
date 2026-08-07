import type { FieldMeta, Record } from '@/core'
import { toJSON } from '@/export/to-json'
import { toCSV } from '@/export/to-csv'
import { download, buildFilename } from '@/lib/download'

interface Props { entityKey: string; rows: Record[]; fields: FieldMeta[] }

export function ExportBar({ entityKey, rows, fields }: Props) {
  if (rows.length === 0) return null
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm">
      <span className="text-neutral-500">{rows.length} records</span>
      <div className="ml-auto flex gap-2">
        <button onClick={() => download(buildFilename(entityKey, 'json'), toJSON(rows), 'application/json')}
          className="rounded-md border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">Export JSON</button>
        <button onClick={() => download(buildFilename(entityKey, 'csv'), toCSV(rows, fields), 'text/csv')}
          className="rounded-md border px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800">Export CSV</button>
      </div>
    </div>
  )
}
