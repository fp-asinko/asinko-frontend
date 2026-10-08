'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import type { ComposeSession } from './composer-root'
import { DiscardDialog } from './discard-dialog'
import { PostEditor } from './post-editor'

/**
 * The editor expanded inside the page's composer box, as X (specs/post-create-detail PC-03,
 * PC-05): it fades in, takes the focus, and closes with Cancel or Esc, asking first if something
 * is written. Closing, it folds back into the closed box before giving it its place. Published, it
 * closes and opens the new post's page.
 */
export function InlineComposer({
  session,
  onShown,
  onClose,
}: {
  session: ComposeSession
  /** Drawn: the box swaps its prompt for this in the same frame, never empty in between. */
  onShown: () => void
  onClose: () => void
}) {
  const t = useTranslations('composer')
  const router = useRouter()
  const titleId = useId()
  const root = useRef<HTMLElement>(null)
  const draftRef = useRef<(() => boolean) | null>(null)
  const [confirming, setConfirming] = useState(false)
  const leaving = useRef(false)

  /**
   * Folds back to the closed box's height (43px) while fading, then closes: no jump when the
   * prompt comes back (specs/home-motion: closing in 150ms, ease-out). With reduced motion the
   * global rule ends the transition at once.
   */
  function leave() {
    const section = root.current
    if (!section || leaving.current) return
    leaving.current = true
    let done = false
    const finish = () => {
      if (done) return
      done = true
      onClose()
    }
    section.style.height = `${section.offsetHeight}px`
    // Cut only at the bottom: the fields reach 52px to the left, under the avatar.
    section.style.clipPath = 'inset(0 0 0 -3.25rem)'
    void section.offsetHeight
    section.style.transition = 'height 150ms var(--ease-out), opacity 150ms var(--ease-out)'
    section.style.height = '2.6875rem'
    section.style.opacity = '0'
    section.addEventListener('transitionend', finish, { once: true })
    // In case no transition runs (reduced motion, a hidden tab).
    setTimeout(finish, 200)
  }

  function requestClose() {
    if (draftRef.current?.()) setConfirming(true)
    else leave()
  }
  // Esc closes, as Cancel. A list or a dialog inside handles its own Esc first. Handled here, it
  // goes no further: the confirmation opens within this same event, and the Esc reaching the
  // document would close it at once.
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    event.stopPropagation()
    requestClose()
  })

  // Before paint: the prompt hides and the editor shows in the same frame.
  const shown = useEffectEvent(onShown)
  useLayoutEffect(() => shown(), [])

  useEffect(() => {
    const section = root.current
    // Into the form, on the first thing to fill: the community, or the title when it comes chosen.
    section?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const listener = (event: KeyboardEvent) => onKeyDown(event)
    section?.addEventListener('keydown', listener)
    return () => section?.removeEventListener('keydown', listener)
  }, [])

  return (
    <section ref={root} aria-labelledby={titleId} className="animate-fade-in">
      <h2 id={titleId} className="sr-only">
        {t('title')}
      </h2>
      <PostEditor
        variant="inline"
        type={session.type}
        community={
          session.community && { ...session.community, own: Boolean(session.community.own) }
        }
        draftRef={draftRef}
        onCancel={requestClose}
        onPublished={(path) => {
          onClose()
          router.push(path)
        }}
      />
      <DiscardDialog
        open={confirming}
        onOpenChange={setConfirming}
        onDiscard={() => {
          setConfirming(false)
          leave()
        }}
      />
    </section>
  )
}
