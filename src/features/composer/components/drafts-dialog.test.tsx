import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { SavedDraft } from '../composer.types'
import { DraftsDialog } from './drafts-dialog'

const actions = vi.hoisted(() => ({ listDrafts: vi.fn(), deleteDraft: vi.fn() }))
vi.mock('../actions/drafts.action', () => ({
  listDrafts: actions.listDrafts,
  deleteDraft: actions.deleteDraft,
}))

const draft = (overrides: Partial<SavedDraft> = {}): SavedDraft => ({
  id: 'd1',
  type: 'TEXT',
  title: 'Rates are going down',
  body: '',
  url: '',
  imageUrl: null,
  imageAlt: '',
  tag: '',
  community: { id: 'c1', slug: 'macro', handle: '#macro', name: 'Macro', own: false, tags: [] },
  updatedAt: new Date(Date.now() - 3600_000).toISOString(),
  ...overrides,
})

function renderDialog() {
  const onOpen = vi.fn()
  const onDeleted = vi.fn()
  renderWithIntl(
    <DraftsDialog
      layout="modal"
      open
      onOpenChange={vi.fn()}
      onOpen={onOpen}
      onDeleted={onDeleted}
    />,
  )
  return { onOpen, onDeleted }
}

describe('DraftsDialog (specs/drafts-tags DT-02 to DT-04)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists the drafts with how many of 20, and opens the one touched', async () => {
    actions.listDrafts.mockResolvedValue({
      ok: true,
      data: [draft(), draft({ id: 'd2', title: '', community: null })],
    })
    const { onOpen } = renderDialog()

    expect(await screen.findByText('2/20')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Untitled No community/ })).toBeInTheDocument()
    await userEvent.click(
      screen.getByRole('button', { name: /Rates are going down #macro · 1 hour ago/ }),
    )
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1' }))
  })

  it('says there are none yet', async () => {
    actions.listDrafts.mockResolvedValue({ ok: true, data: [] })
    renderDialog()
    expect(await screen.findByText('No drafts yet')).toBeInTheDocument()
    expect(screen.getByText('0/20')).toBeInTheDocument()
  })

  it('offers to try again when they cannot load', async () => {
    actions.listDrafts.mockResolvedValueOnce({ ok: false, error: 'api.errors.UNAVAILABLE' })
    actions.listDrafts.mockResolvedValueOnce({ ok: true, data: [draft()] })
    renderDialog()
    await userEvent.click(await screen.findByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Rates are going down')).toBeInTheDocument()
  })

  it('deletes one after asking, and tells the editor', async () => {
    actions.listDrafts.mockResolvedValue({ ok: true, data: [draft()] })
    actions.deleteDraft.mockResolvedValue({ ok: true, data: null })
    const { onDeleted } = renderDialog()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete the draft Rates are going down' }),
    )
    const ask = await screen.findByRole('alertdialog', { name: 'Delete this draft?' })
    await userEvent.click(within(ask).getByRole('button', { name: 'Delete' }))

    expect(actions.deleteDraft).toHaveBeenCalledWith('d1')
    expect(await screen.findByText('No drafts yet')).toBeInTheDocument()
    expect(onDeleted).toHaveBeenCalledWith('d1')
  })

  it('keeps the draft and says so when deleting fails', async () => {
    actions.listDrafts.mockResolvedValue({ ok: true, data: [draft()] })
    actions.deleteDraft.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    const { onDeleted } = renderDialog()

    await userEvent.click(
      await screen.findByRole('button', { name: 'Delete the draft Rates are going down' }),
    )
    await userEvent.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Delete' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent("The draft couldn't be deleted.")
    expect(screen.getByText('Rates are going down')).toBeInTheDocument()
    expect(onDeleted).not.toHaveBeenCalled()
  })
})
