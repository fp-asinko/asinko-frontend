import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { LogInForm } from './log-in-form'
import { RecoverForm, RESEND_SECONDS } from './recover-form'
import { ResetPasswordForm } from './reset-password-form'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const actions = vi.hoisted(() => ({
  logIn: vi.fn(),
  requestRecovery: vi.fn(),
  resetPassword: vi.fn(),
  notify: vi.fn(),
}))
vi.mock('../actions/log-in.action', () => ({ logIn: actions.logIn }))
vi.mock('../actions/request-recovery.action', () => ({ requestRecovery: actions.requestRecovery }))
vi.mock('../actions/reset-password.action', () => ({ resetPassword: actions.resetPassword }))
vi.mock('@/components/organisms/toaster/notify', () => ({ notify: actions.notify }))

describe('password recovery forms (specs/password-recovery)', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.useRealTimers())

  describe('the link in the log in form (PR-01, PR-02, Q3)', () => {
    it('is always there, and hands over the email already written', async () => {
      const onForgot = vi.fn()
      renderWithIntl(<LogInForm onDone={vi.fn()} onForgot={onForgot} />)
      await userEvent.type(screen.getByLabelText('Email'), ' ana@example.com ')
      await userEvent.click(screen.getByRole('button', { name: 'Forgot your password?' }))
      expect(onForgot).toHaveBeenCalledWith('ana@example.com')
      expect(actions.logIn).not.toHaveBeenCalled()
    })

    it('is not there without a way to recover', () => {
      renderWithIntl(<LogInForm onDone={vi.fn()} />)
      expect(screen.queryByRole('button', { name: 'Forgot your password?' })).toBeNull()
    })
  })

  describe('RecoverForm (PR-02 to PR-05)', () => {
    it('starts with the email from the log in form and sends it with where it was asked', async () => {
      actions.requestRecovery.mockResolvedValue({ ok: true, data: null })
      renderWithIntl(<RecoverForm defaultEmail="ana@example.com" next="/es/hub/macro" />)
      expect(screen.getByLabelText('Email')).toHaveValue('ana@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Send link' }))
      expect(actions.requestRecovery).toHaveBeenCalledWith({
        email: 'ana@example.com',
        next: '/es/hub/macro',
      })
    })

    it('says the same once sent, whatever the account, and takes the focus (PR-03, PR-16)', async () => {
      actions.requestRecovery.mockResolvedValue({ ok: true, data: null })
      renderWithIntl(<RecoverForm next="/en" />)
      await userEvent.type(screen.getByLabelText('Email'), 'nobody@example.com')
      await userEvent.click(screen.getByRole('button', { name: 'Send link' }))
      const status = await screen.findByRole('status')
      expect(status).toHaveTextContent(
        'If there’s an account with nobody@example.com, we sent it a link to choose a new password.',
      )
      expect(status).toHaveFocus()
      expect(screen.queryByLabelText('Email')).toBeNull()
    })

    it('checks the email before sending', async () => {
      renderWithIntl(<RecoverForm next="/en" />)
      await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
      await userEvent.click(screen.getByRole('button', { name: 'Send link' }))
      expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
      expect(actions.requestRecovery).not.toHaveBeenCalled()
    })

    it('says too many requests in the form (PR-04)', async () => {
      actions.requestRecovery.mockResolvedValue({ ok: false, error: 'auth.errors.rateLimited' })
      renderWithIntl(<RecoverForm defaultEmail="ana@example.com" next="/en" />)
      await userEvent.click(screen.getByRole('button', { name: 'Send link' }))
      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Too many tries. Wait a moment and try again',
      )
    })

    it('lets it be sent again only after a minute (PR-05)', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      actions.requestRecovery.mockResolvedValue({ ok: true, data: null })
      renderWithIntl(<RecoverForm defaultEmail="ana@example.com" next="/en" />)
      fireEvent.click(screen.getByRole('button', { name: 'Send link' }))
      const again = await screen.findByRole('button', {
        name: `Send it again in ${RESEND_SECONDS} s`,
      })
      expect(again).toHaveAttribute('aria-disabled', 'true')
      fireEvent.click(again)
      expect(actions.requestRecovery).toHaveBeenCalledTimes(1)

      for (let second = 0; second < RESEND_SECONDS; second++) {
        await act(async () => vi.advanceTimersByTime(1000))
      }
      const ready = screen.getByRole('button', { name: 'Send it again' })
      expect(ready).not.toHaveAttribute('aria-disabled')
      fireEvent.click(ready)
      await vi.waitFor(() => expect(actions.requestRecovery).toHaveBeenCalledTimes(2))
    })
  })

  describe('ResetPasswordForm (PR-06 to PR-10)', () => {
    async function save(password = 'brand-new-password') {
      await userEvent.type(screen.getByLabelText('New password'), password)
      await userEvent.click(screen.getByRole('button', { name: 'Save password' }))
    }

    it('saves the new password and goes back to where it was asked, with a toast (PR-07)', async () => {
      actions.resetPassword.mockResolvedValue({ ok: true, data: { needsProfile: false } })
      renderWithIntl(<ResetPasswordForm next="/es/hub/macro?sort=new" hasLink />)
      expect(screen.getByLabelText('New password')).toHaveAttribute('autocomplete', 'new-password')
      await save()
      expect(actions.resetPassword).toHaveBeenCalledWith({ password: 'brand-new-password' })
      await vi.waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith('/hub/macro?sort=new', { locale: 'es' }),
      )
      expect(actions.notify).toHaveBeenCalledWith({
        message: 'Your password was changed',
        kind: 'success',
      })
    })

    it('takes an account without a username to the welcome step (PR-10)', async () => {
      actions.resetPassword.mockResolvedValue({ ok: true, data: { needsProfile: true } })
      renderWithIntl(<ResetPasswordForm next="/en" hasLink />)
      await save()
      await vi.waitFor(() =>
        expect(router.replace).toHaveBeenCalledWith({
          pathname: '/welcome',
          query: { next: '/en' },
        }),
      )
    })

    it('asks for 8 characters or more before sending (PR-06)', async () => {
      renderWithIntl(<ResetPasswordForm next="/en" hasLink />)
      await save('short')
      expect(await screen.findByText('Use at least 8 characters')).toBeInTheDocument()
      expect(actions.resetPassword).not.toHaveBeenCalled()
    })

    it('says the same password next to the field (PR-09)', async () => {
      actions.resetPassword.mockResolvedValue({
        ok: false,
        error: 'auth.errors.samePassword',
        fieldErrors: { password: ['auth.errors.samePassword'] },
      })
      renderWithIntl(<ResetPasswordForm next="/en" hasLink />)
      await save()
      expect(
        await screen.findByText('Choose a password different from your current one'),
      ).toBeInTheDocument()
    })

    it('offers a new link when Supabase says this one expired (PR-08)', async () => {
      actions.resetPassword.mockResolvedValue({ ok: false, error: 'auth.reset.expired' })
      renderWithIntl(<ResetPasswordForm next="/es" hasLink />)
      await save()
      const message = await screen.findByText(
        'This link expired or was already used. Ask for a new one.',
      )
      expect(message).toHaveFocus()
      expect(screen.getByRole('link', { name: 'Get a new link' })).toHaveAttribute(
        'href',
        '/login?mode=recover&next=%2Fes',
      )
      expect(screen.queryByLabelText('New password')).toBeNull()
    })

    it('says it at once when the page has no link, without taking the focus (PR-08)', () => {
      renderWithIntl(<ResetPasswordForm next="/en" hasLink={false} />)
      expect(
        screen.getByText('This link expired or was already used. Ask for a new one.'),
      ).not.toHaveFocus()
      expect(screen.getByRole('link', { name: 'Get a new link' })).toBeInTheDocument()
    })
  })
})
