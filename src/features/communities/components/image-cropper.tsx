'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import Cropper, { type Area, type Point } from 'react-easy-crop'
// Its styles as a stylesheet: the <style> it injects carries no nonce and the CSP blocks it.
import 'react-easy-crop/react-easy-crop.css'
import { cropImage } from '@/lib/prepare-image'
import { cn } from '@/lib/utils'
import { uploadProfileImage } from '../actions/upload-profile-image.action'
import type { ProfileImageKind } from './edit-profile-images'

/** The final sizes (specs/profile-presentation design § 2): a round 400px photo, a 4:1 banner. */
const SIZE = {
  avatar: { width: 400, height: 400 },
  banner: { width: 1500, height: 375 },
} as const

const ERRORS = {
  type: 'errors.imageType',
  unreadable: 'errors.imageUnreadable',
  tooLarge: 'errors.imageTooLarge',
} as const

const PILL =
  'inline-flex h-11 tap items-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

/**
 * Crops the photo or the banner before it is uploaded (specs/profile-presentation PP-07, Q3): the
 * image moves under a round (photo) or 4:1 (banner) frame with a finger, the mouse or the arrow
 * keys, and zooms with two fingers, the wheel or the slider. Apply cuts that part, prepares it as a
 * post image and uploads it; the profile gets its URL and a preview of what was cut. Back drops it.
 */
export function ImageCropper({
  kind,
  file,
  source,
  onApply,
  onBack,
}: {
  kind: ProfileImageKind
  file: File
  /** The file as a URL to show (its owner revokes it). */
  source: string
  onApply: (image: { imageUrl: string; preview: string }) => void
  onBack: () => void
}) {
  const t = useTranslations('communities.edit')
  const format = useFormatter()
  const ids = useId()
  const title = useRef<HTMLHeadingElement>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const area = useRef<Area | null>(null)

  // The cropper takes the window's body: the focus comes in with it (WCAG 2.4.3).
  useEffect(() => title.current?.focus(), [])

  async function apply() {
    if (working || !area.current) return
    setWorking(true)
    setError(null)
    const prepared = await cropImage(file, area.current, SIZE[kind])
    if (!prepared.ok) {
      setWorking(false)
      return setError(t(ERRORS[prepared.error]))
    }
    const form = new FormData()
    form.set('kind', kind)
    form.set('file', prepared.blob)
    const result = await uploadProfileImage(form)
    setWorking(false)
    if (!result.ok) {
      const key = result.error.replace(/^communities\.edit\./, '') as 'errors.imageUpload'
      return setError(
        result.error.startsWith('communities.edit.') ? t(key) : t('errors.imageUpload'),
      )
    }
    onApply({ imageUrl: result.data.imageUrl, preview: URL.createObjectURL(prepared.blob) })
  }

  return (
    <section aria-labelledby={`${ids}-title`} className="flex flex-col gap-4">
      <h3
        ref={title}
        id={`${ids}-title`}
        tabIndex={-1}
        className="rounded-sm type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {kind === 'avatar' ? t('cropPhoto') : t('cropBanner')}
      </h3>
      <div className={cn('relative overflow-hidden rounded-lg bg-muted', 'h-64 sm:h-80')}>
        <Cropper
          image={source}
          crop={crop}
          zoom={zoom}
          minZoom={1}
          maxZoom={3}
          aspect={kind === 'avatar' ? 1 : 4}
          cropShape={kind === 'avatar' ? 'round' : 'rect'}
          showGrid={false}
          disableAutomaticStylesInjection
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_, pixels) => (area.current = pixels)}
          cropperProps={{ role: 'group', 'aria-label': t('cropArea') }}
          classes={{
            containerClassName:
              'outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset',
          }}
          mediaProps={{ alt: '' }}
        />
      </div>
      <div className="flex items-center gap-3">
        <label htmlFor={`${ids}-zoom`} className="type-action">
          {t('zoom')}
        </label>
        <input
          id={`${ids}-zoom`}
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          aria-valuetext={format.number(zoom, { style: 'percent' })}
          onChange={(event) => setZoom(Number(event.currentTarget.value))}
          className="h-6 flex-1 accent-primary"
        />
      </div>
      {/* What Apply says while it works, also announced (PP-08). */}
      <p role="status" className="sr-only">
        {working ? t('uploading') : ''}
      </p>
      {error && (
        <p role="alert" className="type-small text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
        >
          {t('back')}
        </button>
        <button
          type="button"
          onClick={() => void apply()}
          aria-disabled={working || undefined}
          className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
        >
          {working ? t('uploading') : t('apply')}
        </button>
      </div>
    </section>
  )
}
