import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { EditableProfile } from '../communities.types'
import { EditProfileButton, EditProfilePrompt, EditProfileProvider } from './edit-profile-button'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/update-profile.action', () => ({ updateProfile: vi.fn() }))

const PROFILE: EditableProfile = {
  username: 'demo',
  displayName: null,
  headline: null,
  countryCode: null,
  city: null,
  bio: 'On-chain analyst.',
  avatarUrl: null,
  bannerUrl: null,
  openTo: [],
  links: [],
}

function renderOwn() {
  renderWithIntl(
    <EditProfileProvider profile={PROFILE}>
      <EditProfileButton />
      <EditProfilePrompt field="headline">Add a headline</EditProfilePrompt>
    </EditProfileProvider>,
  )
}

describe('EditProfileButton (specs/profile-edit PE-01)', () => {
  it('opens the window with what the profile has', async () => {
    renderOwn()
    const button = screen.getByRole('button', { name: 'Edit profile' })
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(button)
    expect(
      await screen.findByRole('dialog', { name: 'Edit profile' }, { timeout: 3000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'About' })).toHaveValue('On-chain analyst.')
  })
})

describe('EditProfilePrompt (specs/profile-presentation PP-04)', () => {
  it('opens the window on its field', async () => {
    renderOwn()
    await userEvent.click(screen.getByRole('button', { name: 'Add a headline' }))
    const headline = await screen.findByRole('textbox', { name: 'Headline' }, { timeout: 3000 })
    await vi.waitFor(() => expect(headline).toHaveFocus())
  })

  it('needs the provider: only your own profile has it', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() =>
      renderWithIntl(<EditProfilePrompt field="links">Add links</EditProfilePrompt>),
    ).toThrow()
  })
})
