import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { BackButton } from './back-button'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function cameFrom(referrer: string) {
  vi.spyOn(document, 'referrer', 'get').mockReturnValue(referrer)
  vi.spyOn(history, 'length', 'get').mockReturnValue(2)
}

describe('BackButton (specs/community-pages, specs/post-detail-refresh PD-01)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('says "Back" over a banner, and only shows the arrow on the page, named for readers', () => {
    const { rerender } = renderWithIntl(<BackButton />)
    expect(screen.getByRole('button', { name: 'Back' })).toHaveTextContent('Back')
    rerender(<BackButton variant="plain" />)
    expect(screen.getByRole('button', { name: 'Back' })).toHaveTextContent('')
  })

  it('goes back when the visit came from the site', async () => {
    cameFrom(`${location.origin}/en`)
    renderWithIntl(<BackButton variant="plain" />)
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(router.back).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })

  it('goes to the Home from a link opened directly or from another site', async () => {
    cameFrom('https://elsewhere.example/post')
    renderWithIntl(<BackButton variant="plain" />)
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(router.push).toHaveBeenCalledWith('/')
    expect(router.back).not.toHaveBeenCalled()
  })

  it('says "Volver" in Spanish', () => {
    renderWithIntl(<BackButton variant="plain" />, { locale: 'es' })
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument()
  })
})
