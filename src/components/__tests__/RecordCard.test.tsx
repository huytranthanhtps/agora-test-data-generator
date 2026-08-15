import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RecordCard } from '@/components/RecordCard'
import type { FieldMeta, Record } from '@/core'

const fields: FieldMeta[] = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  {
    key: 'children',
    label: 'Children',
    members: {
      refPrefix: 'CHD',
      nameKeys: ['firstName', 'lastName'],
      fields: [
        { key: 'firstName', label: 'First name' },
        { key: 'email', label: 'Email' },
      ],
    },
  },
]

const row: Record = {
  firstName: 'Quyet',
  lastName: 'Pham',
  children: [{ firstName: 'Amy', email: 'amy.pham@mailinator.com' }],
}

const base = {
  index: 0,
  entityLabel: 'Parent',
  entityKey: 'parent',
  copiedId: null,
  onCopyRow: () => {},
  onCopyRich: () => {},
  onPreview: () => {},
}

describe('RecordCard members', () => {
  it('renders each nested child field as a copyable value', () => {
    const onCopy = vi.fn()
    render(<RecordCard {...base} row={row} fields={fields} onCopy={onCopy} />)
    const btn = screen.getByRole('button', { name: /amy\.pham@mailinator\.com/ })
    fireEvent.click(btn)
    expect(onCopy).toHaveBeenCalledWith('amy.pham@mailinator.com', expect.any(String))
  })

  it('shows a ref tag for each member', () => {
    render(<RecordCard {...base} row={row} fields={fields} onCopy={() => {}} />)
    expect(screen.getByText('CHD-01')).toBeTruthy()
  })
})
