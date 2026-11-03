'use client'

import { EllipsisIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

// The menu and the confirmation come on the first open, fetched ahead when the pointer or the
// focus reaches "⋯": only this button loads with the feed (specs/thesis-detail TD-19).
const loadPopup = () => import('./thesis-menu-popup')
const ThesisMenuPopup = dynamic(() => loadPopup().then((mod) => mod.ThesisMenuPopup), {
  ssr: false,
})

/**
 * "⋯" on a thesis its author can still cancel (specs/thesis-detail TD-12): the card draws it only
 * when the backend says `canCancel`.
 */
export function ThesisMenu({ id, claim }: { id: string; claim: string }) {
  const t = useTranslations('feed.thesis.cancel')
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  // Pressing the trigger while open closes the menu (outside press): the click must not reopen it.
  const wasOpen = useRef(false)

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={t('menu', { claim })}
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerEnter={loadPopup}
        onFocus={loadPopup}
        onPointerDown={() => (wasOpen.current = open)}
        onClick={() => {
          setRequested(true)
          setOpen(!wasOpen.current)
          wasOpen.current = false
        }}
        className="inline-flex size-9 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4.5"
      >
        <EllipsisIcon aria-hidden />
      </button>
      {requested && <ThesisMenuPopup id={id} open={open} onOpenChange={setOpen} anchor={trigger} />}
    </>
  )
}
