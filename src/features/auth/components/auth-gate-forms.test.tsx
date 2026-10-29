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
vi.mock('../actions/create-profile.action', () => ({ createProfile: vi.fn() }))

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

  it('takes an account without a username to choose one, back to this page after', async () => {
    window.history.pushState({}, '', '/en/hub/macro')
    actions.logIn.mockResolvedValue({ ok: true, data: { needsProfile: true } })
    await logInThroughTheModal()
    await vi.waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: '/welcome',
        query: { next: '/en/hub/macro' },
      }),
    )
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

  it('shows the sign up form in its mode', async () => {
    renderWithIntl(<LoginPageForm mode="signup" next="/en" />)
    expect(await screen.findByLabelText('Username', {}, { timeout: 5000 })).toBeInTheDocument()
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
