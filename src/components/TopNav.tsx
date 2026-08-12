import { useEffect, useState } from 'react'
import { GENERATORS } from '@/core'
import { cn } from '@/lib/cn'
import { Check, ChevronDown, Moon, Sun } from 'lucide-react'

interface Props {
  active: string
  onSelect: (key: string) => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function TopNav({ active, onSelect, theme, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false)
  const activeLabel = GENERATORS.find((g) => g.key === active)?.label ?? 'Select'

  // Close the mobile entity menu on Escape.
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-line bg-canvas sm:static">
      <div className="flex h-14 items-center gap-4 px-4 sm:gap-6 sm:px-6">
        <div className="flex shrink-0 items-baseline gap-1.5">
          <span className="font-display text-[19px] font-bold tracking-tight text-ink">Agora</span>
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="ml-1 hidden font-mono text-[10px] uppercase tracking-[0.2em] text-faint sm:inline">
            Test Data Studio
          </span>
        </div>

        {/* Desktop: horizontal tab strip */}
        <nav className="no-scrollbar hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:flex">
          {GENERATORS.map((g) => {
            const on = active === g.key
            return (
              <button
                key={g.key}
                onClick={() => onSelect(g.key)}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] transition-colors',
                  on ? 'bg-accentSoft text-ink' : 'text-muted hover:bg-surface2 hover:text-ink',
                )}
              >
                <span className={cn('mr-1.5 font-mono text-[10px]', on ? 'text-accent' : 'text-faint')}>
                  {g.shortcut}
                </span>
                {g.label}
              </button>
            )
          })}
        </nav>

        {/* Mobile: push the theme toggle to the right */}
        <div className="flex-1 sm:hidden" />

        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-lineStrong hover:text-ink"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>

      {/* Mobile: full-width entity picker */}
      <div className="relative px-4 pb-3 sm:hidden">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-line bg-surface2 px-4 text-[15px] font-medium text-ink"
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            {activeLabel}
          </span>
          <ChevronDown
            size={17}
            className={cn('text-muted transition-transform', open && 'rotate-180')}
          />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <ul
              role="listbox"
              className="absolute left-4 right-4 z-30 mt-2 max-h-[70dvh] overflow-auto overscroll-contain rounded-xl border border-line bg-surface py-1 shadow-pop"
            >
              {GENERATORS.map((g) => {
                const on = active === g.key
                return (
                  <li key={g.key}>
                    <button
                      role="option"
                      aria-selected={on}
                      onClick={() => {
                        onSelect(g.key)
                        setOpen(false)
                      }}
                      className={cn(
                        'flex h-12 w-full items-center justify-between px-4 text-left text-[15px] transition-colors',
                        on ? 'bg-accentSoft text-ink' : 'text-muted active:bg-surface2',
                      )}
                    >
                      {g.label}
                      {on && <Check size={16} className="text-accent" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </header>
  )
}
