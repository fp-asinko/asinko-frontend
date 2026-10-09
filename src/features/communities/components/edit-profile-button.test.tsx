import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { EditProfileButton } from './edit-profile-button'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/update-profile.action', () => ({ updateProfile: vi.fn() }))

describe('EditProfileButton (specs/profile-edit PE-01)', () => {
  it('opens the window with the bio there is', async () => {
    renderWithIntl(<EditProfileButton bio="On-chain analyst." />)
    const button = screen.getByRole('button', { name: 'Edit profile' })
    expect(button).toHaveAttribute('aria-haspopup', 'dialog')
    await userEvent.click(button)
    expect(
      await screen.findByRole('dialog', { name: 'Edit profile' }, { timeout: 3000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Bio' })).toHaveValue('On-chain analyst.')
  })
})
