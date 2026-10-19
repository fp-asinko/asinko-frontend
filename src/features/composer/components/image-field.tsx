'use client'

import { ImageIcon, LoaderCircleIcon, XIcon } from 'lucide-react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { IMAGE_TYPES, prepareImage } from '@/lib/prepare-image'
import { cn } from '@/lib/utils'
import { uploadPostImageAction } from '../actions/upload-post-image.action'

/** A prepared file (a blob: URL), or an image already uploaded (a draft's, remote: true, its size unknown). */
type Preview = { src: string; width: number; height: number; remote?: boolean }

type State =
  | { status: 'idle' }
  | { status: 'preparing' }
  | { status: 'uploading'; preview: Preview }
  | { status: 'ready'; preview: Preview }
  | { status: 'error'; error: ImageError; file: File | null }

export type ImageError = 'imageType' | 'imageUpload' | 'imageTooLarge' | 'imageUnreadable'

/** Takes a file brought from outside the field: pasted or dropped on the editor (PI-02). */
export type TakeImage = (file: File) => void

/** Over the photo: a solid ring with a gap, visible on any image. */
const ROUND =
  'inline-flex size-11 items-center justify-center rounded-full bg-foreground/70 text-background outline-none hover:bg-foreground/85 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:size-9'

const PREPARE_ERRORS = {
  type: 'imageType',
  unreadable: 'imageUnreadable',
  tooLarge: 'imageTooLarge',
} as const satisfies Record<string, ImageError>

/** Where the focus goes once a step ends, if the person was in the field (WCAG 2.4.3). */
type FocusTarget = 'choose' | 'change' | 'retry'

/**
 * The image of a post (specs/post-image PI-01 to PI-08), as X: choose it (or the camera and the
 * gallery in a phone) or drop it here; it is prepared in the browser (2048px WebP, no metadata)
 * and uploaded at once, with "Uploading…" over its preview. Then ✕ takes it out and Change picks
 * another; a newer one replaces it, also mid-upload. Nothing is deleted from here: the backend's
 * signed upload has no delete (specs/backend-answer-1013 BA-05). The uploaded URL goes up through
 * `onChange`, and
 * `onBusy` holds Publish from the moment a file is taken until it is up.
 */
