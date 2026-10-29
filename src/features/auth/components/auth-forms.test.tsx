import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { LogInForm } from './log-in-form'
import { ProfileForm } from './profile-form'
import { SignUpForm } from './sign-up-form'

const actions = vi.hoisted(() => ({
  logIn: vi.fn(),
  signUp: vi.fn(),
  createProfile: vi.fn(),
}))
vi.mock('../actions/log-in.action', () => ({ logIn: actions.logIn }))
vi.mock('../actions/sign-up.action', () => ({ signUp: actions.signUp }))
vi.mock('../actions/create-profile.action', () => ({ createProfile: actions.createProfile }))

describe('auth forms (specs/auth AU-02 to AU-11, AU-18)', () => {
  beforeEach(() => vi.clearAllMocks())

  describe('LogInForm', () => {
    it('logs in with the typed email and password, and says it is done', async () => {
      actions.logIn.mockResolvedValue({ ok: true, data: { needsProfile: false } })
      const onDone = vi.fn()
      renderWithIntl(<LogInForm onDone={onDone} />)
      await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'secret')
      await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
      expect(actions.logIn).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'secret' })
      expect(onDone).toHaveBeenCalledWith({ needsProfile: false })
    })

    it('checks the fields before sending, each error tied to its field (AU-06, AU-18)', async () => {
      renderWithIntl(<LogInForm onDone={vi.fn()} />)
      await userEvent.type(screen.getByLabelText('Email'), 'ana@')
      await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
      expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email')
      expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
      expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Enter your password')
      expect(actions.logIn).not.toHaveBeenCalled()
    })

    it('says wrong credentials in the alert, never which one (AU-04)', async () => {
      actions.logIn.mockResolvedValue({ ok: false, error: 'auth.errors.credentials' })
      const onDone = vi.fn()
      renderWithIntl(<LogInForm onDone={onDone} />)
      await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'nope')
      await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
      expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password')
      expect(onDone).not.toHaveBeenCalled()
    })

    it('shows and hides the password', async () => {
      renderWithIntl(<LogInForm onDone={vi.fn()} />)
      const password = screen.getByLabelText('Password')
      expect(password).toHaveAttribute('type', 'password')
      await userEvent.click(screen.getByRole('button', { name: 'Show password' }))
      expect(password).toHaveAttribute('type', 'text')
      expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
    })

    it('speaks Spanish', () => {
      renderWithIntl(<LogInForm onDone={vi.fn()} />, { locale: 'es' })
      expect(screen.getByLabelText('Correo')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })
  })

  describe('SignUpForm', () => {
    async function fill() {
      await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'long-enough')
      await userEvent.type(screen.getByLabelText('Username'), 'ana_92')
    }

    it('keeps Create account blocked until age and terms are accepted (AU-05)', async () => {
      actions.signUp.mockResolvedValue({ ok: true, data: { needsProfile: false } })
      const onDone = vi.fn()
      renderWithIntl(<SignUpForm onDone={onDone} />)
      await fill()
      const create = screen.getByRole('button', { name: 'Create account' })
      expect(create).toBeDisabled()
      await userEvent.click(screen.getByRole('checkbox', { name: /I’m 18 or older/ }))
      expect(create).toBeEnabled()
      await userEvent.click(create)
      expect(actions.signUp).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'long-enough',
        username: 'ana_92',
        accepted: true,
      })
      expect(onDone).toHaveBeenCalledWith({ needsProfile: false })
    })

    it('asks for 8 characters and a valid username before sending (AU-06)', async () => {
      renderWithIntl(<SignUpForm onDone={vi.fn()} />)
      await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'short')
      await userEvent.type(screen.getByLabelText('Username'), 'a b')
      await userEvent.click(screen.getByRole('checkbox', { name: /I’m 18 or older/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
      expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
        'Use at least 8 characters',
      )
      expect(screen.getByLabelText('Username')).toHaveAccessibleDescription(
        'Use 3 to 30 letters, numbers or _',
      )
      expect(actions.signUp).not.toHaveBeenCalled()
    })

    it('puts a taken username next to its field, with the focus there (AU-08)', async () => {
      actions.signUp.mockResolvedValue({
        ok: false,
        error: 'auth.errors.usernameTaken',
        fieldErrors: { username: ['auth.errors.usernameTaken'] },
      })
      renderWithIntl(<SignUpForm onDone={vi.fn()} />)
      await fill()
      await userEvent.click(screen.getByRole('checkbox', { name: /I’m 18 or older/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
      const username = await screen.findByLabelText('Username')
      expect(username).toHaveAccessibleDescription('That username is taken')
      expect(username).toHaveFocus()
    })
  })

  describe('ProfileForm (AU-11)', () => {
    it('chooses the username with age and terms', async () => {
      actions.createProfile.mockResolvedValue({ ok: true, data: { username: 'ana_92' } })
      const onDone = vi.fn()
      renderWithIntl(<ProfileForm onDone={onDone} />)
      await userEvent.type(screen.getByLabelText('Username'), 'ana_92')
      await userEvent.click(screen.getByRole('checkbox', { name: /I’m 18 or older/ }))
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(actions.createProfile).toHaveBeenCalledWith({ username: 'ana_92', accepted: true })
      expect(onDone).toHaveBeenCalled()
    })
  })
})
