import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { newDraft } from '../../../lib/widget-drafts'
import { TextWidgetForm } from './text-widget-form'

const actions = vi.hoisted(() => ({
  findWidgetCommunities: vi.fn(),
  uploadWidgetImage: vi.fn(),
  prepareImage: vi.fn(),
}))
vi.mock('../../../actions/find-widget-communities.action', () => ({
  findWidgetCommunities: actions.findWidgetCommunities,
}))
vi.mock('../../../actions/upload-widget-image.action', () => ({
  uploadWidgetImage: actions.uploadWidgetImage,
}))
vi.mock('@/lib/prepare-image', async (original) => ({
  ...(await original<typeof import('@/lib/prepare-image')>()),
  prepareImage: actions.prepareImage,
}))

/** Each form is submitted by the dialog's "Done" (form attribute): a button here. */
function withDone(form: React.ReactElement) {
  return (
    <>
      {form}
      <button type="submit" form="form">
        Done
      </button>
    </>
  )
}
const done = () => userEvent.click(screen.getByRole('button', { name: 'Done' }))
const box = (name: string | RegExp) => screen.getByRole('textbox', { name })

beforeEach(() => vi.clearAllMocks())

describe('TextWidgetForm (CW-10)', () => {
  it('takes a title and a text', async () => {
    const onDone = vi.fn()
    renderWithIntl(
      withDone(<TextWidgetForm draft={newDraft('TEXT') as never} formId="form" onDone={onDone} />),
    )
    await userEvent.type(box('Title'), 'Welcome')
    await userEvent.type(box('Text'), 'Hi')
    await done()
    expect(onDone).toHaveBeenCalledWith(expect.objectContaining({ title: 'Welcome', body: 'Hi' }))
  })
})
