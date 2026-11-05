import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedChipRow, FeedFilters } from './feed-filters'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedFilters on a community page (specs/feed-type-filter FT-11)', () => {
  it('has New and the type menu, staying on the page', () => {
    renderWithIntl(
      <FeedFilters params={parseFeedParams({ type: 'theses' })} pagePath="/hub/macro" />,
    )
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute(
      'href',
      '/hub/macro?type=theses',
    )
    expect(screen.getByRole('button', { name: 'Content type: Theses' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    )
  })
})

describe('FeedChipRow (FT-03)', () => {
  it('shows the community chip it receives, and nothing without one', () => {
    const { container, rerender } = renderWithIntl(<FeedChipRow chip={<span>chip</span>} />)
    expect(screen.getByText('chip')).toBeInTheDocument()
    rerender(<FeedChipRow />)
    expect(container).toBeEmptyDOMElement()
  })
})
