import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddToHomeDialog } from '@/components/AddToHomeDialog'

const base = { open: true, onClose: () => {}, canInstall: false, onInstall: () => {} }

describe('AddToHomeDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<AddToHomeDialog {...base} open={false} platform="android" />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the native install button on Android when installable', () => {
    const onInstall = vi.fn()
    render(<AddToHomeDialog {...base} platform="android" canInstall onInstall={onInstall} />)
    const btn = screen.getByRole('button', { name: /cài đặt ngay/i })
    fireEvent.click(btn)
    expect(onInstall).toHaveBeenCalledTimes(1)
  })

  it('shows the iOS Share guide on iOS (no install button)', () => {
    render(<AddToHomeDialog {...base} platform="ios" />)
    expect(screen.getByText(/chia sẻ/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /cài đặt ngay/i })).toBeNull()
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<AddToHomeDialog {...base} platform="other" onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
