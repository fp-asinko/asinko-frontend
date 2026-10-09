import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ImageField, type TakeImage } from './image-field'

const deps = vi.hoisted(() => ({
  uploadPostImageAction: vi.fn(),
  removePostImageAction: vi.fn(),
  prepareImage: vi.fn(),
}))
vi.mock('../actions/upload-post-image.action', () => deps)
vi.mock('@/lib/prepare-image', async (original) => ({
  ...(await original<typeof import('@/lib/prepare-image')>()),
  prepareImage: deps.prepareImage,
}))

const IMAGE = 'https://project.supabase.co/storage/v1/object/public/post-images/u/a.webp'

function renderField() {
  const onChange = vi.fn()
  const onBusy = vi.fn()
  const onUnauthenticated = vi.fn()
  const takeRef: { current: TakeImage | null } = { current: null }
  const view = renderWithIntl(
    <ImageField
      id="image"
      onChange={onChange}
      onBusy={onBusy}
      onUnauthenticated={onUnauthenticated}
      takeRef={takeRef}
    />,
  )
  return { onChange, onBusy, onUnauthenticated, takeRef, unmount: view.unmount }
}

const png = () => new File(['png'], 'chart.png', { type: 'image/png' })

describe('ImageField (specs/post-image PI-01, PI-06, PI-08)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    deps.prepareImage.mockResolvedValue({
      ok: true,
      blob: new Blob(['webp'], { type: 'image/webp' }),
      width: 800,
      height: 600,
    })
    deps.uploadPostImageAction.mockResolvedValue({ ok: true, data: { imageUrl: IMAGE } })
  })

  it('invites to choose an image, named by what it says', () => {
    renderField()
    expect(screen.getByRole('button', { name: /Choose image/ })).toHaveAttribute('id', 'image')
  })

  it('takes a file handed from the editor, holding Publish while it uploads', async () => {
    const { takeRef, onBusy, onChange } = renderField()
    await act(async () => takeRef.current?.(png()))
    expect(onBusy).toHaveBeenNthCalledWith(1, true)
    expect(onBusy).toHaveBeenLastCalledWith(false)
    expect(onChange).toHaveBeenLastCalledWith(IMAGE)
    expect(await screen.findByRole('img', { name: 'The image of your post' })).toHaveAttribute(
      'src',
      'blob:preview',
    )
  })

  it('changes the image, deleting the one before (Q1)', async () => {
    const { takeRef } = renderField()
    await act(async () => takeRef.current?.(png()))
    const input = document.querySelector<HTMLInputElement>('input[type="file"]')!
    const click = vi.spyOn(input, 'click')
    await userEvent.click(screen.getByRole('button', { name: 'Change image' }))
    expect(click).toHaveBeenCalled()
    await userEvent.upload(input, png())
    expect(deps.removePostImageAction).toHaveBeenCalledWith({ imageUrl: IMAGE })
  })

  it('opens the log-in modal when the session ended meanwhile', async () => {
    deps.uploadPostImageAction.mockResolvedValue({ ok: false, error: 'api.errors.UNAUTHENTICATED' })
    const { takeRef, onUnauthenticated } = renderField()
    await act(async () => takeRef.current?.(png()))
    expect(onUnauthenticated).toHaveBeenCalledOnce()
  })

  it('announces when the image is ready, and moves the focus to Change', async () => {
    renderField()
    await userEvent.click(screen.getByRole('button', { name: /Choose image/ }))
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, png())
    expect(await screen.findByRole('status')).toHaveTextContent('Image ready')
    expect(screen.getByRole('button', { name: 'Change image' })).toHaveFocus()
  })

  it('offers Retry after a failed upload, with the focus on it, and the error describing the choice', async () => {
    deps.uploadPostImageAction.mockResolvedValueOnce({
      ok: false,
      error: 'composer.errors.imageUpload',
    })
    renderField()
    await userEvent.click(screen.getByRole('button', { name: /Choose image/ }))
    await userEvent.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, png())
    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(retry).toHaveFocus()
    expect(screen.getByRole('button', { name: /Choose image/ })).toHaveAccessibleDescription(
      'Could not upload the image',
    )
    await userEvent.click(retry)
    expect(await screen.findByRole('button', { name: 'Change image' })).toHaveFocus()
  })

  it('says when the image is too large', async () => {
    deps.uploadPostImageAction.mockResolvedValueOnce({
      ok: false,
      error: 'composer.errors.imageTooLarge',
    })
    const { takeRef } = renderField()
    await act(async () => takeRef.current?.(png()))
    expect(screen.getByRole('alert')).toHaveTextContent('The image is too large')
  })

  it('keeps only the newest of two images, deleting the older one when it arrives (Q1)', async () => {
    let first!: (value: unknown) => void
    deps.uploadPostImageAction
      .mockReturnValueOnce(new Promise((resolve) => (first = resolve)))
      .mockResolvedValueOnce({ ok: true, data: { imageUrl: IMAGE.replace('a.webp', 'b.webp') } })
    const { takeRef, onChange } = renderField()
    await act(async () => {
      takeRef.current?.(png())
      await Promise.resolve()
    })
    await act(async () => takeRef.current?.(png()))
    await act(async () => first({ ok: true, data: { imageUrl: IMAGE } }))
    expect(onChange).toHaveBeenLastCalledWith(IMAGE.replace('a.webp', 'b.webp'))
    expect(deps.removePostImageAction).toHaveBeenCalledWith({ imageUrl: IMAGE })
  })

  it('deletes an upload that ends after the editor closed (Q1)', async () => {
    let finish!: (value: unknown) => void
    deps.uploadPostImageAction.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
    const { takeRef, unmount } = renderField()
    await act(async () => {
      takeRef.current?.(png())
      await Promise.resolve()
    })
    unmount()
    await act(async () => finish({ ok: true, data: { imageUrl: IMAGE } }))
    expect(deps.removePostImageAction).toHaveBeenCalledWith({ imageUrl: IMAGE })
  })
})
