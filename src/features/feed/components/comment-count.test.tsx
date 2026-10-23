import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AddedComments, CommentCount } from './comment-count'

describe('CommentCount (specs/card-comment CC-03)', () => {
  it('shows the compact count, and the sentence for screen readers', () => {
    renderWithIntl(<CommentCount base={12_400} />)
    expect(screen.getByText('12.4K')).toHaveAttribute('aria-hidden')
    expect(screen.getByText('12,400 comments')).toHaveClass('sr-only')
  })

  it('goes up with the comments sent from its card', () => {
    renderWithIntl(
      <AddedComments value={{ added: 2, add: () => {} }}>
        <CommentCount base={5} />
      </AddedComments>,
    )
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('7 comments')).toBeInTheDocument()
  })
})
