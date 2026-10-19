import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { toDraft } from '../../../lib/widget-drafts'
import { BUTTONS } from '../widgets.fixture'
import { ButtonsWidgetForm } from './buttons-widget-form'

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

beforeEach(() => vi.clearAllMocks())

describe('ButtonsWidgetForm (CW-07, CW-10)', () => {
  it('says a link must be https:// or a page of Asinko', async () => {
    const onDone = vi.fn()
    renderWithIntl(
      withDone(
        <ButtonsWidgetForm draft={toDraft(BUTTONS) as never} formId="form" onDone={onDone} />,
      ),
    )
    const link = within(screen.getByRole('group', { name: 'Button 1' })).getByRole('textbox', {
      name: 'Link',
    })
    await userEvent.clear(link)
    await userEvent.type(link, 'javascript:alert(1)')
    await done()
    expect(onDone).not.toHaveBeenCalled()
    expect(link).toHaveAccessibleDescription(/https:\/\//)
  })
})
