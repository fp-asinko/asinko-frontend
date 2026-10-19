import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { EditableProfile } from '../communities.types'
import { writeChecklistHidden } from '../lib/checklist-cookie'
import { profileSteps } from '../lib/profile-steps'
import { EditProfileProvider } from './edit-profile-button'
import { ProfileChecklist } from './profile-checklist'

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
  openTo: [],
}
const STEP_PROFILE: Parameters<typeof profileSteps>[0] = { ...PROFILE, links: [] }

function renderChecklist(profile: Partial<typeof STEP_PROFILE> = {}, featured = 0) {
  return renderWithIntl(
    <EditProfileProvider profile={PROFILE}>
      <ProfileChecklist
        steps={profileSteps({ ...STEP_PROFILE, ...profile }, featured)}
        postsPath="/user/demo"
      />
    </EditProfileProvider>,
  )
}

afterEach(() => {
  document.cookie = 'asinko-profile-checklist=; max-age=0; path=/'
})

describe('ProfileChecklist (specs/profile-showcase PS-01 to PS-03, PS-13)', () => {
  it('says how far it is, only for you, and offers the next two steps', () => {
    renderChecklist({ avatarUrl: '/a.webp' })
    const section = screen.getByRole('region', { name: 'Complete your profile' })
    expect(within(section).getByText('Only you see this')).toBeInTheDocument()
    expect(within(section).getByRole('progressbar', { name: 'Profile completed' })).toHaveAttribute(
      'aria-valuetext',
      '1 of 8',
    )
    expect(
      within(section)
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual(['Add a headline', 'Tell your story'])
    expect(within(section).getByRole('button', { name: 'Add headline' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
    expect(
      within(section).getByRole('button', { name: 'Hide "Complete your profile"' }),
    ).toBeVisible()
  })

  it('leads to your posts to feature one, the last step', () => {
    renderChecklist({
      avatarUrl: '/a.webp',
      headline: 'Macro',
      bio: 'Rates.',
      city: 'La Plata',
      links: [{ url: 'https://x.com/a', host: 'x.com', site: 'x' }],
      openTo: ['AMAS'],
      bannerUrl: '/b.webp',
    })
    expect(screen.getByRole('link', { name: 'Go to your posts' })).toHaveAttribute(
      'href',
      '/user/demo',
    )
  })

  it('is not there with everything done', () => {
    renderChecklist(
      {
        avatarUrl: '/a.webp',
        headline: 'Macro',
        bio: 'Rates.',
        city: 'La Plata',
        links: [{ url: 'https://x.com/a', host: 'x.com', site: 'x' }],
        openTo: ['AMAS'],
        bannerUrl: '/b.webp',
      },
      1,
    )
    expect(screen.queryByRole('region')).toBeNull()
  })

  it('hides in this browser, leaving Undo in its place with the focus; Undo brings it back', async () => {
    renderChecklist()
    await userEvent.click(screen.getByRole('button', { name: 'Hide "Complete your profile"' }))
    expect(screen.queryByRole('region', { name: 'Complete your profile' })).toBeNull()
    expect(document.cookie).toContain('asinko-profile-checklist=hidden')
    const undo = screen.getByRole('button', {
      name: 'Undo',
      description: 'You hid "Complete your profile".',
    })
    expect(undo).toHaveFocus()

    await userEvent.click(undo)
    expect(screen.getByRole('region', { name: 'Complete your profile' })).toBeInTheDocument()
    expect(document.cookie).not.toContain('asinko-profile-checklist=hidden')
    expect(screen.getByRole('button', { name: 'Hide "Complete your profile"' })).toHaveFocus()
  })

  it('comes back when "Edit profile" shows it again, without a reload (PS-14)', async () => {
    renderChecklist()
    await userEvent.click(screen.getByRole('button', { name: 'Hide "Complete your profile"' }))
    act(() => writeChecklistHidden(false))
    expect(screen.getByRole('region', { name: 'Complete your profile' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull()
  })
})
