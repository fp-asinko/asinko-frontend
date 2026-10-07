import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComposeContext, ComposeTrigger } from './compose'

describe('ComposeTrigger (specs/post-create-detail § 2)', () => {
  it('opens the editor on the tab it asks for', async () => {
    const openCompose = vi.fn()
    render(
      <ComposeContext value={{ openCompose, setScope: vi.fn() }}>
        <ComposeTrigger type="TEXT">Post</ComposeTrigger>
        <ComposeTrigger aria-label="Create">+</ComposeTrigger>
      </ComposeContext>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(openCompose).toHaveBeenLastCalledWith({ type: 'TEXT' })
    await userEvent.click(screen.getByRole('button', { name: 'Create' }))
    expect(openCompose).toHaveBeenLastCalledWith({ type: undefined })
    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    )
  })

  it('does nothing without a provider', async () => {
    render(<ComposeTrigger>Post</ComposeTrigger>)
    await userEvent.click(screen.getByRole('button', { name: 'Post' }))
    expect(screen.getByRole('button', { name: 'Post' })).toBeInTheDocument()
  })
})
