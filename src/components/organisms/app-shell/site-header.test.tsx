import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { ComposeContext } from '@/components/organisms/compose'
import { renderWithIntl } from '@/test/render-with-intl'
import { SiteHeader } from './site-header'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderHeader(signedIn = true) {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthGateProvider signedIn={signedIn}>
        <SiteHeader
          menu={<button type="button">menu</button>}
          profileHref={signedIn ? '/user/maria' : null}
        />
      </AuthGateProvider>
    </ThemeProvider>,
  )
}

describe('SiteHeader (H-05)', () => {
  it('is the banner landmark with the logo linking home', () => {
    renderHeader()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    const logo = screen.getByRole('img', { name: 'Asinko, go to home' })
    expect(logo.closest('a')).toHaveAttribute('href', '/')
  })

  it('shows search and notifications as unavailable, without tokens (H-26, HR-02)', () => {
    renderHeader()
    expect(screen.queryByRole('button', { name: 'Tokens' })).toBeNull()
    for (const name of ['Search', 'Notifications']) {
      for (const button of screen.getAllByRole('button', { name })) {
        expect(button).toHaveAttribute('aria-disabled', 'true')
      }
    }
    expect(screen.getByText('Search tickers, theses, creators…')).toBeInTheDocument()
  })

  it('takes you to your own profile (HR-02, since specs/profile-track-record)', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/user/maria')
  })

  it('groups language and dark mode in "⋯", and keeps the menu slot (HR-03)', () => {
    renderHeader()
    expect(screen.queryByRole('switch', { name: 'Dark mode' })).toBeNull()
    expect(screen.queryByRole('combobox', { name: 'Language' })).toBeNull()
    expect(screen.getByRole('button', { name: 'More options' })).toHaveAttribute(
      'aria-haspopup',
      'menu',
    )
    expect(screen.getByRole('button', { name: 'menu' })).toBeInTheDocument()
  })

  it('offers Log in and Sign up instead of the profile without a session (G-02)', async () => {
    renderHeader(false)
    expect(screen.queryByRole('button', { name: 'Profile' })).toBeNull()
    // No notifications without an account (Q2).
    expect(screen.queryByRole('button', { name: 'Notifications' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
    expect(await screen.findByRole('dialog', { name: 'Log in to Asinko' })).toBeInTheDocument()
  })
})

describe('SiteHeader: Create (specs/post-create-detail PC-01)', () => {
  it('opens the post editor from "+ Create", with or without a session', async () => {
    for (const signedIn of [true, false]) {
      const openCompose = vi.fn()
      const { unmount } = renderWithIntl(
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <AuthGateProvider signedIn={signedIn}>
            <ComposeContext
              value={{
                openCompose,
                setScope: vi.fn(),
                registerSlot: vi.fn(),
                expanded: false,
                prepare: vi.fn(),
              }}
            >
              <SiteHeader menu={<button type="button">menu</button>} />
            </ComposeContext>
          </AuthGateProvider>
        </ThemeProvider>,
      )
      const create = screen.getByRole('button', { name: 'Create' })
      expect(create).toHaveAttribute('aria-haspopup', 'dialog')
      await userEvent.click(create)
      // The root decides: the editor with a session, the account modal without.
      expect(openCompose).toHaveBeenCalledOnce()
      unmount()
    }
  })
})
