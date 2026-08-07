import type { TextLen } from '@/core'
import { cn } from '@/lib/cn'

interface Props {
  count: number; setCount: (n: number) => void
  seed: string; setSeed: (s: string) => void
  len: TextLen; setLen: (l: TextLen) => void
  messages: number; setMessages: (n: number) => void
  showMessages: boolean
  onGenerate: () => void
}

export function Toolbar(p: Props) {
  return (
    <div className="flex flex-wrap items-end gap-4 border-b border-neutral-200 p-4 dark:border-neutral-800">
      <label className="flex flex-col text-xs">
        Records
        <input type="number" min={1} max={100} value={p.count}
          onChange={e => p.setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
          className="mt-1 w-24 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700" />
      </label>
      <label className="flex flex-col text-xs">
        Text length
        <select value={p.len} onChange={e => p.setLen(e.target.value as TextLen)}
          className="mt-1 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700">
          <option value="normal">Normal</option>
          <option value="long">Long</option>
          <option value="stress">Stress (overflow)</option>
        </select>
      </label>
      <label className="flex flex-col text-xs">
        Seed (blank = random)
        <input value={p.seed} onChange={e => p.setSeed(e.target.value)}
          className="mt-1 w-40 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700" />
      </label>
      {p.showMessages && (
        <label className="flex flex-col text-xs">
          Messages / ticket
          <input type="number" min={1} max={50} value={p.messages}
            onChange={e => p.setMessages(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="mt-1 w-28 rounded-md border border-neutral-300 bg-transparent px-2 py-1 text-sm dark:border-neutral-700" />
        </label>
      )}
      <button onClick={p.onGenerate}
        className={cn('rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white',
          'hover:opacity-90 dark:bg-white dark:text-neutral-900')}>
        Generate
      </button>
    </div>
  )
}
