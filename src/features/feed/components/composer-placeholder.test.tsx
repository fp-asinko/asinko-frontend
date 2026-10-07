import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { ComposeContext } from '@/components/organisms/compose'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposerPlaceholder } from './composer-placeholder'

function renderWithCompose(ui: React.ReactNode) {
  const openCompose = vi.fn()
  renderWithIntl(<ComposeContext value={{ openCompose, setScope: vi.fn() }}>{ui}</ComposeContext>)
  return openCompose
}

describe('ComposerPlaceholder (H-09)', () => {
  it('opens the post editor from the box and from Post, on Text (specs/post-create-detail PC-03)', async () => {
    const openCompose = renderWithCompose(<ComposerPlaceholder viewerName="demo" />)
    await userEvent.click(screen.getByRole('button', { name: 'What are you thinking?' }))
    expect(openCompose).toHaveBeenLastCalledWith({ type: undefined })
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(openCompose).toHaveBeenLastCalledWith({ type: 'TEXT' })
  })

  it('keeps Thesis and Live as coming soon', () => {
    renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    for (const name of ['Thesis', 'Live']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
    for (const name of ['What are you thinking?', 'Post']) {
      expect(screen.getByRole('button', { name })).not.toHaveAttribute('aria-disabled')
    }
  })

  it("says where the post goes on a community's page", () => {
    renderWithIntl(<ComposerPlaceholder viewerName="demo" communityHandle="#defi" />)
    expect(screen.getByRole('button', { name: 'Post in #defi' })).toBeInTheDocument()
  })

  it('colors the viewer avatar and keeps the guest placeholder neutral (FC-01)', () => {
    const { unmount } = renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-color')
    unmount()
    renderWithIntl(<ComposerPlaceholder viewerName={null} />)
    expect(screen.getByTestId('user-avatar')).not.toHaveAttribute('data-color')
  })

  it.each(['Thesis', 'Live'])(
    'opens the account modal from %s without a session (G-04)',
    async (name) => {
      renderWithIntl(
        <AuthGateProvider signedIn={false}>
          <ComposerPlaceholder viewerName={null} />
        </AuthGateProvider>,
      )
      const control = screen.getByRole('button', { name })
      expect(control).not.toHaveAttribute('aria-disabled')
      await userEvent.click(control)
      expect(await screen.findByRole('dialog', { name: 'Join Asinko to post' })).toBeInTheDocument()
    },
  )
})