export function ImageField({
  id,
  onChange,
  onBusy,
  onUnauthenticated,
  takeRef,
  invalid,
  describedBy,
  initialUrl = null,
}: {
  id: string
  /** An image already uploaded: a draft's (specs/drafts-tags DT-03), allowed by the caller. */
  initialUrl?: string | null
  onChange: (imageUrl: string) => void
  onBusy: (busy: boolean) => void
  onUnauthenticated: () => void
  /** Filled with this field's way in, for the editor's paste and drop. */
  takeRef: RefObject<TakeImage | null>
  invalid?: boolean
  describedBy?: string
}) {
  const t = useTranslations('composer')
  const root = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const chooseButton = useRef<HTMLButtonElement>(null)
  const changeButton = useRef<HTMLButtonElement>(null)
  const retryButton = useRef<HTMLButtonElement>(null)
  const pendingFocus = useRef<FocusTarget | null>(null)
  const errorId = useId()
  const [state, setState] = useState<State>(() =>
    initialUrl
      ? { status: 'ready', preview: { src: initialUrl, width: 0, height: 0, remote: true } }
      : { status: 'idle' },
  )
  const [dragging, setDragging] = useState(false)
  // Each file taken is an attempt: only the last one counts.
  const attempt = useRef(0)
  const mounted = useRef(true)

  /** Moves the focus after this step if it was in the field (or nowhere) when the step began. */
  function focusAfter(target: FocusTarget, wasHere: boolean) {
    if (wasHere) pendingFocus.current = target
  }

  async function take(file: File) {
    const current = ++attempt.current
    const active = document.activeElement
    const wasHere = !active || active === document.body || Boolean(root.current?.contains(active))
    onChange('')
    onBusy(true)
    setState({ status: 'preparing' })

    const prepared = await prepareImage(file)
    if (current !== attempt.current) return
    if (!prepared.ok) {
      onBusy(false)
      focusAfter('choose', wasHere)
      setState({ status: 'error', error: PREPARE_ERRORS[prepared.error], file: null })
      return
    }
    const preview = {
      src: URL.createObjectURL(prepared.blob),
      width: prepared.width,
      height: prepared.height,
    }
    setState({ status: 'uploading', preview })
    const form = new FormData()
    form.set('file', prepared.blob, 'image')
    const result = await uploadPostImageAction(form)

    // Replaced by a newer file, or the editor closed: this upload is not wanted anymore.
    if (current !== attempt.current || !mounted.current) return
    onBusy(false)
    if (!result.ok) {
      URL.revokeObjectURL(preview.src)
      if (result.error === 'api.errors.UNAUTHENTICATED') onUnauthenticated()
      focusAfter('retry', wasHere)
      setState({
        status: 'error',
        error:
          result.error === 'composer.errors.imageTooLarge'
            ? 'imageTooLarge'
            : result.error === 'composer.errors.imageType'
              ? 'imageType'
              : 'imageUpload',
        file,
      })
      return
    }
    onChange(result.data.imageUrl)
    focusAfter('change', wasHere)
    setState({ status: 'ready', preview })
  }

  function remove() {
    attempt.current += 1
    onChange('')
    onBusy(false)
    pendingFocus.current = 'choose'
    setState({ status: 'idle' })
  }

  // After each step, the focus goes where the next action is (WCAG 2.4.3).
  useEffect(() => {
    const target = pendingFocus.current
    if (!target) return
    const buttons = { choose: chooseButton, change: changeButton, retry: retryButton }
    const element = buttons[target].current ?? chooseButton.current
    if (!element) return
    pendingFocus.current = null
    element.focus()
  })

  // Pasted or dropped on the editor: taken as if chosen here.
  useEffect(() => {
    takeRef.current = (file) => void take(file)
    return () => {
      takeRef.current = null
    }
  })

  // Closed mid-upload: the upload, when it ends, changes nothing (take reads `mounted`).
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // The preview's object URL lives as long as it shows.
  const preview = state.status === 'uploading' || state.status === 'ready' ? state.preview : null
  useEffect(
    () => () => void (preview && !preview.remote && URL.revokeObjectURL(preview.src)),
    [preview],
  )

  const busy = state.status === 'preparing' || state.status === 'uploading'
  const chooseDescribedBy = [describedBy, state.status === 'error' ? errorId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={root}>
      {/* Hidden behind "Choose image" and "Change": the buttons are what the person uses. */}
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void take(file)
        }}
      />
      <p role="status" className="sr-only">
        {busy ? t('image.uploading') : state.status === 'ready' ? t('image.ready') : ''}
      </p>
      {preview ? (
        <div className="relative overflow-hidden rounded-lg border bg-surface" aria-busy={busy}>
          {preview.remote ? (
            // A draft's, already uploaded: through next/image, as the feed shows it (security.md § 6).
            // Its size is not known: a box of the preview's tallest, the image contained in it.
            <div className="relative h-80">
              <Image
                src={preview.src}
                fill
                sizes="(min-width: 768px) 640px, 100vw"
                alt={t('image.alt')}
                className="animate-fade-in object-contain"
              />
            </div>
          ) : (
            <>
              {/* The prepared image itself (a blob: URL): no request, and it is exactly what goes. Its
                size reserves the room before it decodes. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- a local blob: preview, not a remote image for next/image */}
              <img
                src={preview.src}
                width={preview.width}
                height={preview.height}
                alt={t('image.alt')}
                className="mx-auto aspect-auto max-h-80 w-auto max-w-full animate-fade-in object-contain"
              />
            </>
          )}
          {state.status === 'uploading' ? (
            <div
              aria-hidden
              className="absolute inset-0 flex items-center justify-center gap-2 bg-background/70 type-action"
            >
              <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
              {t('image.uploading')}
            </div>
          ) : (
            <div className="absolute top-2 right-2 flex gap-1.5">
              <button
                ref={changeButton}
                type="button"
                // Its name says what changes, starting with what it shows (WCAG 2.5.3).
                aria-label={t('image.changeLabel')}
                onClick={() => input.current?.click()}
                className={cn(ROUND, 'w-auto px-3.5 type-action md:w-auto')}
              >
                {t('image.change')}
              </button>
              <button
                type="button"
                aria-label={t('image.remove')}
                onClick={remove}
                className={cn(ROUND, 'tap')}
              >
                <XIcon aria-hidden className="size-4" />
              </button>
            </div>
          )}
        </div>
      ) : state.status === 'preparing' ? (
        <div
          aria-hidden
          className="flex min-h-32 w-full items-center justify-center gap-2 rounded-lg border bg-surface type-action text-muted-foreground"
        >
          <LoaderCircleIcon className="size-4 animate-spin motion-reduce:animate-none" />
          {t('image.uploading')}
        </div>
      ) : (
        <button
          ref={chooseButton}
          id={id}
          type="button"
          onClick={() => input.current?.click()}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={() => setDragging(false)}
          aria-describedby={chooseDescribedBy || undefined}
          className={cn(
            'flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-input px-4 text-center type-ui text-muted-foreground outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50',
            invalid && 'border-destructive',
            dragging && 'bg-surface',
          )}
        >
          <ImageIcon aria-hidden className="size-6" />
          <span className="font-semibold text-foreground">{t('image.choose')}</span>
          <span className="type-meta">{t('image.drop')}</span>
        </button>
      )}
      {state.status === 'error' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p id={errorId} role="alert" className="type-meta text-destructive">
            {t(`errors.${state.error}`)}
          </p>
          {state.file && (
            <button
              ref={retryButton}
              type="button"
              onClick={() => state.file && void take(state.file)}
              className="inline-flex h-8 items-center rounded-full bg-muted px-3 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('image.retry')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
