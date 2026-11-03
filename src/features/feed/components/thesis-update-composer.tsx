'use client'

import { PenLineIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState, type RefObject } from 'react'

// The form comes on the first open, fetched ahead when the pointer or the focus reaches the button:
// only its author sees it, and the page keeps its JavaScript budget (specs/thesis-arguments TA-14).
const loadForm = () => import('./thesis-update-form')
const ThesisUpdateForm = dynamic(() => loadForm().then((mod) => mod.ThesisUpdateForm), {
  ssr: false,
})

/**
 * "Post an update" for the author of an open thesis (TA-10): a pill that opens the form in place.
 * Closing it gives the focus back to the pill.
 */
export function ThesisUpdateComposer({ thesisId }: { thesisId: string }) {
  const t = useTranslations('feed.thesis.updates')
  const [open, setOpen] = useState(false)
  // Read by screen readers once posted: the form closes and the update shows above (TA-10).
  const [announcement, setAnnouncement] = useState('')
  const button = useRef<HTMLButtonElement>(null)

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {open ? (
        <ThesisUpdateForm
          thesisId={thesisId}
          onClose={(posted) => {
            setOpen(false)
            setAnnouncement(posted ? t('posted') : '')
            requestAnimationFrame(() => button.current?.focus())
          }}
        />
      ) : (
        <Pill button={button} onOpen={() => setOpen(true)} label={t('open')} />
      )}
    </>
  )
}

function Pill({
  button,
  onOpen,
  label,
}: {
  button: RefObject<HTMLButtonElement | null>
  onOpen: () => void
  label: string
}) {
  return (
    <button
      ref={button}
      type="button"
      onPointerEnter={loadForm}
      onFocus={loadForm}
      onClick={onOpen}
      className="inline-flex h-11 w-fit tap items-center gap-2 rounded-full bg-muted px-4 type-action text-foreground outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
    >
      <PenLineIcon aria-hidden />
      {label}
    </button>
  )
}
