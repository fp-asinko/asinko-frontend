import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AssetWithoutCommunity } from './asset-without-community'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('AssetWithoutCommunity (specs/backend-answer-1013 BA-09)', () => {
  it('titles the page with the symbol and its name, and says the community is coming', () => {
    renderWithIntl(
      <AssetWithoutCommunity
        asset={{
          symbol: 'XAU/USD',
          handle: '$XAU/USD',
          name: 'Gold Spot / US Dollar',
          logoUrl: null,
          communitySlug: null,
        }}
      />,
    )
    expect(screen.getByRole('heading', { level: 1, name: '$XAU/USD' })).toBeInTheDocument()
    expect(screen.getByText('Gold Spot / US Dollar')).toBeInTheDocument()
    expect(screen.getByText('$XAU/USD does not have a community yet')).toBeInTheDocument()
    // No members, no Join: there is no community to join.
    expect(screen.queryByRole('button', { name: /Join/ })).toBeNull()
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/')
  })
})
