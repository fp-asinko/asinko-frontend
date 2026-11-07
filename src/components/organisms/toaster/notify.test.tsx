import { act, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { notify } from './notify'

const toast = vi.hoisted(() =>
  Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), info: vi.fn() }),
)
vi.mock('sonner', () => ({ toast }))
vi.mock('@/components/ui/sonner', () => ({
  Toaster: ({ theme }: { theme: string }) => (
    <div role="region" aria-label="Toasts" data-theme={theme} />
  ),
}))

describe('notify', () => {
  it('mounts the toaster once, with the site theme, and shows each toast', async () => {
    document.documentElement.classList.add('dark')
    await act(async () => notify({ message: 'Failed', kind: 'error' }))
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed'))
    expect(await screen.findByRole('region', { name: 'Toasts' })).toHaveAttribute(
      'data-theme',
      'dark',
    )

    await act(async () => notify({ message: 'Plain' }))
    await vi.waitFor(() => expect(toast).toHaveBeenCalledWith('Plain'))
    expect(screen.getAllByRole('region', { name: 'Toasts' })).toHaveLength(1)
    document.documentElement.classList.remove('dark')
  })
})
