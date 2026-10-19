'use client'

import { XIcon } from 'lucide-react'
import { createContext, use, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { CHECKLIST_EVENT, writeChecklistHidden } from '../lib/checklist-cookie'

const HideContext = createContext<(() => void) | null>(null)

/**
 * "Complete your profile" that hides in place (specs/profile-showcase PS-13): hidden, a line with
 * Undo stays where it was, and takes the focus; Undo brings the card and the focus back to its ✕.
 * The cookie is the browser's: the next visit comes without the card, and the line goes with it.
 */
export function HideableChecklist({
  hiddenText,
  undoLabel,
  children,
}: {
  hiddenText: string
  undoLabel: string
  children: ReactNode
}) {
  const textId = useId()
  const [hidden, setHidden] = useState(false)
  // Only after the person's own action: the first render moves no focus.
  const moved = useRef(false)
  const undoRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // Shown again from "Edit profile" (PS-14): the line gives way to the card, the focus stays there.
  useEffect(() => {
    function follow(event: Event) {
      if ((event as CustomEvent<boolean>).detail) return
      moved.current = false
      setHidden(false)
    }
    window.addEventListener(CHECKLIST_EVENT, follow)
    return () => window.removeEventListener(CHECKLIST_EVENT, follow)
  }, [])

  useEffect(() => {
    if (!moved.current) return
    if (hidden) undoRef.current?.focus()
    else cardRef.current?.querySelector<HTMLElement>('[data-checklist-hide]')?.focus()
  }, [hidden])

  function toggle(next: boolean) {
    // The cookie first: its event (for a card shown from "Edit profile") moves no focus.
    writeChecklistHidden(next)
    moved.current = true
    setHidden(next)
  }

  if (hidden) {
    return (
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-0">
        {/* No live region: the focus lands on Undo, which reads the line as its description. */}
        <p id={textId} className="type-small text-muted-foreground">
          {hiddenText}
        </p>
        <button
          ref={undoRef}
          type="button"
          aria-describedby={textId}
          onClick={() => toggle(false)}
          className="inline-flex h-11 shrink-0 tap items-center rounded-full bg-muted px-4 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9"
        >
          {undoLabel}
        </button>
      </div>
    )
  }
  return (
    <HideContext value={() => toggle(true)}>
      <div ref={cardRef} className="contents">
        {children}
      </div>
    </HideContext>
  )
}

/** The card's ✕ (PS-03): hides it in this browser. */
export function HideChecklistButton({ label }: { label: string }) {
  const hide = use(HideContext)
  if (!hide) throw new Error('Inside HideableChecklist only')
  return (
    <button
      type="button"
      data-checklist-hide
      aria-label={label}
      onClick={hide}
      className="-mt-1.5 -mr-1.5 inline-flex size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <XIcon aria-hidden className="size-4.5" />
    </button>
  )
}
