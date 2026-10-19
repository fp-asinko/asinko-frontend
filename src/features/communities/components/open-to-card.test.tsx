import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { EditableProfile } from '../communities.types'
import { EditProfileProvider } from './edit-profile-button'
import { OpenToCard } from './open-to-card'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/update-profile.action', () => ({ updateProfile: vi.fn() }))

const PROFILE: EditableProfile = {
  username: 'demo',
  displayName: null,
  headline: null,
  countryCode: null,
  city: null,
  bio: null,
  avatarUrl: null,
  bannerUrl: null,
  links: [],
  openTo: ['QUESTIONS', 'MENTORING'],
}

describe('OpenToCard (specs/profile-showcase PS-10)', () => {
  it('shows each option, translated, without a pencil on someone else', () => {
    renderWithIntl(<OpenToCard values={['QUESTIONS', 'COMMISSIONED_ANALYSIS']} isSelf={false} />)
    const card = screen.getByRole('region', { name: 'Open to' })
    expect(
      within(card)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Questions', 'Commissioned analysis'])
    expect(within(card).queryByRole('button')).toBeNull()
  })

  it('is not there without options', () => {
    renderWithIntl(<OpenToCard values={[]} isSelf />)
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('opens "Edit profile" on its section from your own', async () => {
    renderWithIntl(
      <EditProfileProvider profile={PROFILE}>
        <OpenToCard values={PROFILE.openTo} isSelf />
      </EditProfileProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Edit what you are open to' }))
    const dialog = await screen.findByRole('dialog', { name: 'Edit profile' }, { timeout: 3000 })
    await vi.waitFor(() =>
      expect(within(dialog).getByRole('checkbox', { name: 'Questions' })).toHaveFocus(),
    )
  })
})
