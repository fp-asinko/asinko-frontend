import { fireEvent, screen } from '@testing-library/react'
import { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { CropFrame } from './crop-frame'

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

function renderFrame(round?: boolean) {
  const onAreaChange = vi.fn()
  renderWithIntl(
    <CropFrame
      source="blob:file"
      aspect={round ? 1 : 4}
      round={round}
      areaLabel="Image to crop"
      zoomLabel="Zoom"
      onAreaChange={onAreaChange}
    />,
  )
  return onAreaChange
}

describe('CropFrame', () => {
  it('frames round or rectangular, named for assistive tech, and reports the area', () => {
    const onAreaChange = renderFrame(true)
    const area = screen.getByRole('group', { name: 'Image to crop' })
    expect(area).toHaveAttribute('data-shape', 'round')
    expect(area).toHaveAttribute('data-aspect', '1')
    expect(onAreaChange).toHaveBeenCalledWith({ x: 10, y: 20, width: 300, height: 300 })
  })

  it('zooms with the slider, said as a percentage', () => {
    renderFrame()
    expect(screen.getByRole('group', { name: 'Image to crop' })).toHaveAttribute(
      'data-shape',
      'rect',
    )
    const zoom = screen.getByRole('slider', { name: 'Zoom' })
    // jsdom does not move a range with the keys: the value, as the browser would leave it.
    fireEvent.change(zoom, { target: { value: '2' } })
    expect(screen.getByRole('group', { name: 'Image to crop' })).toHaveTextContent('zoom 2')
    expect(zoom).toHaveAttribute('aria-valuetext', '200%')
    // Out to half the frame too: a whole logo fits.
    expect(zoom).toHaveAttribute('min', '0.5')
  })
})
