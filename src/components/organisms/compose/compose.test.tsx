import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ComposeContext, ComposeSlot, ComposeTrigger } from './compose'

describe('ComposeTrigger (specs/post-create-detail § 2)', () => {
  it('opens the editor on the tab it asks for', async () => {
    const openCompose = vi.fn()
    render(
      <ComposeContext
        value={{ openCompose, setScope: vi.fn(), registerSlot: vi.fn(), expanded: false }}
      >
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

describe('ComposeSlot (specs/post-create-detail PC-03)', () => {
  const slot = (expanded: boolean, registerSlot = vi.fn()) =>
    render(
      <ComposeContext value={{ openCompose: vi.fn(), setScope: vi.fn(), registerSlot, expanded }}>
        <ComposeSlot
          avatar={<span>avatar</span>}
          prompt={<button type="button">What are you thinking?</button>}
          actions={<button type="button">Post</button>}
        />
      </ComposeContext>,
    )

  it('registers its place for the editor and shows the prompt while closed', () => {
    const registerSlot = vi.fn()
    slot(false, registerSlot)
    expect(registerSlot).toHaveBeenCalledWith(expect.any(HTMLElement))
    expect(screen.getByRole('button', { name: 'What are you thinking?' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Post' })).toBeVisible()
  })

  it('gives its place to the editor when open, keeping the avatar', () => {
    slot(true)
    expect(screen.queryByRole('button', { name: 'What are you thinking?' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Post' })).not.toBeInTheDocument()
    expect(screen.getByText('avatar')).toBeVisible()
  })
})
