import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { ComposeContext } from '@/components/organisms/compose'
import { renderWithIntl } from '@/test/render-with-intl'
import { BottomNav } from './bottom-nav'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const ITEMS = [{ href: '/', label: 'Home', icon: <svg /> }]

describe('BottomNav', () => {
  it('has the five items of the prototype in a labelled navigation', () => {
    renderWithIntl(<BottomNav items={ITEMS} />)
    const nav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(nav).getAllByRole('listitem')).toHaveLength(5)
  })

  it('links the registered destinations and marks the active one', () => {
    renderWithIntl(<BottomNav items={ITEMS} />)
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
  })

  it('shows the future destinations as unavailable (H-26)', () => {
    renderWithIntl(<BottomNav items={ITEMS} />)
    for (const name of ['Search', 'Notif']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('links Profile to your own page (specs/header-refresh HR-02)', () => {
    renderWithIntl(<BottomNav items={ITEMS} profileHref="/user/maria" />)
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/user/maria')
  })

  it('asks to log in from Profile without a session (HR-02)', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <BottomNav items={ITEMS} />
      </AuthGateProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Profile' }))
    expect(await screen.findByRole('dialog', { name: 'Log in to Asinko' })).toBeVisible()
  })

  it('opens the post editor from Create, between Search and Notif (specs/post-create-detail PC-02)', async () => {
    const openCompose = vi.fn()
    renderWithIntl(
      <ComposeContext
        value={{
          openCompose,
          setScope: vi.fn(),
          registerSlot: vi.fn(),
          expanded: false,
          prepare: vi.fn(),
        }}
      >
        <BottomNav items={ITEMS} />
      </ComposeContext>,
    )
    const create = screen.getByRole('button', { name: 'Create' })
    expect(create).not.toHaveAttribute('aria-disabled')
    await userEvent.click(create)
    expect(openCompose).toHaveBeenCalledOnce()
    const names = screen.getAllByRole('listitem').map((item) => item.textContent)
    expect(names.slice(1)).toEqual(['Search', 'Create', 'Notif', 'Profile'])
  })
})
