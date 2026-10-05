import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FeedListSkeleton } from './feed-list-skeleton'

describe('FeedListSkeleton (FN-01, FN-03)', () => {
  it('announces the loading and hides the decorative cards', () => {
    renderWithIntl(<FeedListSkeleton />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    expect(screen.getByTestId('feed-skeleton')).toHaveAttribute('aria-hidden', 'true')
  })
})
