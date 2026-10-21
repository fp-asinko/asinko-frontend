import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { RelatedPills } from './related-pills'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('RelatedPills (specs/backend-answer-1020 BA-07)', () => {
  it('a pill for each, leading to its page', () => {
    renderWithIntl(
      <RelatedPills
        related={[
          { handle: '$GGAL', path: '/asset/GGAL' },
          { handle: '#macro', path: '/hub/macro' },
        ]}
      />,
    )
    const list = screen.getByRole('list', { name: 'Related' })
    expect(within(list).getByRole('link', { name: '$GGAL' })).toHaveAttribute('href', '/asset/GGAL')
    expect(within(list).getByRole('link', { name: '#macro' })).toHaveAttribute('href', '/hub/macro')
  })

  it('nothing without related ones', () => {
    const { container } = renderWithIntl(<RelatedPills related={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
