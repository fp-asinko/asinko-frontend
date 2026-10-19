import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { newDraft } from '../../../lib/widget-drafts'
import { ImagesWidgetForm } from './images-widget-form'

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

describe('ImagesWidgetForm (CW-11)', () => {
  it('uploads a chosen image, holding Done while it goes, then asks what it shows', async () => {
    actions.prepareImage.mockResolvedValue({
      ok: true,
      blob: new Blob(['x']),
      width: 10,
      height: 10,
    })
    actions.uploadWidgetImage.mockResolvedValue({
      ok: true,
      data: { imageUrl: '/mocks/chart-m2.svg' },
    })
    const onDone = vi.fn()
    const onBusy = vi.fn()
    renderWithIntl(
      withDone(
        <ImagesWidgetForm
          draft={newDraft('IMAGES') as never}
          formId="form"
          communityId="00000000-0000-4000-8000-000000001009"
          onDone={onDone}
          onBusy={onBusy}
        />,
      ),
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['x'], 'chart.png', { type: 'image/png' }))
    expect(onBusy).toHaveBeenCalledWith(true)
    const image = await screen.findByRole('group', { name: 'Image 1' })
    expect(onBusy).toHaveBeenLastCalledWith(false)
    await done()
    expect(within(image).getByText('Say what the image shows')).toBeInTheDocument()
    await userEvent.type(within(image).getByRole('textbox', { name: 'Description' }), 'M2')
    await done()
    expect(onDone).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [{ imageUrl: '/mocks/chart-m2.svg', alt: 'M2', linkUrl: '' }],
      }),
    )
  })

  it('says why an image was refused', async () => {
    actions.prepareImage.mockResolvedValue({ ok: false, error: 'type' })
    renderWithIntl(
      <ImagesWidgetForm
        draft={newDraft('IMAGES') as never}
        formId="form"
        communityId="00000000-0000-4000-8000-000000001009"
        onDone={vi.fn()}
        onBusy={vi.fn()}
      />,
    )
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, new File(['x'], 'a.png', { type: 'image/png' }))
    expect(await screen.findByText('Use a JPEG, PNG or WebP image.')).toBeInTheDocument()
  })
})
