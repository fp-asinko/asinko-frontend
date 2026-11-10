import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider, useAuthGate } from '@/components/organisms/auth-gate'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateForms } from './auth-gate-forms'
import { FormSkeleton } from './form-skeleton'
import { LogOutButton } from './log-out-button'
import { LoginPageForm } from './page-forms'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const actions = vi.hoisted(() => ({ logIn: vi.fn(), signUp: vi.fn(), logOut: vi.fn() }))
vi.mock('../actions/log-in.action', () => ({ logIn: actions.logIn }))
vi.mock('../actions/sign-up.action', () => ({ signUp: actions.signUp }))
vi.mock('../actions/log-out.action', () => ({ logOut: actions.logOut }))
const profile = vi.hoisted(() => ({ createProfile: vi.fn() }))
vi.mock('../actions/create-profile.action', () => ({ createProfile: profile.createProfile }))
vi.mock('../actions/set-avatar.action', () => ({ setAvatar: vi.fn() }))
vi.mock('../actions/suggested-photo.action', () => ({ getSuggestedPhoto: async () => null }))
vi.mock('../actions/check-username.action', () => ({ checkUsername: async () => 'unknown' }))
const recovery = vi.hoisted(() => ({ requestRecovery: vi.fn() }))
vi.mock('../actions/request-recovery.action', () => ({
  requestRecovery: recovery.requestRecovery,
}))
vi.mock('../actions/reset-password.action', () => ({ resetPassword: vi.fn() }))

function OpenLogIn() {
  const { openGate } = useAuthGate()
  return (
    <button type="button" onClick={() => openGate('login')}>
      Open
    </button>
  )
}

async function logInThroughTheModal() {
  renderWithIntl(
    <AuthGateProvider signedIn={false} forms={<AuthGateForms />}>
      <OpenLogIn />
    </AuthGateProvider>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Open' }))
  await userEvent.type(await screen.findByLabelText('Email', {}, { timeout: 5000 }), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('the forms in the modal (specs/auth AU-01, AU-02, AU-11)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('closes the modal once logged in: the page is already rendered with the session', async () => {
    actions.logIn.mockResolvedValue({ ok: true, data: { needsProfile: false } })
    await logInThroughTheModal()
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(router.push).not.toHaveBeenCalled()
  })

  it('goes on to the second step in the same modal, from the suggested username (AU-11)', async () => {
    actions.logIn.mockResolvedValue({
      ok: true,
      data: { needsProfile: true, suggestion: 'ana_perez' },
    })
    await logInThroughTheModal()
    expect(
      await screen.findByRole('dialog', { name: 'Choose your username' }, { timeout: 5000 }),
    ).toBeInTheDocument()
    expect(await screen.findByLabelText('Username', {}, { timeout: 5000 })).toHaveValue('ana_perez')
    expect(router.push).not.toHaveBeenCalled()
  })

  it('renders the page again with the new profile, then closes (design.md § 14)', async () => {
    actions.logIn.mockResolvedValue({ ok: true, data: { needsProfile: true, suggestion: 'ana' } })
    profile.createProfile.mockResolvedValue({ ok: true, data: { username: 'ana' } })
    await logInThroughTheModal()
    await screen.findByLabelText('Username', {}, { timeout: 5000 })
    await userEvent.click(screen.getByRole('checkbox', { name: /I’m 18 or older/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(router.refresh).toHaveBeenCalledOnce()
  })

  it('asks for the recovery email in the same modal, with the email written (password-recovery PR-01, PR-02)', async () => {
    recovery.requestRecovery.mockResolvedValue({ ok: true, data: null })
    renderWithIntl(
      <AuthGateProvider signedIn={false} forms={<AuthGateForms />}>
        <OpenLogIn />
      </AuthGateProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.type(
      await screen.findByLabelText('Email', {}, { timeout: 5000 }),
      'ana@example.com',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }))

    const dialog = await screen.findByRole('dialog', { name: 'Reset your password' })
    expect(dialog).toHaveAttribute('data-view', 'recover')
    const recoverEmail = await screen.findByLabelText('Email', {}, { timeout: 5000 })
    expect(recoverEmail).toHaveValue('ana@example.com')
    // The button that switched it left with the log in form: the email takes the focus (PR-16).
    await vi.waitFor(() => expect(recoverEmail).toHaveFocus())
    // About the account it has: no other provider, and no switch to sign up.
    expect(screen.queryByRole('link', { name: /Google/ })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Create an account' })).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: 'Send link' }))
    expect(recovery.requestRecovery).toHaveBeenCalledWith({ email: 'ana@example.com', next: '/' })

    await userEvent.click(screen.getByRole('button', { name: 'Back to log in' }))
    expect(await screen.findByRole('dialog', { name: 'Log in to Asinko' })).toBeInTheDocument()
    const loginEmail = await screen.findByLabelText('Email', {}, { timeout: 5000 })
    await vi.waitFor(() => expect(loginEmail).toHaveFocus())
  })

  it('is nothing outside the modal', () => {
    const { container } = renderWithIntl(<AuthGateForms />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('the login page form (AU-03)', () => {
  it('goes to choose a username when the account has none', async () => {
    actions.logIn.mockResolvedValue({ ok: true, data: { needsProfile: true } })
    renderWithIntl(<LoginPageForm mode="login" next="/es/hub/macro" />)
    await userEvent.type(await screen.findByLabelText('Email', {}, { timeout: 5000 }), 'a@b.co')
    await userEvent.type(screen.getByLabelText('Password'), 'secret')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    await vi.waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/welcome',
        query: { next: '/es/hub/macro' },
      }),
    )
  })

  it('switches to the recovery mode with the email written, never in the URL (PR-02)', async () => {
    renderWithIntl(<LoginPageForm mode="login" next="/es" />)
    await userEvent.type(
      await screen.findByLabelText('Email', {}, { timeout: 5000 }),
      'ana@example.com',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }))
    expect(router.replace).toHaveBeenCalledWith({
      pathname: '/login',
      query: { mode: 'recover', next: '/es' },
    })
  })

  it('shows the recovery form in its mode, with the email remembered', async () => {
    const { rememberEmail } = await import('../lib/recover-email')
    rememberEmail('ana@example.com')
    renderWithIntl(<LoginPageForm mode="recover" next="/en" />)
    expect(await screen.findByLabelText('Email', {}, { timeout: 5000 })).toHaveValue(
      'ana@example.com',
    )
    expect(screen.getByRole('button', { name: 'Send link' })).toBeInTheDocument()
  })

  it('shows the sign up form in its mode', async () => {
    renderWithIntl(<LoginPageForm mode="signup" next="/en" />)
    expect(
      await screen.findByRole('button', { name: 'Create account' }, { timeout: 5000 }),
    ).toBeInTheDocument()
  })
})

describe('LogOutButton (AU-11)', () => {
  it('logs out and goes to the Home', async () => {
    actions.logOut.mockResolvedValue({ ok: true, data: null })
    renderWithIntl(<LogOutButton />)
    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))
    await vi.waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'))
    expect(actions.logOut).toHaveBeenCalledOnce()
  })
})

describe('FormSkeleton', () => {
  it('keeps the place of each field and the button, hidden from screen readers', () => {
    const { container } = renderWithIntl(<FormSkeleton fields={3} />)
    const skeleton = container.firstElementChild!
    expect(skeleton).toHaveAttribute('aria-hidden', 'true')
    expect(skeleton.children).toHaveLength(4)
  })
})
