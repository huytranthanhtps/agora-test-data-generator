import { useLayoutEffect, useRef, useState } from 'react'
import type { FieldMeta, FieldValue, MemberRecord, Record } from '@/core'
import { cn } from '@/lib/cn'
import { copyBubbleFromEvent } from '@/lib/bubble-copy'
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

const rowAction =
  'flex items-center gap-1.5 rounded-md border border-line bg-surface2 px-2.5 py-1 font-mono text-[11px] text-muted transition-colors hover:border-lineStrong hover:text-ink'

const asStr = (v: FieldValue | undefined): string => (typeof v === 'string' ? v : '')

const htmlToPlain = (html: string) =>
  html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

/** Section heading (member lists / rich blocks): a coloured dot, a label, and an optional count. */
function SectionHeader({
  label,
  colorVar,
  count,
}: {
  label: string
  colorVar: string
  count?: number
}) {
  return (
    <dt className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.14em] text-faint">
      <span className="h-[6px] w-[6px] rounded-full" style={{ background: colorVar }} />
      {label}
      {count !== undefined && (
        <span className="font-mono text-[10px] normal-case tracking-normal text-faint">({count})</span>
      )}
    </dt>
  )
}

/** A single label + copyable value line, shared by parent fields and members. */
function CopyRow({
  fieldKey,
  label,
  value,
  id,
  copied,
  onCopy,
}: {
  fieldKey: string
  label: string
  value: string
  id: string
  copied: boolean
  onCopy: (text: string, id: string) => void
}) {
  const cat = fieldCategory(fieldKey)
  return (
    <div className="grid grid-cols-[84px_1fr] items-start gap-3 border-t border-line py-2 first:border-t-0 sm:grid-cols-[100px_1fr]">
      <dt className="flex items-start gap-1.5 pt-[3px] text-[10px] font-medium uppercase leading-[1.4] tracking-[0.1em] text-faint">
        <span
          className="mt-[3px] h-[6px] w-[6px] shrink-0 rounded-full"
          style={{ background: categoryColorVar(cat) }}
        />
        <span>{label}</span>
      </dt>
      <dd className="min-w-0">
        <button
          onClick={() => onCopy(value, id)}
          title="Click to copy"
          className={cn(
            'group/v -mx-1.5 flex max-w-full items-start gap-1.5 rounded px-1.5 py-0.5 text-left text-[13.5px] leading-snug text-ink transition-colors hover:bg-accentSoft',
          )}
        >
          <span className="break-words">{value}</span>
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
}

/**
 * A member list (children / guardians): each member is a compact sub-card whose
 * fields are individually copyable, one field per row (mobile-first vertical).
 * Empty sub-values (e.g. a blank Chinese name) are skipped to stay tidy.
 */
function MemberList({
  field,
  members,
  index,
  copiedId,
  onCopy,
}: {
  field: FieldMeta
  members: MemberRecord[]
  index: number
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}) {
  const spec = field.members!
  return (
    <div className="border-t border-line py-3 first:border-t-0">
      <SectionHeader label={field.label} colorVar={categoryColorVar('rich')} count={members.length} />

      {members.length === 0 ? (
        <p className="px-0.5 text-[12.5px] italic text-faint">None.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {members.map((m, mi) => {
            const name = spec.nameKeys.map((k) => asStr(m[k])).filter(Boolean).join(' ')
            const ref = `${spec.refPrefix}-${String(mi + 1).padStart(2, '0')}`
            const badge = spec.badgeKey ? asStr(m[spec.badgeKey]) : ''
            return (
              <div key={mi} className="overflow-hidden rounded-lg border border-line bg-surface2">
                <div className="flex items-center gap-2.5 border-b border-line px-3 py-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-[10px] font-semibold text-white"
                    style={{ background: `hsl(${hueFromString(name)} 50% 45%)` }}
                  >
                    {initialsFrom(name)}
                  </span>
                  <div className="min-w-0 flex-1 truncate font-display text-[13px] font-semibold text-ink">
                    {name}
                  </div>
                  {badge && (
                    <span className="shrink-0 rounded-full bg-accentSoft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
                      {badge}
                    </span>
                  )}
                  <span className="shrink-0 font-mono text-[10px] text-muted">{ref}</span>
                </div>
                <dl className="flex flex-col px-3 py-1">
                  {spec.fields.map((sf) => {
                    const v = asStr(m[sf.key])
                    if (!v) return null
                    const id = `${index}:${field.key}:${mi}:${sf.key}`
                    return (
                      <CopyRow
                        key={sf.key}
                        fieldKey={sf.key}
                        label={sf.label}
                        value={v}
                        id={id}
                        copied={copiedId === id}
                        onCopy={onCopy}
                      />
                    )
                  })}
                </dl>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/**
 * Rich-content preview. Clips tall content with a soft bottom fade (no inner
 * scrollbar, so the card never competes with the page for scroll) and offers
 * Expand for the full view. Tapping a chat bubble copies it.
 */
function RichBlock({
  html,
  fmtId,
  copied,
  onCopyRich,
  onPreview,
}: {
  html: string
  fmtId: string
  copied: boolean
  onCopyRich: (html: string, plain: string, id: string) => void
  onPreview: (html: string) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (el) setOverflow(el.scrollHeight - el.clientHeight > 4)
  }, [html])

  return (
    <>
      <div
        ref={ref}
        data-fade={overflow ? 'true' : undefined}
        onClick={copyBubbleFromEvent}
        className="rich-clip max-h-64 overflow-hidden rounded-lg border border-line bg-surface2 p-3"
      >
        <div className="rich" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
      <div className="mt-2 flex gap-2">
        <button className={rowAction} onClick={() => onCopyRich(html, htmlToPlain(html), fmtId)}>
          {copied ? (
            <Check size={12} style={{ color: 'var(--accent)' }} />
          ) : (
            <Copy size={12} />
          )}
          Copy formatted
        </button>
        {overflow && (
          <button className={rowAction} onClick={() => onPreview(html)}>
            <Maximize2 size={12} /> Expand
          </button>
        )}
      </div>
    </>
  )
}

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

  // People entities carry first/last — show an initials chip for scannability.
  const first = asStr(row.firstName)
  const last = asStr(row.lastName)
  const chipName = first && last ? `${first} ${last}`.replace(/\[.*?\]/g, '').trim() : ''

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
          if (f.members) {
            const value = row[f.key]
            const members = Array.isArray(value) ? value : []
            return (
              <MemberList
                key={f.key}
                field={f}
                members={members}
                index={index}
                copiedId={copiedId}
                onCopy={onCopy}
              />
            )
          }

          if (f.html) {
            const fmtId = `${index}:${f.key}:fmt`
            return (
              <div key={f.key} className="border-t border-line py-3 first:border-t-0">
                <SectionHeader label={f.label} colorVar={categoryColorVar(fieldCategory(f.key))} />
                <RichBlock
                  html={asStr(row[f.key])}
                  fmtId={fmtId}
                  copied={copiedId === fmtId}
                  onCopyRich={onCopyRich}
                  onPreview={onPreview}
                />
              </div>
            )
          }

          const id = `${index}:${f.key}`
          return (
            <CopyRow
              key={f.key}
              fieldKey={f.key}
              label={f.label}
              value={asStr(row[f.key])}
              id={id}
              copied={copiedId === id}
              onCopy={onCopy}
            />
          )
        })}
      </dl>
    </article>
  )
}
