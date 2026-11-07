import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { GroupImageCropper } from './group-image-cropper'

const deps = vi.hoisted(() => ({ cropImage: vi.fn() }))
vi.mock('@/lib/prepare-image', () => ({ cropImage: deps.cropImage }))
// jsdom has no image decoding: a cropper that reports the area it shows.
vi.mock('react-easy-crop', () => ({
  default: function Cropper(props: {
    aspect: number
    cropShape: string
    cropperProps: Record<string, string>
    onCropComplete: (area: unknown, pixels: unknown) => void
  }) {
    useEffect(() => {
      props.onCropComplete({}, { x: 0, y: 0, width: 400, height: 100 })
    })
    return <div {...props.cropperProps} data-aspect={props.aspect} data-shape={props.cropShape} />
  },
}))

const file = new File(['x'], 'g.png', { type: 'image/png' })

function renderCropper(kind: 'avatar' | 'banner' = 'banner') {
  const onApply = vi.fn()
  const onBack = vi.fn()
  renderWithIntl(
    <GroupImageCropper kind={kind} file={file} source="blob:g" onApply={onApply} onBack={onBack} />,
  )
  return { onApply, onBack }
}

describe('GroupImageCropper (specs/community-create CG-03.4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    deps.cropImage.mockResolvedValue({ ok: true, blob: new Blob(['w']), width: 1500, height: 375 })
  })

  it('crops a banner at 4:1 and a square photo, and hands back the image without uploading', async () => {
    const { onApply } = renderCropper()
    expect(screen.getByRole('dialog', { name: 'Crop the banner' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Image to crop/ })).toHaveAttribute('data-aspect', '4')
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(deps.cropImage).toHaveBeenCalledWith(
      file,
      { x: 0, y: 0, width: 400, height: 100 },
      { width: 1500, height: 375 },
    )
    expect(onApply).toHaveBeenCalledWith(expect.any(Blob))
  })

  it('frames the photo square, not round', () => {
    renderCropper('avatar')
    expect(screen.getByRole('dialog', { name: 'Crop the photo' })).toBeInTheDocument()
    const area = screen.getByRole('group', { name: /Image to crop/ })
    expect(area).toHaveAttribute('data-aspect', '1')
    expect(area).toHaveAttribute('data-shape', 'rect')
  })

  it('says why an image could not be used, and goes back without it', async () => {
    deps.cropImage.mockResolvedValue({ ok: false, error: 'unreadable' })
    const { onApply, onBack } = renderCropper()
    await userEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Could not read the image')
    expect(onApply).not.toHaveBeenCalled()
    await userEvent.click(screen.getAllByRole('button', { name: 'Back' })[0]!)
    expect(onBack).toHaveBeenCalled()
  })
})
