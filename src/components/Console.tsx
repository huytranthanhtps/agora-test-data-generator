import type { Record, FieldMeta, TextLen } from '@/core'
import { cn } from '@/lib/cn'
import { toJSON } from '@/export/to-json'
import { toCSV } from '@/export/to-csv'
import { download, buildFilename } from '@/lib/download'
import { Minus, Plus, Sparkles, Download } from 'lucide-react'

interface Props {
  entityKey: string
  count: number
  setCount: (n: number) => void
  seed: string
  setSeed: (s: string) => void
  len: TextLen
  setLen: (l: TextLen) => void
  messages: number
  setMessages: (n: number) => void
  showMessages: boolean
  onGenerate: () => void
  rows: Record[]
  fields: FieldMeta[]
}

const LENGTHS: { value: TextLen; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'long', label: 'Long' },
  { value: 'stress', label: 'Stress' },
]

function Field({
  label,
  className,
  children,
}: {
  label: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-faint">
        {label}
      </span>
      {children}
    </div>
  )
}

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number
  min: number
  max: number
  onChange: (n: number) => void
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n))
  const btn =
    'flex h-9 w-9 items-center justify-center text-muted transition-colors hover:text-ink'
  return (
    <div className="flex items-center rounded-lg border border-line bg-surface2">
      <button type="button" aria-label="Decrease" onClick={() => onChange(clamp(value - 1))} className={btn}>
        <Minus size={14} />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value)))}
        className="h-9 w-12 border-x border-line bg-transparent text-center font-mono text-[13px] text-ink [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button type="button" aria-label="Increase" onClick={() => onChange(clamp(value + 1))} className={btn}>
        <Plus size={14} />
      </button>
    </div>
  )
}

export function Console(p: Props) {
  const hasRows = p.rows.length > 0
  const exportBtn =
    'flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface2 px-3 font-mono text-[12px] text-muted transition-colors hover:border-lineStrong hover:text-ink'

  const Arg = ({ flag, value }: { flag: string; value: string | number }) => (
    <span className="whitespace-nowrap">
      <span className="text-faint">{flag} </span>
      <span className="text-ink">{value}</span>
    </span>
  )

  return (
    <section className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-5">
      <div className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
        {/* Command readout — the live config as a pseudo-command (desktop only). */}
        <div className="hidden flex-wrap items-center gap-x-3 gap-y-1 border-b border-line bg-surface2 px-4 py-2.5 font-mono text-[12px] sm:flex">
          <span className="text-accent">▸</span>
          <span className="text-muted">generate</span>
          <span className="font-medium text-ink">{p.entityKey}</span>
          <Arg flag="--count" value={p.count} />
          <Arg flag="--len" value={p.len} />
          {p.showMessages && <Arg flag="--messages" value={p.messages} />}
          <Arg flag="--seed" value={p.seed || 'random'} />
        </div>

        {/* Controls — stacked on mobile, inline flex-wrap on desktop */}
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:gap-x-6 sm:gap-y-4">
          {/* Steppers sit side by side on mobile; flow inline on desktop */}
          <div className="flex gap-4 sm:contents">
            <Field label="Records">
              <Stepper value={p.count} min={1} max={100} onChange={p.setCount} />
            </Field>

            {p.showMessages && (
              <Field label="Messages / ticket">
                <Stepper value={p.messages} min={1} max={50} onChange={p.setMessages} />
              </Field>
            )}
          </div>

          <Field label="Text length">
            <div className="flex w-full rounded-lg border border-line bg-surface2 p-0.5 sm:w-auto">
              {LENGTHS.map((o) => {
                const on = p.len === o.value
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => p.setLen(o.value)}
                    className={cn(
                      'h-9 flex-1 rounded-md px-3.5 text-[12.5px] font-medium transition-colors sm:h-8 sm:flex-none',
                      on ? 'bg-accent text-accentInk' : 'text-muted hover:text-ink',
                    )}
                  >
                    {o.label}
                  </button>
                )
              })}
            </div>
          </Field>

          <Field label="Seed">
            <input
              value={p.seed}
              onChange={(e) => p.setSeed(e.target.value)}
              placeholder="random"
              className="h-9 w-full rounded-lg border border-line bg-surface2 px-3 font-mono text-[13px] text-ink transition-colors placeholder:text-faint focus:border-accent focus:bg-surface focus:outline-none sm:w-36"
            />
          </Field>

          <button
            onClick={p.onGenerate}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 font-display text-[14px] font-semibold text-accentInk shadow-[0_8px_24px_-10px_var(--accent-ring)] transition-all hover:bg-accentHover active:translate-y-0 sm:w-auto sm:hover:-translate-y-px"
          >
            <Sparkles size={15} />
            Generate
          </button>

          {hasRows && (
            <div className="flex gap-2 sm:ml-auto sm:self-end">
              <button
                className={cn(exportBtn, 'flex-1 justify-center sm:flex-none')}
                onClick={() =>
                  download(buildFilename(p.entityKey, 'json'), toJSON(p.rows), 'application/json')
                }
              >
                <Download size={13} /> JSON
              </button>
              <button
                className={cn(exportBtn, 'flex-1 justify-center sm:flex-none')}
                onClick={() =>
                  download(buildFilename(p.entityKey, 'csv'), toCSV(p.rows, p.fields), 'text/csv')
                }
              >
                <Download size={13} /> CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
