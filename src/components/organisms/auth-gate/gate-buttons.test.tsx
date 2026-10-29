import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateProvider } from './auth-gate'
import { AccountButtons, GateButtons } from './gate-buttons'

describe('AccountButtons (G-02)', () => {
  it('keeps what the bar showed with a session', () => {
    renderWithIntl(
      <AuthGateProvider signedIn>
        <AccountButtons>
          <button type="button">Profile</button>
        </AccountButtons>
      </AuthGateProvider>,
    )
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log in' })).toBeNull()
  })

  it('offers Log in and Sign up without one, each opening its modal', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <AccountButtons>
          <button type="button">Profile</button>
        </AccountButtons>
      </AuthGateProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Profile' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Sign up' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko' })).toBeInTheDocument()
  })
})

describe('AccountButtons without a username (specs/auth AU-11)', () => {
  it('offers only to choose it, which leaves for that page', async () => {
    const assign = vi.fn()
    vi.stubGlobal('location', { ...window.location, pathname: '/en', search: '', assign })
    renderWithIntl(
      <AuthGateProvider signedIn={false} needsProfile>
        <AccountButtons>
          <button type="button">Profile</button>
        </AccountButtons>
      </AuthGateProvider>,
    )
    expect(screen.queryByRole('button', { name: 'Log in' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Choose username' }))
    expect(assign).toHaveBeenCalledWith('/en/welcome?next=%2Fen')
    vi.unstubAllGlobals()
  })
})

describe('GateButtons', () => {
  it('opens the modal to create an account or to log in', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <GateButtons />
      </AuthGateProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('dialog', { name: 'Log in to Asinko' })).toBeInTheDocument()
  })
})
