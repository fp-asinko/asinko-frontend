import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateProvider } from './auth-gate'
import { JoinCard } from './join-card'

describe('JoinCard (specs/guest-sidebar)', () => {
  it('says why to join, named by its title (GS-02, GS-06)', () => {
    renderWithIntl(<JoinCard />)
    const card = screen.getByRole('region', { name: 'New to Asinko?' })
    expect(card).toHaveTextContent('Every call you make is checked against the market.')
  })

  it('offers Google, Reddit as coming soon, and email (GS-02, specs/auth AU-10, AU-12)', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <JoinCard />
      </AuthGateProvider>,
    )
    expect(screen.getByRole('link', { name: 'Continue with Google' })).toHaveAttribute(
      'href',
      expect.stringMatching(/^\/auth\/google\?next=/),
    )
    expect(screen.getByRole('button', { name: 'Continue with Reddit' })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    expect(screen.queryByRole('button', { name: /Instagram|Continue with X/ })).toBeNull()
    // Email opens the account modal on its sign up form.
    await userEvent.click(screen.getByRole('button', { name: 'Continue with email' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko' })).toBeInTheDocument()
  })

  it('shows the legal text with its links as coming soon (GS-02, GS-03)', () => {
    renderWithIntl(<JoinCard />)
    expect(screen.getByText(/By continuing, you agree to our/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Terms' })).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('button', { name: 'Privacy Policy' })).toBeInTheDocument()
  })

  it('keeps the mentions background away from screen readers (GS-04)', () => {
    renderWithIntl(<JoinCard />)
    const mention = screen.getByText('$BTC')
    expect(mention.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('is translated (GS-08)', () => {
    renderWithIntl(<JoinCard />, { locale: 'es' })
    expect(screen.getByRole('region', { name: '¿Nuevo en Asinko?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar con correo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Política de privacidad' })).toBeInTheDocument()
  })
})
