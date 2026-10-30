'use client'

import { useFormatter } from 'next-intl'
import { useId, useState } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
// Its styles as a stylesheet: the <style> it injects carries no nonce and the CSP blocks it.
import 'react-easy-crop/react-easy-crop.css'

/** Below 1 the image gets smaller than the frame: a whole logo fits, the rest is white. */
const MIN_ZOOM = 0.5
const MAX_ZOOM = 3

/**
 * Frames an image before it is cut (specs/profile-presentation PP-07, specs/auth AU-21): it moves
 * under a round or rectangular frame with a finger, the mouse or the arrow keys, and zooms with two
 * fingers, the wheel or the slider, also out to half the frame. Reports the part in the frame, in
 * the image's pixels. Loaded by its users on first use: the library is heavy (seo.md).
 */
export function CropFrame({
  source,
  aspect,
  round = false,
  areaLabel,
  zoomLabel,
  onAreaChange,
}: {
  /** The image as a URL (its owner revokes it). */
  source: string
  aspect: number
  round?: boolean
  areaLabel: string
  zoomLabel: string
  onAreaChange: (area: Area) => void
}) {
  const format = useFormatter()
  const ids = useId()
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  return (
    <>
      <div className="relative h-64 overflow-hidden rounded-lg bg-muted sm:h-80">
        <Cropper
          image={source}
          crop={crop}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          // Zoomed out, it moves freely inside the frame; from 1 up, it always covers it.
          restrictPosition={zoom >= 1}
          aspect={aspect}
          cropShape={round ? 'round' : 'rect'}
          showGrid={false}
          disableAutomaticStylesInjection
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => onAreaChange(pixels)}
          cropperProps={{ role: 'group', 'aria-label': areaLabel }}
          classes={{
            containerClassName:
              'outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
          }}
          mediaProps={{ alt: '' }}
        />
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor={`${ids}-zoom`} className="type-action">
          {zoomLabel}
        </label>
        <input
          id={`${ids}-zoom`}
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.05}
          value={zoom}
          aria-valuetext={format.number(zoom, { style: 'percent' })}
          onChange={(event) => setZoom(Number(event.currentTarget.value))}
          className="h-6 flex-1 accent-primary"
        />
      </div>
    </>
  )
}
