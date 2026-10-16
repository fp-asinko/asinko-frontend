import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposeContext, ComposeTrigger } from './compose'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const DEFI = { id: 'd1', slug: 'defi', handle: '#defi', name: 'DeFi' }

describe('ComposeTrigger (specs/submit-page SU-02)', () => {
  it('goes to the page to create a post, in the locale, on the format asked', () => {
    renderWithIntl(
      <>
        <ComposeTrigger>Create</ComposeTrigger>
        <ComposeTrigger type="link" aria-label="Link">
          🔗
        </ComposeTrigger>
      </>,
      { locale: 'es' },
    )
    expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute('href', '/publicar')
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute(
      'href',
      '/publicar?type=link',
    )
  })

  it("takes the page's community along, or the one it names", () => {
    renderWithIntl(
      <ComposeContext value={{ scope: DEFI, setScope: vi.fn() }}>
        <ComposeTrigger>Create</ComposeTrigger>
        <ComposeTrigger community="BTC">Create in BTC</ComposeTrigger>
      </ComposeContext>,
    )
    expect(screen.getByRole('link', { name: 'Create' })).toHaveAttribute(
      'href',
      '/submit?community=defi',
    )
    expect(screen.getByRole('link', { name: 'Create in BTC' })).toHaveAttribute(
      'href',
      '/submit?community=BTC',
    )
  })
})
