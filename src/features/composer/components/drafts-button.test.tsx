import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { SavedDraft } from '../composer.types'
import { DraftsButton } from './drafts-button'

const actions = vi.hoisted(() => ({ listDrafts: vi.fn(), deleteDraft: vi.fn() }))
vi.mock('../actions/drafts.action', () => ({
  listDrafts: actions.listDrafts,
  deleteDraft: actions.deleteDraft,
}))

const DRAFT: SavedDraft = {
  id: 'd1',
  type: 'TEXT',
  title: 'Rates are going down',
  body: '',
  url: '',
  imageUrl: null,
  imageAlt: '',
  tag: '',
  community: null,
  updatedAt: new Date().toISOString(),
}

function renderButton(written: boolean) {
  const onOpen = vi.fn()
  renderWithIntl(
    <>
      <input aria-label="Title" id="title" />
      <DraftsButton
        written={() => written}
        onOpen={onOpen}
        onDeleted={vi.fn()}
        openedFocus={() => document.getElementById('title')}
      />
    </>,
  )
  return { onOpen }
}

const row = () => screen.findByRole('button', { name: /^Rates are going down/ })

describe('DraftsButton (specs/drafts-tags DT-02, DT-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    actions.listDrafts.mockResolvedValue({ ok: true, data: [DRAFT] })
  })

  it('opens the drafts, and gives the focus back on closing', async () => {
    renderButton(false)
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    const dialog = await screen.findByRole('dialog', { name: 'Drafts' })
    expect(await within(dialog).findByText('1 draft of 20')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Drafts' })).toHaveFocus())
  })

  it('opens a draft at once with nothing written, the focus going to the title', async () => {
    const { onOpen } = renderButton(false)
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    await userEvent.click(await row())
    expect(onOpen).toHaveBeenCalledWith(DRAFT)
    await vi.waitFor(() => expect(screen.getByRole('textbox', { name: 'Title' })).toHaveFocus())
  })

  it('asks before replacing what is written: Cancel keeps it, Replace opens it', async () => {
    const { onOpen } = renderButton(true)
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    await userEvent.click(await row())
    const ask = await screen.findByRole('alertdialog', { name: /Replace what you/ })
    await userEvent.click(within(ask).getByRole('button', { name: 'Cancel' }))
    expect(onOpen).not.toHaveBeenCalled()

    await userEvent.click(await row())
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Replace' }),
    )
    expect(onOpen).toHaveBeenCalledWith(DRAFT)
  })

  it('asks again on each opening (DT-02)', async () => {
    renderButton(false)
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    await row()
    await userEvent.keyboard('{Escape}')
    await userEvent.click(screen.getByRole('button', { name: 'Drafts' }))
    await row()
    expect(actions.listDrafts).toHaveBeenCalledTimes(2)
  })
})
