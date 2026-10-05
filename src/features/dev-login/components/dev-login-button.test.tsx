import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { DevLoginButton } from './dev-login-button'

const actions = vi.hoisted(() => ({ devLogin: vi.fn(), devLogout: vi.fn() }))
vi.mock('../actions/dev-login.action', () => actions)

describe('DevLoginButton (specs/dev-login)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('signs in without a session', async () => {
    actions.devLogin.mockResolvedValue({ ok: true, data: { username: 'devuser' } })
    renderWithIntl(<DevLoginButton username={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dev login' }))
    expect(actions.devLogin).toHaveBeenCalled()
  })

  it('shows who is signed in and signs out', async () => {
    actions.devLogout.mockResolvedValue({ ok: true, data: null })
    renderWithIntl(<DevLoginButton username="devuser" />)
    await userEvent.click(screen.getByRole('button', { name: '@devuser · Dev logout' }))
    expect(actions.devLogout).toHaveBeenCalled()
  })

  it('says why it failed, translated', async () => {
    actions.devLogin.mockResolvedValue({ ok: false, error: 'devLogin.errors.credentials' })
    renderWithIntl(<DevLoginButton username={null} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dev login' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong test account credentials')
  })
})
