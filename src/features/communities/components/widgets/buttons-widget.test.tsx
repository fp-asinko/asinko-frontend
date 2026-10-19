import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ButtonsWidgetBody } from './buttons-widget'
import { BUTTONS } from './widgets.fixture'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('ButtonsWidgetBody (specs/community-widgets CW-06, CW-07)', () => {
  it('leads to a page of the site, or to another site in a new tab saying its host', () => {
    renderWithIntl(<ButtonsWidgetBody widget={BUTTONS} />)
    const dune = screen.getByRole('link', { name: /Dune at dune\.com/ })
    expect(dune).toHaveAttribute('target', '_blank')
    expect(dune).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
    expect(screen.getByRole('link', { name: 'DeFi' })).toHaveAttribute('href', '/hub/defi')
  })
})
