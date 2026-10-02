import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MARIA } from '../feed-items.fixture'
import { CommentsPreview } from './comments-preview'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('CommentsPreview (H-28)', () => {
  it('shows each comment with author, time and safe Markdown', () => {
    renderWithIntl(
      <CommentsPreview
        comments={[
          {
            id: 'c1',
            author: MARIA,
            body: 'Great **data**. <script>alert(1)</script>',
            createdAt: new Date(Date.now() - 3600_000).toISOString(),
          },
        ]}
      />,
    )
    expect(screen.getByRole('listitem')).toHaveTextContent('@maria')
    expect(screen.getByText('1 hour ago').tagName).toBe('TIME')
    expect(screen.getByText('data').tagName).toBe('STRONG')
    expect(document.querySelector('script')).toBeNull()
  })

  it('says when there are no comments yet', () => {
    renderWithIntl(<CommentsPreview comments={[]} />)
    expect(screen.getByText('No comments yet.')).toBeInTheDocument()
  })

  it('offers all comments as coming soon until the post detail exists', () => {
    renderWithIntl(<CommentsPreview comments={[]} />)
    expect(screen.getByRole('button', { name: 'See all comments' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  })
})
