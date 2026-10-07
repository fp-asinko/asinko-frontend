import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'next-themes'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { router, setPathname } from '@/test/navigation-mock'
import { MoreMenu } from './more-menu'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

function renderMenu(signedIn = true) {
  return renderWithIntl(
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <AuthGateProvider signedIn={signedIn}>
        <MoreMenu />
      </AuthGateProvider>
    </ThemeProvider>,
  )
}

describe('MoreMenu (HR-03)', () => {
  it('opens a menu with the language and the dark mode', async () => {
    renderMenu()
    const trigger = screen.getByRole('button', { name: 'More options' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)

    // The first open downloads the lazy menu: give it time.
    expect(await screen.findByRole('menu', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(screen.getByRole('menuitemcheckbox', { name: 'Dark mode' })).toHaveAttribute(
      'aria-checked',
      'false',
    )
    // Sign up only without a session.
    expect(screen.queryByRole('menuitem', { name: 'Sign up' })).toBeNull()
  })

  it('switches the language on the same page, keeping the filters (H-27)', async () => {
    setPathname('/')
    window.history.replaceState(null, '', '/?community=BTC')
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'More options' }))
    await userEvent.click(await screen.findByRole('menuitemradio', { name: 'Español' }))
    expect(router.replace).toHaveBeenCalledWith('/?community=BTC', { locale: 'es' })
    window.history.replaceState(null, '', '/')
  })

  it('turns the dark mode on', async () => {
    renderMenu()
    await userEvent.click(screen.getByRole('button', { name: 'More options' }))
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Dark mode' }))
    await vi.waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    document.documentElement.classList.remove('dark')
  })

  it('leaves Sign up out of the menu from md, where the bar shows it (HR-04)', async () => {
    const real = window.matchMedia
    window.matchMedia = (query: string) => ({ ...real(query), matches: true })
    try {
      renderMenu(false)
      await userEvent.click(screen.getByRole('button', { name: 'More options' }))
      await screen.findByRole('menu')
      expect(screen.queryByRole('menuitem', { name: 'Sign up' })).toBeNull()
    } finally {
      window.matchMedia = real
    }
  })

  it('offers Sign up without a session (HR-04)', async () => {
    renderMenu(false)
    await userEvent.click(screen.getByRole('button', { name: 'More options' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sign up' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko' })).toBeInTheDocument()
  })

  it('closes with Escape and gives the focus back to the trigger', async () => {
    renderMenu()
    const trigger = screen.getByRole('button', { name: 'More options' })
    await userEvent.click(trigger)
    await screen.findByRole('menu')
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(screen.queryByRole('menu')).toBeNull())
    expect(trigger).toHaveFocus()
  })
})
