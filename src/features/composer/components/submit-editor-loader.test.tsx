import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditorSkeleton, SubmitEditorLoader } from './submit-editor-loader'

vi.mock('./submit-editor', () => ({
  SubmitEditor: ({ type }: { type: string }) => <form aria-label="editor">{type}</form>,
}))

describe('SubmitEditorLoader (specs/submit-page SU-11)', () => {
  it('keeps the form’s place, hidden from assistive tech, while the editor loads', () => {
    const { container } = render(<EditorSkeleton />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('then shows the editor with its props', async () => {
    render(<SubmitEditorLoader type="LINK" community={null} storageKey={null} />)
    expect(await screen.findByRole('form', { name: 'editor' })).toHaveTextContent('LINK')
  })
})
