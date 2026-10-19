import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { newDraft } from '../../../lib/widget-drafts'
import { CommunitiesWidgetForm } from './communities-widget-form'

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

describe('CommunitiesWidgetForm (CW-06, CW-10)', () => {
  it('searches, adds with "+" and takes out with ×', async () => {
    actions.findWidgetCommunities.mockResolvedValue({
      ok: true,
      data: [
        {
          id: '00000000-0000-4000-8000-000000001001',
          slug: 'defi',
          handle: '#defi',
          avatarUrl: null,
        },
      ],
    })
    const onDone = vi.fn()
    renderWithIntl(
      withDone(
        <CommunitiesWidgetForm
          draft={{ ...newDraft('COMMUNITIES'), title: 'Related' } as never}
          formId="form"
          onDone={onDone}
        />,
      ),
    )
    await done()
    expect(screen.getByText('Add at least one')).toBeInTheDocument()

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search communities or assets' }),
      'de',
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Add #defi' }))
    expect(screen.getByRole('button', { name: 'Remove #defi' })).toBeInTheDocument()
    await done()
    expect(onDone).toHaveBeenCalledWith(
      expect.objectContaining({ communities: [expect.objectContaining({ handle: '#defi' })] }),
    )
  })
})
