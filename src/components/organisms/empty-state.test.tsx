import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('shows the message', () => {
    render(<EmptyState message="Nothing here" />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('shows an optional action', () => {
    render(<EmptyState message="Nothing here" action={<a href="#feed">Go</a>} />)
    expect(screen.getByRole('link', { name: 'Go' })).toBeInTheDocument()
  })
})
