'use client'

import { CameraIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { IMAGE_TYPES } from '@/lib/prepare-image'

/** The cropper (and its library) comes when a photo is picked (seo.md). */
const PhotoCropper = dynamic(
  () => import('./photo-cropper').then((module) => module.PhotoCropper),
  {
    // Its place while it comes, the cropper's height: the modal does not jump.
    loading: () => <Skeleton className="h-82 rounded-lg sm:h-98" />,
  },
)

/**
 * The optional photo of the welcome screen (specs/auth AU-21): chosen from the device, framed by
 * hand as in "Edit profile" and shown round before continuing. It can be changed or removed.
 */
export function AvatarPicker({ onChange }: { onChange: (photo: Blob | null) => void }) {
  const t = useTranslations('auth.photo')
  const tErrors = useTranslations('auth.errors')
  const input = useRef<HTMLInputElement>(null)
  const hintId = useId()
  const [preview, setPreview] = useState<string | null>(null)
  const [framing, setFraming] = useState<{ file: File; source: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])
  useEffect(() => () => void (framing && URL.revokeObjectURL(framing.source)), [framing])

  function pick(file: File | undefined) {
    if (input.current) input.current.value = ''
    if (!file) return
    setError(null)
    if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setError(tErrors('photoType'))
      return
    }
    setFraming({ file, source: URL.createObjectURL(file) })
  }

  function apply(photo: Blob) {
    setPreview(URL.createObjectURL(photo))
    setFraming(null)
    onChange(photo)
  }

  function remove() {
    setPreview(null)
    onChange(null)
  }

  return (
    <>
      {framing && (
        <PhotoCropper
          file={framing.file}
          source={framing.source}
          onApply={apply}
          onBack={() => setFraming(null)}
        />
      )}
      <div hidden={framing !== null} className="flex items-center gap-4">
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
          onChange={(event) => pick(event.target.files?.[0])}
        />
      </div>
    </>
  )
}
