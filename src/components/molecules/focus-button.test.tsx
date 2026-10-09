import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { FocusButton } from './focus-button'

describe('FocusButton (specs/empty-states ES-02)', () => {
  it('sends the focus to the field it names', async () => {
    render(
      <>
        <textarea id="comment-box" aria-label="Comment" />
        <FocusButton target="comment-box">Add a comment</FocusButton>
      </>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add a comment' }))
    expect(screen.getByRole('textbox', { name: 'Comment' })).toHaveFocus()
  })
})
