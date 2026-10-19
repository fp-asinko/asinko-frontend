// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { hideChecklist } from './hide-checklist.action'

const store = vi.hoisted(() => ({ set: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: async () => store }))

describe('hideChecklist (specs/profile-showcase PS-03)', () => {
  it('remembers in this browser, for a year, that the card is hidden', async () => {
    await hideChecklist()
    expect(store.set).toHaveBeenCalledWith('asinko-profile-checklist', 'hidden', {
      maxAge: 31_536_000,
      sameSite: 'lax',
      path: '/',
      httpOnly: true,
    })
  })
})
