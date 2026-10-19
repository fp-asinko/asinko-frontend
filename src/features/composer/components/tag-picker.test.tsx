import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { TagPicker } from './tag-picker'

function Picker({ tags = ['Analysis', 'News'] }: { tags?: string[] }) {
  const [value, setValue] = useState('')
  return <TagPicker tags={tags} hasCommunity value={value} onChange={setValue} />
}

describe('TagPicker (specs/drafts-tags DT-07, DT-08)', () => {
  it("chooses one of the community's tags, shown as a pill with its ×", async () => {
    const user = userEvent.setup()
    renderWithIntl(<Picker />)

    await user.click(screen.getByRole('button', { name: 'Add tag' }))
    await user.click(await screen.findByRole('menuitem', { name: 'News' }))

    expect(screen.getByText('News')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove tag News' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Add tag' })).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Remove tag News' }))
    expect(screen.getByRole('button', { name: 'Add tag' })).toHaveFocus()
  })

  it('says why it is disabled: without tags, or without a community', async () => {
    const onChange = vi.fn()
    const { rerender } = renderWithIntl(
      <TagPicker tags={[]} hasCommunity value="" onChange={onChange} />,
    )
    const button = screen.getByRole('button', { name: 'Add tag' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).toHaveAccessibleDescription('This community has no tags')
    await userEvent.click(button)
    expect(screen.queryByRole('menu')).toBeNull()

    rerender(<TagPicker tags={[]} hasCommunity={false} value="" onChange={onChange} />)
    expect(screen.getByRole('button', { name: 'Add tag' })).toHaveAccessibleDescription(
      'Choose a community first',
    )
    expect(onChange).not.toHaveBeenCalled()
  })
})
