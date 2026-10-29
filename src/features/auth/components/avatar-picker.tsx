'use client'

import { CameraIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { cropImage, IMAGE_TYPES } from '@/lib/prepare-image'

const PHOTO_SIZE = { width: 400, height: 400 }

/** The centered square of an image: what an avatar shows without framing it by hand. */
async function centerSquare(file: File) {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    return { ok: false as const, error: 'unreadable' as const }
  }
  const side = Math.min(bitmap.width, bitmap.height)
  const area = {
    x: (bitmap.width - side) / 2,
    y: (bitmap.height - side) / 2,
    width: side,
    height: side,
  }
  bitmap.close()
  return cropImage(file, area, PHOTO_SIZE)
}

/**
 * The optional photo of the welcome screen (specs/auth AU-21): chosen from the device, cut to its
 * centered square and prepared as in "Edit profile" (400×400, WebP, no EXIF), shown round before
 * continuing. It can be changed or removed; framing it by hand stays in "Edit profile".
 */
export function AvatarPicker({ onChange }: { onChange: (photo: Blob | null) => void }) {
  const t = useTranslations('auth.photo')
  const tErrors = useTranslations('auth.errors')
  const input = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])

  async function pick(file: File | undefined) {
    if (!file) return
    setError(null)
    const prepared = await centerSquare(file)
    if (!prepared.ok) {
      setError(tErrors(prepared.error === 'tooLarge' ? 'photoTooLarge' : 'photoType'))
      return
    }
    setPreview(URL.createObjectURL(prepared.blob))
    onChange(prepared.blob)
  }

  function remove() {
    setPreview(null)
    onChange(null)
    if (input.current) input.current.value = ''
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        aria-label={preview ? t('change') : t('add')}
        aria-describedby={hintId}
        className="relative flex size-18 shrink-0 tap items-center justify-center overflow-hidden rounded-full border border-dashed border-border-strong bg-surface text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {preview ? (
          // A local blob of the chosen photo: next/image does not take it.
          // eslint-disable-next-line @next/next/no-img-element -- see above
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <CameraIcon aria-hidden className="size-6" />
        )}
      </button>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="type-action">{t('label')}</p>
        <p id={hintId} className="type-meta text-muted-foreground">
          {t('hint')}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="min-h-6 type-meta font-semibold underline underline-offset-2"
          >
            {preview ? t('change') : t('add')}
          </button>
          {preview && (
            <button
              type="button"
              onClick={remove}
              className="min-h-6 type-meta font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {t('remove')}
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="type-meta text-destructive">
            {error}
          </p>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        hidden
        onChange={(event) => void pick(event.target.files?.[0])}
      />
    </div>
  )
}
