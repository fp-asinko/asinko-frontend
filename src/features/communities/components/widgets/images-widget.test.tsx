import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ImagesWidgetBody } from './images-widget'
import { IMAGES } from './widgets.fixture'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('ImagesWidgetBody (specs/community-widgets CW-06)', () => {
  it('shows each image with its description; a linked one leads to its page', () => {
    renderWithIntl(<ImagesWidgetBody widget={IMAGES} />)
    expect(screen.getByRole('img', { name: 'BTC held by whales' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'SOL on exchanges' })).toHaveAttribute(
      'href',
      '/asset/SOL',
    )
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
  })
})
