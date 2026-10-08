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
 * is written. Published, it closes and opens the new post's page.
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

  function requestClose() {
    if (draftRef.current?.()) setConfirming(true)
    else onClose()
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
          onClose()
        }}
      />
    </section>
  )
}
