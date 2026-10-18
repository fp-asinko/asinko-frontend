import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { BodyTabs, type PreviewAction } from './body-tabs'

function renderTabs(options: { draft?: unknown; preview?: PreviewAction } = {}) {
  const preview =
    options.preview ??
    vi.fn<PreviewAction>(async () => ({ ok: true, data: { card: <article>The card</article> } }))
  renderWithIntl(
    <BodyTabs
      preview={preview}
      draft={() => ('draft' in options ? options.draft : { title: 'T' })}
      toolbar={<div role="toolbar" aria-label="Text format" />}
    >
      <textarea aria-label="Body" defaultValue="What is written" />
    </BodyTabs>,
  )
  return { preview }
}

describe('BodyTabs (specs/submit-tools ST-01 to ST-03)', () => {
  it('writes with the toolbar, and previews what is written as the feed card', async () => {
    const { preview } = renderTabs()
    expect(screen.getByRole('tab', { name: 'Write' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('toolbar', { name: 'Text format' })).toBeVisible()

    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(preview).toHaveBeenCalledWith({ title: 'T' })
    expect(await screen.findByText('The card')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Preview ready.')
    expect(screen.queryByRole('toolbar', { name: 'Text format' })).toBeNull()
  })

  it('keeps what is written when going back to Write', async () => {
    renderTabs()
    await userEvent.type(screen.getByRole('textbox', { name: 'Body' }), ' and more')
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Write' }))
    expect(screen.getByRole('textbox', { name: 'Body' })).toHaveValue('What is written and more')
  })

  it('says what is missing without asking, and a failure without leaving the editor', async () => {
    const { preview } = renderTabs({ draft: null })
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    // Shown, and announced: the focus stays on the tab (WCAG 4.1.3).
    expect(screen.getByRole('status')).toHaveTextContent(
      'Write a title and a body to see the preview.',
    )
    expect(screen.getByRole('tabpanel')).toHaveTextContent(
      'Write a title and a body to see the preview.',
    )
    expect(preview).not.toHaveBeenCalled()
  })

  it('shows the newest preview asked, not an older one arriving later', async () => {
    let first: (value: Awaited<ReturnType<PreviewAction>>) => void = () => {}
    const preview = vi
      .fn<PreviewAction>()
      .mockReturnValueOnce(new Promise((resolve) => (first = resolve)))
      .mockResolvedValueOnce({ ok: true, data: { card: <article>New</article> } })
    renderTabs({ preview })
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Write' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(await screen.findByText('New')).toBeInTheDocument()
    first({ ok: true, data: { card: <article>Old</article> } })
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(screen.queryByText('Old')).toBeNull()
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('says when the preview cannot be shown', async () => {
    renderTabs({
      preview: vi.fn<PreviewAction>(async () => ({ ok: false, error: 'api.errors.UNAVAILABLE' })),
    })
    await userEvent.click(screen.getByRole('tab', { name: 'Preview' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not show the preview')
  })

  it('without a preview, is the toolbar and the field alone', () => {
    renderWithIntl(
      <BodyTabs draft={() => null} toolbar={<div role="toolbar" aria-label="Text format" />}>
        <textarea aria-label="Body" />
      </BodyTabs>,
    )
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.getByRole('toolbar', { name: 'Text format' })).toBeInTheDocument()
  })
})
