'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import type { Area } from 'react-easy-crop'
import { CropFrame } from '@/components/molecules/crop-frame'
import { cropImage } from '@/lib/prepare-image'
import { cn } from '@/lib/utils'

const PHOTO_SIZE = { width: 400, height: 400 }

const PILL =
  'inline-flex h-11 tap items-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

/**
 * Frames the welcome photo in a round `CropFrame` (specs/auth AU-21), as in "Edit profile". Apply
 * cuts that part and prepares it (400×400, WebP, no EXIF) without uploading it: the form uploads it
 * after creating the profile. Back keeps the photo there was.
 */
export function PhotoCropper({
  file,
  source,
  onApply,
  onBack,
}: {
  file: File
  /** The file as a URL to show (its owner revokes it). */
  source: string
  onApply: (photo: Blob) => void
  onBack: () => void
}) {
  const t = useTranslations('auth')
  const ids = useId()
  const title = useRef<HTMLHeadingElement>(null)
  const area = useRef<Area | null>(null)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // The cropper takes the picker's place: the focus comes in with it (WCAG 2.4.3).
  useEffect(() => title.current?.focus(), [])

  async function apply() {
    if (working || !area.current) return
    setWorking(true)
    setError(null)
    const prepared = await cropImage(file, area.current, PHOTO_SIZE)
    setWorking(false)
    if (prepared.ok) return onApply(prepared.blob)
    setError(t(prepared.error === 'tooLarge' ? 'errors.photoTooLarge' : 'errors.photoType'))
  }

  return (
    <section aria-labelledby={`${ids}-title`} data-framing className="flex flex-col gap-3">
      <h3
        ref={title}
        id={`${ids}-title`}
        tabIndex={-1}
        className="rounded-sm type-action outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {t('photo.crop')}
      </h3>
      <CropFrame
        source={source}
        aspect={1}
        round
        areaLabel={t('photo.cropArea')}
        zoomLabel={t('photo.zoom')}
        onAreaChange={(pixels) => (area.current = pixels)}
      />
      {error && (
        <p role="alert" className="type-meta text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onBack}
          className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
        >
          {t('photo.back')}
        </button>
        <button
          type="button"
          onClick={() => void apply()}
          aria-disabled={working || undefined}
          className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
        >
          {t('photo.apply')}
        </button>
      </div>
    </section>
  )
}
