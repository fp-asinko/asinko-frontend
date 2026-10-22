import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FeedReasonLine } from './feed-reason-line'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const similar = { type: 'similar', community: { handle: '#macro', path: '/hub/macro' } } as const

describe('FeedReasonLine (specs/explore-v1 EX-01, EX-04)', () => {
  it('names the followed community that brought the card, with a link to it', () => {
    renderWithIntl(<FeedReasonLine reason={similar} />)
    expect(screen.getByText(/Because you follow/)).toHaveTextContent('Because you follow #macro')
    expect(screen.getByRole('link', { name: '#macro' })).toHaveAttribute('href', '/hub/macro')
  })

  it('names the country in the language of the page', () => {
    const country = { type: 'country', countryCode: 'AR' } as const
    const { unmount } = renderWithIntl(<FeedReasonLine reason={country} />)
    expect(screen.getByText('Popular in Argentina')).toBeInTheDocument()
    unmount()
    renderWithIntl(<FeedReasonLine reason={{ type: 'country', countryCode: 'BR' }} />, {
      locale: 'es',
    })
    expect(screen.getByText('Popular en Brasil')).toBeInTheDocument()
  })

  it('reads in Spanish and Portuguese', () => {
    const { unmount } = renderWithIntl(<FeedReasonLine reason={similar} />, { locale: 'es' })
    expect(screen.getByText(/Porque sigues/)).toHaveTextContent('Porque sigues #macro')
    unmount()
    renderWithIntl(<FeedReasonLine reason={similar} />, { locale: 'pt' })
    expect(screen.getByText(/Porque você segue/)).toHaveTextContent('Porque você segue #macro')
  })

  it('draws nothing for a country code Intl does not know', () => {
    const { container } = renderWithIntl(
      <FeedReasonLine reason={{ type: 'country', countryCode: 'QQ' }} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('carries its meaning in text: the icon is hidden from screen readers', () => {
    const { container } = renderWithIntl(<FeedReasonLine reason={similar} />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden')
  })
})
