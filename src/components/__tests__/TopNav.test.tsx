import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TopNav } from '@/components/TopNav'

const base = {
  active: 'parent',
  onSelect: () => {},
  theme: 'dark' as const,
  onToggleTheme: () => {},
}

describe('TopNav add-to-home button', () => {
  it('renders the button and fires onOpenAddToHome when shown', () => {
    const onOpen = vi.fn()
    render(<TopNav {...base} showAddToHome onOpenAddToHome={onOpen} />)
    fireEvent.click(screen.getByRole('button', { name: /màn hình chính/i }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('hides the button when showAddToHome is false', () => {
    render(<TopNav {...base} showAddToHome={false} onOpenAddToHome={() => {}} />)
    expect(screen.queryByRole('button', { name: /màn hình chính/i })).toBeNull()
  })
})
