import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedFilters } from './feed-filters'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedFilters (H-11)', () => {
  it('marks the active filter and keeps the feed in the links', () => {
    renderWithIntl(<FeedFilters params={parseFeedParams({ feed: 'siguiendo' })} community={null} />)
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Polls' })).toHaveAttribute(
      'href',
      '/?feed=siguiendo&filtro=polls',
    )
    expect(screen.queryByRole('link', { name: /Remove/ })).toBeNull()
  })

  it('shows the community chip, with the slug when the community is unknown', () => {
    renderWithIntl(<FeedFilters params={parseFeedParams({ comunidad: 'defi' })} community={null} />)
    expect(screen.getByRole('link', { name: 'Remove the #defi filter' })).toHaveAttribute(
      'href',
      '/',
    )
  })
})
