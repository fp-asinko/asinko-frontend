import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSavedDraft } from './use-saved-draft'

const actions = vi.hoisted(() => ({ saveDraft: vi.fn() }))
vi.mock('../actions/drafts.action', () => ({ saveDraft: actions.saveDraft }))

const ID = '00000000-0000-4000-8000-000000000901'
const fields = { type: 'TEXT' as const, title: 'Rates' }

describe('useSavedDraft (specs/drafts-tags DT-01, DT-03, DT-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates, then updates the same draft, remembering what was saved', async () => {
    actions.saveDraft.mockResolvedValue({ ok: true, data: { id: ID } })
    const { result } = renderHook(() => useSavedDraft())

    act(() => result.current.save(fields, 'one'))
    await waitFor(() => expect(result.current.savedAs).toBe('one'))
    expect(actions.saveDraft).toHaveBeenCalledWith(fields)
    expect(result.current.draftId).toBe(ID)

    act(() => result.current.save(fields, 'two'))
    await waitFor(() => expect(result.current.savedAs).toBe('two'))
    expect(actions.saveDraft).toHaveBeenLastCalledWith({ ...fields, draftId: ID })
  })

  it('keeps the error, and opens or forgets a draft of the list', async () => {
    actions.saveDraft.mockResolvedValue({ ok: false, error: 'composer.drafts.errors.limit' })
    const { result } = renderHook(() => useSavedDraft())
    act(() => result.current.save(fields, 'one'))
    await waitFor(() => expect(result.current.error).toBe('composer.drafts.errors.limit'))
    expect(result.current.savedAs).toBeNull()

    act(() => result.current.open(ID))
    expect(result.current).toMatchObject({ draftId: ID, error: null })
    act(() => result.current.forget('another'))
    expect(result.current.draftId).toBe(ID)
    act(() => result.current.forget(ID))
    expect(result.current.draftId).toBeNull()
  })
})
