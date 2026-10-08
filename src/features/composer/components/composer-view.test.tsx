import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ComposeSession } from './composer-root'
import { ComposerView } from './composer-view'

vi.mock('./inline-composer', () => ({
  InlineComposer: () => <p>inline editor</p>,
}))
vi.mock('./composer-sheet', () => ({
  ComposerSheet: ({ open }: { open: boolean }) => <p>{open ? 'sheet open' : 'sheet closed'}</p>,
}))

const SESSION: ComposeSession = { key: 1, type: 'TEXT', community: null }

describe('ComposerView (specs/post-create-detail § 2)', () => {
  it('draws the editor inside the page box when inline', () => {
    const slot = document.createElement('div')
    document.body.append(slot)
    render(
      <ComposerView
        mode="inline"
        slot={slot}
        session={SESSION}
        sheetUsed={false}
        onClose={vi.fn()}
      />,
    )
    expect(slot).toHaveTextContent('inline editor')
    expect(screen.queryByText(/sheet/)).not.toBeInTheDocument()
    slot.remove()
  })

  it('keeps the full screen mounted once used, open only in its mode', () => {
    const { rerender } = render(
      <ComposerView mode="sheet" slot={null} session={SESSION} sheetUsed onClose={vi.fn()} />,
    )
    expect(screen.getByText('sheet open')).toBeInTheDocument()
    rerender(
      <ComposerView mode="closed" slot={null} session={SESSION} sheetUsed onClose={vi.fn()} />,
    )
    expect(screen.getByText('sheet closed')).toBeInTheDocument()
  })
})
