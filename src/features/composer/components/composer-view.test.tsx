import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ComposeSession } from './composer-root'
import { ComposerView } from './composer-view'

vi.mock('./inline-composer', () => ({
  InlineComposer: () => <p>inline editor</p>,
}))
vi.mock('./composer-window', () => ({
  ComposerWindow: ({ layout, open }: { layout: string; open: boolean }) => (
    <p>{`${layout} ${open ? 'open' : 'closed'}`}</p>
  ),
}))

const SESSION: ComposeSession = { key: 1, type: 'TEXT', community: null }

function view(props: Partial<Parameters<typeof ComposerView>[0]>) {
  return (
    <ComposerView
      mode="closed"
      windowLayout="modal"
      slot={null}
      session={SESSION}
      dialogUsed={false}
      onShown={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />
  )
}

describe('ComposerView (specs/post-create-detail § 2)', () => {
  it('draws the editor inside the page box when inline', () => {
    const slot = document.createElement('div')
    document.body.append(slot)
    render(view({ mode: 'inline', slot }))
    expect(slot).toHaveTextContent('inline editor')
    expect(screen.queryByText(/modal|sheet/)).not.toBeInTheDocument()
    slot.remove()
  })

  it('opens the window in its layout, and keeps it mounted with that layout once closed', () => {
    const { rerender } = render(view({ mode: 'modal', dialogUsed: true }))
    expect(screen.getByText('modal open')).toBeInTheDocument()
    rerender(view({ mode: 'closed', dialogUsed: true }))
    expect(screen.getByText('modal closed')).toBeInTheDocument()
    rerender(view({ mode: 'sheet', windowLayout: 'sheet', dialogUsed: true }))
    expect(screen.getByText('sheet open')).toBeInTheDocument()
  })
})
