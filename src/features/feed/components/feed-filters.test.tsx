import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedFilters } from './feed-filters'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedFilters (H-11)', () => {
  it('marks the active filter and keeps the feed in the links', () => {
    renderWithIntl(<FeedFilters params={parseFeedParams({ feed: 'following' })} />)
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Polls' })).toHaveAttribute(
      'href',
      '/?feed=following&filter=polls',
    )
    expect(screen.queryByRole('link', { name: /Remove/ })).toBeNull()
  })

  it('places the community chip it receives in the row (streamed on its own)', () => {
    renderWithIntl(
      <FeedFilters params={parseFeedParams({ community: 'defi' })} chip={<span>chip</span>} />,
    )
    expect(screen.getByText('chip')).toBeInTheDocument()
  })
})
