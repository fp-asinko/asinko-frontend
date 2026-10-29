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
  setAvatar: vi.fn(),
  cropImage: vi.fn(),
}))
vi.mock('../actions/log-in.action', () => ({ logIn: actions.logIn }))
vi.mock('../actions/sign-up.action', () => ({ signUp: actions.signUp }))
vi.mock('../actions/create-profile.action', () => ({ createProfile: actions.createProfile }))
vi.mock('../actions/set-avatar.action', () => ({ setAvatar: actions.setAvatar }))
// jsdom draws no images: the picker's preparation is the library's, tested there.
vi.mock('@/lib/prepare-image', async (original) => ({
  ...(await original<typeof import('@/lib/prepare-image')>()),
  cropImage: actions.cropImage,
}))

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

  describe('SignUpForm (AU-05, design.md § 11)', () => {
    it('creates the account with only email and password', async () => {
      actions.signUp.mockResolvedValue({ ok: true, data: { needsProfile: true } })
      const onDone = vi.fn()
      renderWithIntl(<SignUpForm onDone={onDone} />)
      expect(screen.queryByLabelText('Username')).toBeNull()
      await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'long-enough')
      await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
      expect(actions.signUp).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'long-enough',
      })
      expect(onDone).toHaveBeenCalledWith({ needsProfile: true })
    })

    it('asks for 8 characters before sending (AU-06)', async () => {
      renderWithIntl(<SignUpForm onDone={vi.fn()} />)
      await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'short')
      await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
      expect(screen.getByLabelText('Password')).toHaveAccessibleDescription(
        'Use at least 8 characters',
      )
      expect(actions.signUp).not.toHaveBeenCalled()
    })

    it('puts a taken email next to its field, with the focus there (AU-08)', async () => {
      actions.signUp.mockResolvedValue({
        ok: false,
        error: 'auth.errors.emailTaken',
        fieldErrors: { email: ['auth.errors.emailTaken'] },
      })
      renderWithIntl(<SignUpForm onDone={vi.fn()} />)
      await userEvent.type(screen.getByLabelText('Email'), 'ana@example.com')
      await userEvent.type(screen.getByLabelText('Password'), 'long-enough')
      await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
      const email = await screen.findByLabelText('Email')
      expect(email).toHaveAccessibleDescription('There’s already an account with this email')
      expect(email).toHaveFocus()
    })
  })

  describe('ProfileForm, the welcome screen (AU-11, AU-21)', () => {
    const accept = () => userEvent.click(screen.getByRole('checkbox', { name: /I’m 18 or older/ }))

    beforeEach(() => {
      actions.createProfile.mockResolvedValue({ ok: true, data: { username: 'ana_perez' } })
      actions.setAvatar.mockResolvedValue({ ok: true, data: null })
      vi.stubGlobal('createImageBitmap', async () => ({ width: 800, height: 600, close() {} }))
      vi.stubGlobal(
        'URL',
        Object.assign(URL, { createObjectURL: () => 'blob:photo', revokeObjectURL() {} }),
      )
    })

    it('starts from the suggested username, and waits for age and terms', async () => {
      const onDone = vi.fn()
      renderWithIntl(<ProfileForm suggestion="ana_perez" onDone={onDone} />)
      expect(screen.getByLabelText('Username')).toHaveValue('ana_perez')
      const go = screen.getByRole('button', { name: 'Continue' })
      expect(go).toBeDisabled()
      await accept()
      await userEvent.click(go)
      expect(actions.createProfile).toHaveBeenCalledWith({ username: 'ana_perez', accepted: true })
      expect(actions.setAvatar).not.toHaveBeenCalled()
      expect(onDone).toHaveBeenCalled()
    })

    it('uploads the chosen photo, cut to its centered square, after creating the profile', async () => {
      const square = new Blob(['x'], { type: 'image/webp' })
      actions.cropImage.mockResolvedValue({ ok: true, blob: square, width: 400, height: 400 })
      const onDone = vi.fn()
      const { container } = renderWithIntl(<ProfileForm suggestion="ana_perez" onDone={onDone} />)
      const file = new File(['img'], 'me.jpg', { type: 'image/jpeg' })
      await userEvent.upload(container.querySelector('input[type=file]')!, file)

      expect(actions.cropImage).toHaveBeenCalledWith(
        file,
        { x: 100, y: 0, width: 600, height: 600 },
        { width: 400, height: 400 },
      )
      expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
      await accept()
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(actions.setAvatar).toHaveBeenCalledOnce()
      expect((actions.setAvatar.mock.calls[0]![0] as FormData).get('file')).toBeInstanceOf(Blob)
      expect(onDone).toHaveBeenCalled()
    })

    it('says when only the photo failed, and stays to try again', async () => {
      actions.cropImage.mockResolvedValue({
        ok: true,
        blob: new Blob(['x']),
        width: 400,
        height: 400,
      })
      actions.setAvatar.mockResolvedValue({ ok: false, error: 'auth.errors.photoUpload' })
      const onDone = vi.fn()
      const { container } = renderWithIntl(<ProfileForm suggestion="ana_perez" onDone={onDone} />)
      await userEvent.upload(
        container.querySelector('input[type=file]')!,
        new File(['img'], 'me.png', { type: 'image/png' }),
      )
      await screen.findByRole('button', { name: 'Remove' })
      await accept()
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(await screen.findByText(/the photo didn’t upload/)).toBeInTheDocument()
      expect(onDone).not.toHaveBeenCalled()
    })

    it('says a picture it cannot use', async () => {
      actions.cropImage.mockResolvedValue({ ok: false, error: 'tooLarge' })
      const { container } = renderWithIntl(<ProfileForm onDone={vi.fn()} />)
      await userEvent.upload(
        container.querySelector('input[type=file]')!,
        new File(['img'], 'me.png', { type: 'image/png' }),
      )
      expect(await screen.findByText('That image is too large')).toHaveAttribute('role', 'alert')
    })
  })
})
