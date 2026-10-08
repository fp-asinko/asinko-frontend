import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { EmojiPanel } from './emoji-panel'

const onPick = vi.fn()

function Harness() {
  const anchor = useRef<HTMLButtonElement>(null)
  const field = useRef<HTMLTextAreaElement>(null)
  return (
    <>
      <textarea ref={field} aria-label="Body" />
      <button ref={anchor} type="button">
        Anchor
      </button>
      <EmojiPanel anchor={anchor} field={field} open onOpenChange={vi.fn()} onPick={onPick} />
    </>
  )
}

async function renderPanel() {
  renderWithIntl(<Harness />)
  const panel = await screen.findByRole('dialog', { name: 'Emojis' })
  return { panel, search: within(panel).getByRole('searchbox', { name: 'Search emoji' }) }
}

describe('EmojiPanel (specs/emoji-picker EP-02, EP-07)', () => {
  beforeEach(() => {
    localStorage.clear()
    onPick.mockReset()
  })

  it('takes one Tab for the categories (a toolbar) and one more to the emojis', async () => {
    const { panel, search } = await renderPanel()
    search.focus()
    await userEvent.tab()
    const toolbar = within(panel).getByRole('toolbar', { name: 'Categories' })
    expect(within(toolbar).getByRole('button', { name: 'Smileys' })).toHaveFocus()
    await userEvent.tab()
    expect(within(panel).getByRole('button', { name: /^grinning face/ })).toHaveFocus()
  })

  it('moves along the categories with the arrows, and a category takes the focus to its emojis', async () => {
    const { panel, search } = await renderPanel()
    search.focus()
    await userEvent.tab()
    await userEvent.keyboard('{End}')
    const toolbar = within(panel).getByRole('toolbar')
    expect(within(toolbar).getByRole('button', { name: 'Symbols' })).toHaveFocus()
    await userEvent.keyboard('{ArrowLeft}')
    expect(within(toolbar).getByRole('button', { name: 'Objects' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(within(panel).getByRole('button', { name: /^red heart/ })).toHaveFocus()
  })

  it('goes back to the search with ↑ from the first row, and Home or End go to the ends', async () => {
    const { panel, search } = await renderPanel()
    search.focus()
    await userEvent.keyboard('{ArrowDown}{End}')
    expect(within(panel).getByRole('button', { name: /^triangular flag/ })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    expect(within(panel).getByRole('button', { name: /^grinning face/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(search).toHaveFocus()
  })

  it('picks with Enter on an emoji', async () => {
    const { search } = await renderPanel()
    search.focus()
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{Enter}')
    expect(onPick).toHaveBeenCalledWith('😃')
  })
})
