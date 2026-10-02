import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedTabs } from './feed-tabs'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedTabs (H-10)', () => {
  it('marks the active tab and keeps the filter in the links', () => {
    renderWithIntl(<FeedTabs params={parseFeedParams({ filter: 'polls', community: 'btc' })} />)
    const nav = screen.getByRole('navigation', { name: 'Feed' })

    expect(screen.getByRole('link', { name: 'For you' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'For you' })).toHaveAttribute(
      'href',
      '/?filter=polls&community=btc',
    )
    // Following has no community filter in the contract.
    expect(screen.getByRole('link', { name: 'Following' })).toHaveAttribute(
      'href',
      '/?feed=following&filter=polls',
    )
    expect(nav).toContainElement(screen.getByRole('button', { name: 'Live' }))
    expect(screen.getByRole('button', { name: 'Live' })).toHaveAttribute('aria-disabled', 'true')
  })
})
