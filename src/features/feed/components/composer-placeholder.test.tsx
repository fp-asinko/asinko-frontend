import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposerPlaceholder } from './composer-placeholder'

describe('ComposerPlaceholder (H-09)', () => {
  it('shows the input and the Post / Thesis / Live actions as coming soon', () => {
    renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    for (const name of ['What are you thinking?', 'Post', 'Thesis', 'Live']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('colors the viewer avatar and keeps the guest placeholder neutral (FC-01)', () => {
    const { unmount } = renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-color')
    unmount()
    renderWithIntl(<ComposerPlaceholder viewerName={null} />)
    expect(screen.getByTestId('user-avatar')).not.toHaveAttribute('data-color')
  })

  it.each(['What are you thinking?', 'Post', 'Thesis', 'Live'])(
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
