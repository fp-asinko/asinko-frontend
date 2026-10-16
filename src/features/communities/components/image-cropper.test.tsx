import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ImageCropper } from './image-cropper'

const deps = vi.hoisted(() => ({ cropImage: vi.fn(), uploadProfileImage: vi.fn() }))
vi.mock('@/lib/prepare-image', () => ({ cropImage: deps.cropImage }))
vi.mock('../actions/upload-profile-image.action', () => ({
  uploadProfileImage: deps.uploadProfileImage,
}))
// jsdom has no image decoding: a cropper that reports the area it shows.
vi.mock('react-easy-crop', () => ({
  default: function Cropper(props: {
    aspect: number
    cropShape: string
    zoom: number
    cropperProps: Record<string, string>
    onCropComplete: (area: unknown, pixels: unknown) => void
  }) {
    useEffect(() => {
      props.onCropComplete({}, { x: 10, y: 20, width: 300, height: 300 })
    })
    return (
      <div {...props.cropperProps} data-aspect={props.aspect} data-shape={props.cropShape}>
        zoom {props.zoom}
      </div>
    )
  },
}))

const file = new File(['x'], 'me.png', { type: 'image/png' })

function renderCropper(kind: 'avatar' | 'banner' = 'avatar') {
  const onApply = vi.fn()
  const onBack = vi.fn()
  renderWithIntl(
    <ImageCropper kind={kind} file={file} source="blob:file" onApply={onApply} onBack={onBack} />,
  )
  return { onApply, onBack }
}

describe('ImageCropper (specs/profile-presentation PP-07)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() }),
    )
    deps.cropImage.mockResolvedValue({ ok: true, blob: new Blob(['w']), width: 400, height: 400 })
    deps.uploadProfileImage.mockResolvedValue({ ok: true, data: { imageUrl: '/a.webp' } })
  })

  it('frames a photo round and a banner at 4:1, named for assistive tech', () => {
    renderCropper()
    expect(screen.getByRole('heading', { name: 'Crop your photo' })).toBeInTheDocument()
    const area = screen.getByRole('group', { name: /Image to crop/ })
    expect(area).toHaveAttribute('data-shape', 'round')
    expect(area).toHaveAttribute('data-aspect', '1')
  })

  it('takes the focus as it comes: it replaces the window body (WCAG 2.4.3)', async () => {
    renderCropper()
    await vi.waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Crop your photo' })).toHaveFocus(),
    )
  })

  it('zooms with the slider too', async () => {
    renderCropper('banner')
    const zoom = screen.getByRole('slider', { name: 'Zoom' })
    expect(screen.getByRole('group', { name: /Image to crop/ })).toHaveAttribute('data-aspect', '4')
    // jsdom does not move a range with the keys: the value, as the browser would leave it.
    fireEvent.change(zoom, { target: { value: '2' } })
    expect(screen.getByRole('group', { name: /Image to crop/ })).toHaveTextContent('zoom 2')
    // Said as a percentage, not as 2.
    expect(zoom).toHaveAttribute('aria-valuetext', '200%')
  })

  it('cuts the chosen part at the final size, uploads it and hands its URL and a preview', async () => {
    const { onApply } = renderCropper('banner')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(deps.cropImage).toHaveBeenCalledWith(
      file,
      { x: 10, y: 20, width: 300, height: 300 },
      { width: 1500, height: 375 },
    )
    const sent = deps.uploadProfileImage.mock.calls[0]![0] as FormData
    expect(sent.get('kind')).toBe('banner')
    expect(onApply).toHaveBeenCalledWith({ imageUrl: '/a.webp', preview: 'blob:x' })
  })

  it('says why it could not, and goes back without uploading', async () => {
    deps.cropImage.mockResolvedValue({ ok: false, error: 'tooLarge' })
    const { onApply, onBack } = renderCropper()
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('The image is too large')
    deps.cropImage.mockResolvedValue({ ok: true, blob: new Blob(['w']), width: 1, height: 1 })
    deps.uploadProfileImage.mockResolvedValue({
      ok: false,
      error: 'communities.edit.errors.imageUpload',
    })
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not upload the image')
    expect(onApply).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledOnce()
  })
})
