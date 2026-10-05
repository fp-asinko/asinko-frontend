import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { JoinCard } from './join-card'

describe('JoinCard (G-03, Q3)', () => {
  it('says why to join and opens the modal to create an account', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <JoinCard />
      </AuthGateProvider>,
    )
    const card = screen.getByRole('region', { name: 'New to Asinko?' })
    expect(card).toHaveTextContent('Build a public track record.')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko' })).toBeInTheDocument()
  })

  it('is translated', () => {
    renderWithIntl(<JoinCard />, { locale: 'es' })
    expect(screen.getByRole('region', { name: '¿Nuevo en Asinko?' })).toBeInTheDocument()
  })
})
