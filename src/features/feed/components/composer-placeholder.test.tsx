import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposerPlaceholder } from './composer-placeholder'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('ComposerPlaceholder (H-09; specs/submit-page SU-02, Q1)', () => {
  it('goes to the page to create a post: the prompt and Publish on Text, the icons on theirs', () => {
    renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    expect(screen.getByRole('link', { name: 'What are you thinking?' })).toHaveAttribute(
      'href',
      '/submit',
    )
    // Publish is the prompt's twin: out of the reading order, the same place.
    const publish = screen.getByText('Publish').closest('a')
    expect(publish).toHaveAttribute('href', '/submit')
    expect(publish).toHaveAttribute('aria-hidden', 'true')
    expect(publish).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('link', { name: 'Link' })).toHaveAttribute('href', '/submit?type=link')
    expect(screen.getByRole('link', { name: 'Image' })).toHaveAttribute(
      'href',
      '/submit?type=image',
    )
  })

  it('says where the post goes on a community, and the page arrives with it chosen', () => {
    renderWithIntl(
      <ComposerPlaceholder viewerName="demo" communityHandle="#defi" communitySlug="defi" />,
    )
    expect(screen.getByRole('link', { name: 'Post in #defi' })).toHaveAttribute(
      'href',
      '/submit?community=defi',
    )
  })

  it('keeps Thesis, Live, Duel, Portfolio and Thought as coming soon, in that order (CR-05)', () => {
    renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    const soon = ['Thesis', 'Live', 'Duel', 'Portfolio', 'Thought']
    for (const name of soon) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
    const order = screen
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label') ?? button.textContent)
      .filter((name) => soon.includes(name ?? ''))
    expect(order).toEqual(soon)
  })

  it('opens the account modal from Thesis without a session (G-04)', async () => {
    renderWithIntl(
      <AuthGateProvider signedIn={false}>
        <ComposerPlaceholder viewerName={null} />
      </AuthGateProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Thesis' }))
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to post' })).toBeInTheDocument()
  })
})
