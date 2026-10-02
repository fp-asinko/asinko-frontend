import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommentsToggle } from './comments-toggle'

const action = vi.hoisted(() => ({ loadCommentsPreview: vi.fn() }))
vi.mock('../actions/load-comments-preview.action', () => action)

const ID = '00000000-0000-4000-8000-000000000001'

function renderToggle() {
  return renderWithIntl(
    <CommentsToggle kind="post" id={ID}>
      6 comments
    </CommentsToggle>,
  )
}

describe('CommentsToggle (H-28)', () => {
  beforeEach(() => action.loadCommentsPreview.mockReset())

  it('loads the preview the first time it opens, with the locale', async () => {
    action.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
    renderToggle()
    const button = screen.getByRole('button', { name: /6 comments/ })
    expect(button).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText('First comment')).toBeInTheDocument()
    expect(action.loadCommentsPreview).toHaveBeenCalledWith({ kind: 'post', id: ID, locale: 'en' })
    expect(button.getAttribute('aria-controls')).toBe(
      screen.getByText('First comment').parentElement!.id,
    )
  })

  it('reuses the preview when toggled again', async () => {
    action.loadCommentsPreview.mockResolvedValue({ ok: true, data: <p>First comment</p> })
    renderToggle()
    const button = screen.getByRole('button', { name: /6 comments/ })

    await userEvent.click(button)
    await screen.findByText('First comment')
    await userEvent.click(button)
    expect(screen.queryByText('First comment')).toBeNull()
    await userEvent.click(button)
    expect(screen.getByText('First comment')).toBeInTheDocument()
    expect(action.loadCommentsPreview).toHaveBeenCalledTimes(1)
  })

  it('says when it fails and retries on the next open', async () => {
    action.loadCommentsPreview
      .mockResolvedValueOnce({ ok: false, error: 'api.errors.UNAVAILABLE' })
      .mockResolvedValueOnce({ ok: true, data: <p>Back</p> })
    renderToggle()
    const button = screen.getByRole('button', { name: /6 comments/ })

    await userEvent.click(button)
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the comments')
    await userEvent.click(button)
    await userEvent.click(button)
    expect(await screen.findByText('Back')).toBeInTheDocument()
  })
})
