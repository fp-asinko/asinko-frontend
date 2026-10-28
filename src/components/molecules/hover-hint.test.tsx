import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { HoverHint } from './hover-hint'

describe('HoverHint', () => {
  it('shows its text on hover or keyboard focus, hidden from assistive tech', () => {
    render(
      <HoverHint label="Share a short thought">
        <button type="button" aria-label="Thought">
          “
        </button>
      </HoverHint>,
    )
    // The control keeps its own name: the bubble does not add to it.
    expect(screen.getByRole('button', { name: 'Thought' })).toBeInTheDocument()
    const hint = screen.getByText('Share a short thought')
    expect(hint).toHaveAttribute('aria-hidden', 'true')
    expect(hint).toHaveClass(
      'opacity-0',
      'group-hover/hint:opacity-100',
      'group-has-[:focus-visible]/hint:opacity-100',
    )
  })
})
