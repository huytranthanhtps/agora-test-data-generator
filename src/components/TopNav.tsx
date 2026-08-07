import { GENERATORS } from '@/core'
import { cn } from '@/lib/cn'
import { Moon, Sun } from 'lucide-react'

interface Props {
  active: string
  onSelect: (key: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function TopNav({ active, onSelect, theme, onToggleTheme }: Props) {
  return (
    <header className="shrink-0 border-b border-line bg-canvas">
      <div className="flex h-14 items-center gap-6 px-6">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="font-display text-[19px] font-bold tracking-tight text-ink">Agora</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="ml-1 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-faint sm:inline">
            Test Data Studio
          </span>
        </div>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {GENERATORS.map((g) => {
            const on = active === g.key
            return (
              <button
                key={g.key}
                onClick={() => onSelect(g.key)}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'relative shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition-colors',
                  on ? 'text-ink' : 'text-muted hover:text-ink',
                )}
              >
                <span className="mr-1.5 font-mono text-[10px] text-faint">
                  {g.shortcut}
                </span>
                {g.label}
                {on && (
                  <span className="absolute inset-x-2 -bottom-[9px] h-[2px] rounded-full bg-accent" />
                )}
              </button>
            )
          })}
        </nav>

        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-lineStrong hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  )
}
