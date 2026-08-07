import { GENERATORS } from '@/core'
import { cn } from '@/lib/cn'
import { Moon, Sun } from 'lucide-react'

interface Props {
  active: string
  onSelect: (key: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Sidebar({ active, onSelect, theme, onToggleTheme }: Props) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6">
        <h1 className="text-lg font-bold">Agora Test Data</h1>
        <p className="text-xs text-neutral-500">Dummy data generator</p>
      </div>
      <nav className="flex flex-col gap-1">
        {GENERATORS.map(g => (
          <button
            key={g.key}
            onClick={() => onSelect(g.key)}
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 text-left text-sm',
              active === g.key
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'hover:bg-neutral-200 dark:hover:bg-neutral-800',
            )}
          >
            <span>{g.label}</span>
            <kbd className="text-xs opacity-60">{g.shortcut}</kbd>
          </button>
        ))}
      </nav>
      <button
        onClick={onToggleTheme}
        className="mt-auto flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-200 dark:hover:bg-neutral-800"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        {theme === 'dark' ? 'Light' : 'Dark'} mode
      </button>
    </aside>
  )
}
