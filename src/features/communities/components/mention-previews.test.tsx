import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { OPEN_DELAY, MentionPreviews } from './mention-previews'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
// The lazy card: here only what the host hands it.
vi.mock('./preview-popover', () => ({
  PreviewPopover: ({
    target,
    open,
    onClose,
  }: {
    target: { kind: string; slug: string }
    open: boolean
    onClose: () => void
  }) =>
    open ? (
      <div data-preview-card data-testid="card">
        {target.kind}:{target.slug}
        <button type="button" onClick={onClose}>
          Close
        </button>
        <button type="button">Join</button>
      </div>
    ) : null,
}))

const wait = (ms: number) => act(() => new Promise((done) => setTimeout(done, ms)))

function Page() {
  return (
    <>
      <a href="#macro" data-preview="group:macro">
        <span>#macro</span>
      </a>
      <a href="#x" data-preview="user:../x">
        bad
      </a>
      <p>Elsewhere</p>
      <MentionPreviews />
    </>
  )
}

describe('MentionPreviews (specs/mention-preview § 1, § 4)', () => {
  beforeEach(() => {
    renderWithIntl(<Page />)
  })

  it('opens the card of a link the mouse rests on, after a pause (MP-07, Q4)', async () => {
    await userEvent.hover(screen.getByText('#macro'))
    expect(screen.queryByTestId('card')).not.toBeInTheDocument()
    expect(await screen.findByTestId('card', {}, { timeout: OPEN_DELAY + 500 })).toHaveTextContent(
      'group:macro',
    )
  })

  it('opens nothing for a mouse passing by', async () => {
    await userEvent.hover(screen.getByText('#macro'))
    await userEvent.unhover(screen.getByText('#macro'))
    await wait(OPEN_DELAY + 100)
    expect(screen.queryByTestId('card')).not.toBeInTheDocument()
  })

  it('closes when the mouse leaves, or at once with Esc (MP-07, MP-10)', async () => {
    await userEvent.hover(screen.getByText('#macro'))
    await screen.findByTestId('card', {}, { timeout: OPEN_DELAY + 500 })
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByTestId('card')).not.toBeInTheDocument()

    await userEvent.unhover(screen.getByText('#macro'))
    await userEvent.hover(screen.getByText('#macro'))
    await screen.findByTestId('card', {}, { timeout: OPEN_DELAY + 500 })
    await userEvent.unhover(screen.getByText('#macro'))
    await wait(300)
    expect(screen.queryByTestId('card')).not.toBeInTheDocument()
  })

  it('stays while the mouse is on the card', async () => {
    await userEvent.hover(screen.getByText('#macro'))
    const card = await screen.findByTestId('card', {}, { timeout: OPEN_DELAY + 500 })
    await userEvent.hover(card)
    await wait(300)
    expect(screen.getByTestId('card')).toBeInTheDocument()
  })

  it('closes after its button was clicked, giving the focus back to the link (MP-07)', async () => {
    await userEvent.hover(screen.getByText('#macro'))
    const card = await screen.findByTestId('card', {}, { timeout: OPEN_DELAY + 500 })
    await userEvent.click(screen.getByRole('button', { name: 'Join' }))
    expect(screen.getByRole('button', { name: 'Join' })).toHaveFocus()
    await userEvent.unhover(card)
    await wait(300)
    expect(screen.queryByTestId('card')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '#macro' })).toHaveFocus()
  })

  it('opens with the keyboard focus and closes when the focus moves on (Q1)', async () => {
    await userEvent.tab()
    expect(screen.getByRole('link', { name: '#macro' })).toHaveFocus()
    expect(await screen.findByTestId('card', {}, { timeout: OPEN_DELAY + 500 })).toBeInTheDocument()
    await userEvent.tab()
    await wait(300)
    expect(screen.queryByTestId('card')).not.toBeInTheDocument()
  })

  it('never opens for touch, nor for an attribute that is not a valid target (MP-02)', async () => {
    const touch = new MouseEvent('pointerover', { bubbles: true })
    Object.defineProperty(touch, 'pointerType', { value: 'touch' })
    fireEvent(screen.getByText('#macro'), touch)
    await userEvent.hover(screen.getByText('bad'))
    await wait(OPEN_DELAY + 100)
    expect(screen.queryByTestId('card')).not.toBeInTheDocument()
  })
})
