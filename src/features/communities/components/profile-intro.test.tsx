import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { toProfileLink, type ProfileLink } from '@/lib/profile-links'
import { EditProfileProvider } from './edit-profile-button'
import { ProfileIntro } from './profile-intro'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../actions/update-profile.action', () => ({ updateProfile: vi.fn() }))

const links = ['https://maria.substack.com', 'https://x.com/maria'].map(
  (url) => toProfileLink(url) as ProfileLink,
)

const NONE = { headline: null, city: null, countryCode: null, links: [], isSelf: false }

describe('ProfileIntro (specs/profile-presentation PP-01 to PP-04)', () => {
  it('shows the headline, the location and the links, each with its real host', () => {
    renderWithIntl(
      <ProfileIntro
        profile={{
          ...NONE,
          headline: 'On-chain | DeFi',
          city: 'La Plata',
          countryCode: 'AR',
          links,
        }}
      />,
    )
    expect(screen.getByText('On-chain | DeFi')).toBeInTheDocument()
    expect(screen.getByText('La Plata, Argentina')).toBeInTheDocument()
    const list = screen.getByRole('list', { name: 'Links' })
    const substack = screen.getByRole('link', { name: 'maria.substack.com (opens in a new tab)' })
    expect(list).toContainElement(substack)
    expect(substack).toHaveAttribute('href', 'https://maria.substack.com')
    expect(substack).toHaveAttribute('target', '_blank')
    expect(substack).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
    expect(screen.getByRole('link', { name: /^x\.com/ })).toBeInTheDocument()
  })

  it("names the country in the page's language, alone without a city", () => {
    renderWithIntl(<ProfileIntro profile={{ ...NONE, countryCode: 'BR' }} />, { locale: 'es' })
    expect(screen.getByText('Brasil')).toBeInTheDocument()
  })

  it('takes no room for what is not set on someone else’s profile', () => {
    const { container } = renderWithIntl(<ProfileIntro profile={NONE} />)
    expect(container.textContent).toBe('')
  })

  it('offers the headline and the links on your own profile', () => {
    renderWithIntl(
      <EditProfileProvider
        profile={{
          username: 'demo',
          displayName: null,
          headline: null,
          countryCode: null,
          city: null,
          bio: null,
          avatarUrl: null,
          bannerUrl: null,
          links: [],
        }}
      >
        <ProfileIntro profile={{ ...NONE, isSelf: true }} />
      </EditProfileProvider>,
    )
    expect(screen.getByRole('button', { name: 'Add a headline' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add links' })).toBeInTheDocument()
  })
})
