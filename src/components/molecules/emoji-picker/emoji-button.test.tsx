import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { EmojiButton } from './emoji-button'

/** A controlled textarea with the button, as the comment box. */
function Harness({ initial = '' }: { initial?: string }) {
  const field = useRef<HTMLTextAreaElement>(null)
  const [text, setText] = useState(initial)
  return (
    <>
      <textarea
        ref={field}
        aria-label="Body"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />
      <EmojiButton fieldRef={field} />
      <p data-testid="value">{text}</p>
    </>
  )
}

const body = () => screen.getByRole('textbox', { name: 'Body' }) as HTMLTextAreaElement

async function openPanel() {
  await userEvent.click(screen.getByRole('button', { name: 'Add emoji' }))
  return screen.findByRole('dialog', { name: 'Emojis' })
}

// The whole panel (every category) renders in each test: ~1 s alone, past Vitest's 5 s under the
// coverage run's load. A longer limit, not a slower check.
describe('EmojiButton (specs/emoji-picker)', { timeout: 15_000 }, () => {
  beforeEach(() => localStorage.clear())

  it('opens a panel named Emojis, with the focus in its search and every category (EP-02, EP-08)', async () => {
    renderWithIntl(<Harness />)
    const panel = await openPanel()
    expect(within(panel).getByRole('searchbox', { name: 'Search emoji' })).toHaveFocus()
    expect(within(panel).getByRole('heading', { name: 'Smileys' })).toBeInTheDocument()
    expect(within(panel).getByRole('button', { name: 'Symbols' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add emoji' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('inserts at the caret, closes, and gives the focus back after the emoji (EP-03)', async () => {
    renderWithIntl(<Harness initial="BTC up" />)
    body().setSelectionRange(4, 4)
    const panel = await openPanel()
    await userEvent.click(within(panel).getByRole('button', { name: /^rocket/ }))
    expect(screen.getByTestId('value')).toHaveTextContent('BTC 🚀up')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(body()).toHaveFocus()
    expect(body().selectionStart).toBe('BTC 🚀'.length)
  })

  it('searches by name, announces the count, and Enter picks the first (EP-04, EP-07)', async () => {
    renderWithIntl(<Harness />)
    const panel = await openPanel()
    await userEvent.type(within(panel).getByRole('searchbox'), 'fire')
    expect(within(panel).getByRole('status')).toHaveTextContent('1 emoji')
    await userEvent.keyboard('{Enter}')
    expect(screen.getByTestId('value')).toHaveTextContent('🔥')
  })

  it('says when nothing matches', async () => {
    renderWithIntl(<Harness />)
    const panel = await openPanel()
    await userEvent.type(within(panel).getByRole('searchbox'), 'zzzqqq')
    expect(within(panel).getByRole('status')).toHaveTextContent('No emojis found')
  })

  it('moves among the emojis with the arrows, one tab stop for all (EP-07)', async () => {
    renderWithIntl(<Harness />)
    const panel = await openPanel()
    await userEvent.keyboard('{ArrowDown}')
    const first = within(panel).getByRole('button', { name: /^grinning face/ })
    expect(first).toHaveFocus()
    expect(first).toHaveAttribute('tabindex', '0')
    await userEvent.keyboard('{ArrowRight}')
    expect(within(panel).getByRole('button', { name: /^smiley/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(document.activeElement).toBe(within(panel).getAllByRole('button')[8 + 1 + 8])
    await userEvent.keyboard('{Enter}')
    expect(body().value).not.toBe('')
  })

  it('shows the recent ones first next time (EP-05)', async () => {
    renderWithIntl(<Harness />)
    let panel = await openPanel()
    await userEvent.click(within(panel).getByRole('button', { name: /^gem/ }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    panel = await openPanel()
    const recent = within(panel).getByRole('region', { name: 'Recent' })
    expect(within(recent).getByRole('button', { name: /^gem/ })).toBeInTheDocument()
  })

  it('closes with Esc, the focus back in the field (EP-07)', async () => {
    renderWithIntl(<Harness />)
    await openPanel()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(body()).toHaveFocus()
  })

  it('names emojis in the page language', async () => {
    renderWithIntl(<Harness />, { locale: 'es' })
    await userEvent.click(screen.getByRole('button', { name: 'Agregar emoji' }))
    const panel = await screen.findByRole('dialog', { name: 'Emojis' })
    await userEvent.type(within(panel).getByRole('searchbox', { name: 'Buscar emoji' }), 'fuego')
    expect(within(panel).getByRole('button', { name: /^fuego/ })).toBeInTheDocument()
  })
})
