import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
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
  prepareImage: vi.fn(),
  getSuggestedPhoto: vi.fn(async (): Promise<{ type: string; base64: string } | null> => null),
}))
vi.mock('../actions/log-in.action', () => ({ logIn: actions.logIn }))
vi.mock('../actions/sign-up.action', () => ({ signUp: actions.signUp }))
vi.mock('../actions/create-profile.action', () => ({ createProfile: actions.createProfile }))
vi.mock('../actions/set-avatar.action', () => ({ setAvatar: actions.setAvatar }))
vi.mock('../actions/suggested-photo.action', () => ({
  getSuggestedPhoto: actions.getSuggestedPhoto,
}))
// jsdom draws no images: the picker's preparation is the library's, tested there.
vi.mock('@/lib/prepare-image', async (original) => ({
  ...(await original<typeof import('@/lib/prepare-image')>()),
  cropImage: actions.cropImage,
  prepareImage: actions.prepareImage,
}))
// jsdom has no image decoding: a cropper that reports the area it shows.
vi.mock('react-easy-crop', () => ({
  default: function Cropper(props: {
    cropShape: string
    cropperProps: Record<string, string>
    onCropComplete: (area: unknown, pixels: unknown) => void
  }) {
    useEffect(() => {
      props.onCropComplete({}, { x: 10, y: 20, width: 300, height: 300 })
    })
    return <div {...props.cropperProps} data-shape={props.cropShape} />
  },
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

    it('back from Google, brings the Google photo already chosen, and uploads it (AU-22)', async () => {
      actions.getSuggestedPhoto.mockResolvedValueOnce({ type: 'image/jpeg', base64: btoa('jpg') })
      const ready = new Blob(['x'], { type: 'image/webp' })
      actions.prepareImage.mockResolvedValueOnce({ ok: true, blob: ready, width: 400, height: 400 })
      const onDone = vi.fn()
      renderWithIntl(<ProfileForm suggestion="ana_perez" onDone={onDone} />)

      // Prepared as a photo from the device would be, and shown with Change and Remove.
      expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
      const file = actions.prepareImage.mock.calls[0]![0] as File
      expect(file.type).toBe('image/jpeg')
      expect(await file.text()).toBe('jpg')
      await accept()
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      // FormData turns the Blob into a File: the same bytes, the prepared ones.
      const sent = (actions.setAvatar.mock.calls[0]![0] as FormData).get('file') as Blob
      expect(sent.type).toBe('image/webp')
      expect(await sent.text()).toBe('x')
      expect(onDone).toHaveBeenCalled()
    })

    it('removing the Google photo continues without one', async () => {
      actions.getSuggestedPhoto.mockResolvedValueOnce({ type: 'image/jpeg', base64: btoa('jpg') })
      actions.prepareImage.mockResolvedValueOnce({
        ok: true,
        blob: new Blob(['x'], { type: 'image/webp' }),
        width: 400,
        height: 400,
      })
      renderWithIntl(<ProfileForm suggestion="ana_perez" onDone={vi.fn()} />)
      await userEvent.click(await screen.findByRole('button', { name: 'Remove' }))
      await accept()
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(actions.createProfile).toHaveBeenCalled()
      expect(actions.setAvatar).not.toHaveBeenCalled()
    })

    const PHOTO_TYPE = 'Use a JPEG, PNG or WebP image'

    async function pickPhoto(container: HTMLElement) {
      const file = new File(['img'], 'me.jpg', { type: 'image/jpeg' })
      await userEvent.upload(container.querySelector('input[type=file]')!, file)
      return file
    }

    it('frames the chosen photo by hand, then uploads it after creating the profile', async () => {
      const square = new Blob(['x'], { type: 'image/webp' })
      actions.cropImage.mockResolvedValue({ ok: true, blob: square, width: 400, height: 400 })
      const onDone = vi.fn()
      const { container } = renderWithIntl(<ProfileForm suggestion="ana_perez" onDone={onDone} />)
      const file = await pickPhoto(container)

      // Only the cropper while framing, round, with the focus on its title.
      const title = await screen.findByRole('heading', { name: 'Frame your photo' })
      await vi.waitFor(() => expect(title).toHaveFocus())
      expect(screen.getByRole('group', { name: /Photo to frame/ })).toHaveAttribute(
        'data-shape',
        'round',
      )
      // The rest of the step hides with CSS, which jsdom does not apply: the e2e checks it.

      await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
      expect(actions.cropImage).toHaveBeenCalledWith(
        file,
        { x: 10, y: 20, width: 300, height: 300 },
        { width: 400, height: 400 },
      )
      expect(await screen.findByRole('button', { name: 'Remove' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Frame your photo' })).toBeNull()
      await accept()
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(actions.setAvatar).toHaveBeenCalledOnce()
      expect((actions.setAvatar.mock.calls[0]![0] as FormData).get('file')).toBeInstanceOf(Blob)
      expect(onDone).toHaveBeenCalled()
    })

    it('goes back from framing without a photo', async () => {
      const { container } = renderWithIntl(<ProfileForm suggestion="ana_perez" onDone={vi.fn()} />)
      await pickPhoto(container)
      await userEvent.click(await screen.findByRole('button', { name: 'Back' }))
      expect(screen.getAllByRole('button', { name: 'Add a photo' })).toHaveLength(2)
      expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
      await accept()
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(actions.setAvatar).not.toHaveBeenCalled()
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
      await pickPhoto(container)
      await userEvent.click(await screen.findByRole('button', { name: 'Apply' }))
      await screen.findByRole('button', { name: 'Remove' })
      await accept()
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
      expect(await screen.findByText(/the photo didn’t upload/)).toBeInTheDocument()
      expect(onDone).not.toHaveBeenCalled()
    })

    it('says a picture it cannot use, and stays framing', async () => {
      actions.cropImage.mockResolvedValue({ ok: false, error: 'tooLarge' })
      const { container } = renderWithIntl(<ProfileForm onDone={vi.fn()} />)
      await pickPhoto(container)
      await userEvent.click(await screen.findByRole('button', { name: 'Apply' }))
      expect(await screen.findByText('That image is too large')).toHaveAttribute('role', 'alert')
      expect(screen.getByRole('heading', { name: 'Frame your photo' })).toBeInTheDocument()
    })

    it('turns down a file that is not a photo before framing it', async () => {
      const { container } = renderWithIntl(<ProfileForm onDone={vi.fn()} />)
      await userEvent.upload(
        container.querySelector('input[type=file]')!,
        new File(['gif'], 'me.gif', { type: 'image/gif' }),
        { applyAccept: false },
      )
      expect(await screen.findByText(PHOTO_TYPE)).toHaveAttribute('role', 'alert')
      expect(screen.queryByRole('heading', { name: 'Frame your photo' })).toBeNull()
    })
  })
})
