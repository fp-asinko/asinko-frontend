import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import NotFound from './not-found'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('NotFound page (F-24)', () => {
  it('shows a translated message', () => {
    renderWithIntl(<NotFound />)
    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
  })

  it('links back to the home page', () => {
    renderWithIntl(<NotFound />)
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })
})
