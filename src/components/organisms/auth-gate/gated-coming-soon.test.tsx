import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AuthGateProvider } from './auth-gate'
import { GatedComingSoon } from './gated-coming-soon'

function renderJoin(signedIn: boolean) {
  renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <GatedComingSoon action="join" label="Join #defi">
        Join
      </GatedComingSoon>
    </AuthGateProvider>,
  )
  return screen.getByRole('button', { name: 'Join #defi' })
}

describe('GatedComingSoon (G-04)', () => {
  it('stays coming soon with a session (H-26)', async () => {
    const join = renderJoin(true)
    expect(join).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(join)
    expect(screen.getByRole('status')).toHaveTextContent('Coming soon')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens the account modal without one', async () => {
    const join = renderJoin(false)
    expect(join).not.toHaveAttribute('aria-disabled')
    await userEvent.click(join)
    expect(
      await screen.findByRole('dialog', { name: 'Join Asinko to join communities' }),
    ).toBeInTheDocument()
  })
})
