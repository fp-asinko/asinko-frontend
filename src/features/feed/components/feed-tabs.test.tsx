import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedTabs } from './feed-tabs'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedTabs (H-10)', () => {
  it('puts what it receives at the right, on the same line (specs/feed-type-filter FT-01)', () => {
    renderWithIntl(
      <FeedTabs params={parseFeedParams({})} trailing={<button type="button">menu</button>} />,
    )
    const nav = screen.getByRole('navigation', { name: 'Feed' })
    const menu = screen.getByRole('button', { name: 'menu' })
    expect(nav).not.toContainElement(menu)
    expect(nav.parentElement).toContainElement(menu)
  })

  it('marks the active tab and keeps the type in the links', () => {
    renderWithIntl(<FeedTabs params={parseFeedParams({ type: 'polls', community: 'BTC' })} />)
    const nav = screen.getByRole('navigation', { name: 'Feed' })

    expect(screen.getByRole('link', { name: 'For you' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'For you' })).toHaveAttribute(
      'href',
      '/?type=polls&community=BTC',
    )
    // Following has no community filter in the contract.
    expect(screen.getByRole('link', { name: 'Following' })).toHaveAttribute(
      'href',
      '/?feed=following&type=polls',
    )
    expect(nav).toContainElement(screen.getByRole('button', { name: 'Live' }))
    expect(screen.getByRole('button', { name: 'Live' })).toHaveAttribute('aria-disabled', 'true')
  })
})
