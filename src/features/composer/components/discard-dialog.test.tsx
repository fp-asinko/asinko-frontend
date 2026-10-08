import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { DiscardDialog } from './discard-dialog'

describe('DiscardDialog (specs/post-create-detail PC-05)', () => {
  it('asks, and discards only when confirmed', async () => {
    const onOpenChange = vi.fn()
    const onDiscard = vi.fn()
    renderWithIntl(<DiscardDialog open onOpenChange={onOpenChange} onDiscard={onDiscard} />)
    expect(
      screen.getByRole('alertdialog', { name: 'Discard this post?' }),
    ).toHaveAccessibleDescription('What you wrote will be lost.')
    await userEvent.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(onDiscard).not.toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())

    await userEvent.click(screen.getByRole('button', { name: 'Discard' }))
    expect(onDiscard).toHaveBeenCalledOnce()
  })
})
