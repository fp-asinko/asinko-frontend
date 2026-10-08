'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from '@/i18n/navigation'
import { readPreviewTarget, type PreviewTarget } from '@/lib/communities/preview'

/** The pointer rests this long on a link before its card opens (Q4: as Reddit). */
export const OPEN_DELAY = 500
/** The margin to travel from the link to the card (or back) without closing it. */
export const CLOSE_DELAY = 150

// The card, the HoverCard and the action: downloaded the first time a card is wanted (MP-11).
const PreviewPopover = dynamic(
  () => import('./preview-popover').then((mod) => mod.PreviewPopover),
  { ssr: false },
)

type Shown = { anchor: HTMLElement; target: PreviewTarget; path: string }

const linkOf = (node: EventTarget | null) =>
  node instanceof Element ? node.closest<HTMLElement>('[data-preview]') : null
const inCard = (node: EventTarget | null) =>
  node instanceof Element && node.closest('[data-preview-card]') !== null

/**
 * Hover cards for every group, person and asset link of the page (specs/mention-preview § 1, § 4):
 * one listener for the whole document, so the links stay server-rendered. A mouse resting on a
 * `[data-preview]` link, or the keyboard's focus on it (Q1), opens its card after a pause; leaving
 * both the link and the card closes it after a margin; Esc or a click closes it at once. Touch
 * never opens one: a tap goes to the page (MP-02). The card stays while the focus is in it or in a
 * dialog it opened (leaving a group asks first); a focus left on its button goes back to the link.
 */
export function MentionPreviews() {
  const pathname = usePathname()
  const [shown, setShown] = useState<Shown | null>(null)
  const [open, setOpen] = useState(false)
  // Read by the listeners, which live as long as the page.
  const live = useRef({
    link: null as HTMLElement | null,
    open: false,
    openTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    closeTimer: undefined as ReturnType<typeof setTimeout> | undefined,
    pathname,
  })

  useEffect(() => {
    live.current.pathname = pathname
  }, [pathname])

  useEffect(() => {
    const s = live.current

    function setShownOpen(next: boolean) {
      s.open = next
      setOpen(next)
    }
    // A dialog opened from the card (leaving a group, asking for an account) keeps it.
    function held() {
      return document.activeElement?.closest('[role="dialog"], [role="alertdialog"]') != null
    }
    // A button of the card had the focus (it was clicked): back to its link, not lost.
    function returnFocus() {
      if (inCard(document.activeElement)) s.link?.focus({ preventScroll: true })
    }
    function show(link: HTMLElement) {
      clearTimeout(s.closeTimer)
      clearTimeout(s.openTimer)
      if (link === s.link && s.open) return
      s.openTimer = setTimeout(() => {
        const target = readPreviewTarget(link.getAttribute('data-preview'))
        if (!target || !link.isConnected) return
        s.link = link
        setShown({ anchor: link, target, path: s.pathname })
        setShownOpen(true)
      }, OPEN_DELAY)
    }
    function hide() {
      clearTimeout(s.openTimer)
      clearTimeout(s.closeTimer)
      s.closeTimer = setTimeout(() => {
        if (held()) return
        returnFocus()
        s.link = null
        setShownOpen(false)
      }, CLOSE_DELAY)
    }
    function closeNow() {
      clearTimeout(s.openTimer)
      clearTimeout(s.closeTimer)
      returnFocus()
      s.link = null
      setShownOpen(false)
    }

    function pointerover(event: PointerEvent) {
      if (event.pointerType === 'touch') return
      if (inCard(event.target)) return clearTimeout(s.closeTimer)
      const link = linkOf(event.target)
      if (link) show(link)
    }
    function pointerout(event: PointerEvent) {
      if (event.pointerType === 'touch') return
      const from = linkOf(event.target)
      if (!from && !inCard(event.target)) return
      const to = event.relatedTarget
      // Moving inside the link, or between the link and its card.
      if (from && to instanceof Node && from.contains(to)) return
      if (inCard(to) || (s.link && linkOf(to) === s.link)) return
      hide()
    }
    function focusin(event: FocusEvent) {
      if (inCard(event.target)) return clearTimeout(s.closeTimer)
      const link = linkOf(event.target)
      // The keyboard's focus only: a click focuses the link too, and navigates.
      if (link?.matches(':focus-visible')) show(link)
    }
    function focusout(event: FocusEvent) {
      if (!linkOf(event.target) && !inCard(event.target)) return
      const to = event.relatedTarget
      if (inCard(to) || (s.link && linkOf(to) === s.link)) return
      hide()
    }
    function keydown(event: KeyboardEvent) {
      // A dialog opened from the card answers its own Esc.
      if (event.key === 'Escape' && s.open && !held()) closeNow()
    }
    function click(event: MouseEvent) {
      if (linkOf(event.target)) closeNow()
    }

    document.addEventListener('pointerover', pointerover)
    document.addEventListener('pointerout', pointerout)
    document.addEventListener('focusin', focusin)
    document.addEventListener('focusout', focusout)
    document.addEventListener('keydown', keydown)
    document.addEventListener('click', click)
    return () => {
      clearTimeout(s.openTimer)
      clearTimeout(s.closeTimer)
      document.removeEventListener('pointerover', pointerover)
      document.removeEventListener('pointerout', pointerout)
      document.removeEventListener('focusin', focusin)
      document.removeEventListener('focusout', focusout)
      document.removeEventListener('keydown', keydown)
      document.removeEventListener('click', click)
    }
  }, [])

  if (!shown) return null
  return (
    <PreviewPopover
      anchor={shown.anchor}
      target={shown.target}
      // Another page: its links are gone, and so is the card.
      open={open && shown.path === pathname}
      onClose={() => {
        live.current.link = null
        live.current.open = false
        setOpen(false)
      }}
    />
  )
}
