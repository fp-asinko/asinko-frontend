import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { MARIA } from '../feed-items.fixture'
import { CardByline } from './card-byline'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const hourAgo = () => new Date(Date.now() - 3600_000).toISOString()

describe('CardByline', () => {
  it('shows author, accuracy, community link and relative time', () => {
    renderWithIntl(
      <CardByline
        author={MARIA}
        community={{ slug: 'defi', name: 'DeFi', handle: '#defi' }}
        publishedAt={hourAgo()}
      />,
    )
    expect(screen.getByText('@maria')).toBeInTheDocument()
    expect(screen.getByText('74% accuracy, high')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '#defi' })).toHaveAttribute('href', '/?community=defi')
    expect(screen.getByText('1 hour ago').tagName).toBe('TIME')
  })

  it('shows a system item as Asinko and marks edits', () => {
    renderWithIntl(<CardByline author={null} community={null} publishedAt={hourAgo()} edited />)
    expect(screen.getByText('Asinko')).toBeInTheDocument()
    expect(screen.getByText('edited')).toBeInTheDocument()
    expect(screen.queryByRole('link')).toBeNull()
  })

  it.each([
    ['es', /hace 1 hora/, /74\s%\sde precisión, alta/],
    ['pt', /há 1 hora/, /74%\sde precisão, alta/],
  ] as const)('formats time and accuracy in %s (H-22)', (locale, time, accuracy) => {
    renderWithIntl(<CardByline author={MARIA} community={null} publishedAt={hourAgo()} />, {
      locale,
    })
    expect(screen.getByText(time).tagName).toBe('TIME')
    expect(screen.getByText(accuracy)).toBeInTheDocument()
  })

  it.each([
    [0.74, 'high'],
    [0.55, 'medium'],
    [0.31, 'low'],
  ] as const)('names the accuracy tier of %s for screen readers (FC-03)', (accuracyRate, tier) => {
    renderWithIntl(
      <CardByline author={{ ...MARIA, accuracyRate }} community={null} publishedAt={hourAgo()} />,
    )
    expect(screen.getByText(new RegExp(`accuracy, ${tier}$`))).toBeInTheDocument()
  })
})
