import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedSort } from './feed-sort'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedSort (specs/feed-type-filter FT-09)', () => {
  it('is New, active, keeping the tab, the type and the community', () => {
    renderWithIntl(<FeedSort params={parseFeedParams({ feed: 'following', type: 'polls' })} />)
    const link = screen.getByRole('link', { name: 'New' })
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveAttribute('href', '/?feed=following&type=polls')
    // In a phone it hides: the only order (FT-02).
    expect(link).toHaveClass('hidden', 'sm:inline-flex')
  })
})
