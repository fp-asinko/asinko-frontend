import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { toDraft } from '../../../lib/widget-drafts'
import { RULES } from '../widgets.fixture'
import { RulesWidgetForm } from './rules-widget-form'

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

describe('RulesWidgetForm (CW-06, CW-10)', () => {
  it('adds and removes rules, each with its description', async () => {
    const onDone = vi.fn()
    renderWithIntl(
      withDone(<RulesWidgetForm draft={toDraft(RULES) as never} formId="form" onDone={onDone} />),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add rule' }))
    const third = screen.getByRole('group', { name: 'Rule 3' })
    await userEvent.type(within(third).getByRole('textbox', { name: 'Rule' }), 'Be kind')
    await userEvent.click(screen.getByRole('button', { name: 'Remove rule 1' }))
    await done()
    expect(onDone).toHaveBeenCalledWith(
      expect.objectContaining({
        rules: [
          { title: 'No paid signals', description: '' },
          { title: 'Be kind', description: '' },
        ],
      }),
    )
  })
})
