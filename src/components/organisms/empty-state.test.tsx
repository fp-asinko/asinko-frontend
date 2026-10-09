import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './empty-state'

describe('EmptyState (specs/empty-states ES-01, ES-03)', () => {
  it('shows the title and the description, with a decorative icon', () => {
    render(
      <EmptyState
        icon={<svg data-testid="icon" />}
        title="Nothing here"
        description="Come back later."
      />,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('Come back later.')).toBeInTheDocument()
    expect(screen.getByTestId('icon').parentElement).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('shows an optional action', () => {
    render(
      <EmptyState
        icon={<svg />}
        title="Nothing here"
        action={<a href="#feed">Go</a>}
        size="section"
      />,
    )
    expect(screen.getByRole('link', { name: 'Go' })).toBeInTheDocument()
  })

  it('fits a narrow place with the icon beside the text, and draws no circle without an icon', () => {
    const { container, rerender } = render(
      <EmptyState icon={<svg data-testid="icon" />} title="No groups yet" size="inline" />,
    )
    expect(screen.getByText('No groups yet')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    rerender(<EmptyState title="No groups yet" size="inline" />)
    expect(container.querySelector('[aria-hidden]')).toBeNull()
  })
})
