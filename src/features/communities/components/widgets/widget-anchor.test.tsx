import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { WidgetAnchor } from './widget-anchor'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('WidgetAnchor (specs/community-widgets CW-07)', () => {
  it('a page of the site with the localized link; another site in a new tab, saying so', () => {
    renderWithIntl(
      <>
        <WidgetAnchor link={{ url: '/hub/defi', external: false, host: null }}>DeFi</WidgetAnchor>
        <WidgetAnchor link={{ url: 'https://dune.com/', external: true, host: 'dune.com' }}>
          Dune
        </WidgetAnchor>
      </>,
    )
    expect(screen.getByRole('link', { name: 'DeFi' })).not.toHaveAttribute('target')
    expect(screen.getByRole('link', { name: 'Dune (opens in a new tab)' })).toHaveAttribute(
      'rel',
      'noopener noreferrer nofollow ugc',
    )
  })
})
