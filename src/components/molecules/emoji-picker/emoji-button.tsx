'use client'

import { SmilePlusIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState, type RefObject } from 'react'
import { insertText, type TextField } from '@/lib/insert-text'
import { cn } from '@/lib/utils'
import { rememberEmoji } from './recent-emojis'

// The panel, the list and the names: downloaded the first time they are wanted, ahead when the
// pointer or the focus reaches the button, so the tap opens it at once (EP-10, seo.md).
const loadPanel = () => import('./emoji-panel')
const EmojiPanel = dynamic(() => loadPanel().then((mod) => mod.EmojiPanel), { ssr: false })

/**
 * "Add emoji" for a text field (specs/emoji-picker § 1): opens the panel, and the emoji picked goes
 * where the caret was (or over the selection), the focus back in the field right after it.
 */
export function EmojiButton({
  fieldRef,
  className,
}: {
  /** Where the emoji goes: a body, or whichever field the editor last used (title or body). */
  fieldRef: RefObject<TextField | null>
  className?: string
}) {
  const t = useTranslations('emoji')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  // Pressing the button while open closes the panel (outside press): the click must not reopen it.
  const wasOpen = useRef(false)

  function pick(emoji: string) {
    const field = fieldRef.current
    setOpen(false)
    if (!field) return
    insertText(field, emoji)
    rememberEmoji(emoji)
    field.focus()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t('button')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={loadPanel}
        onFocus={loadPanel}
        onPointerDown={() => (wasOpen.current = open)}
        onClick={() => {
          setRequested(true)
          setOpen(!wasOpen.current)
          wasOpen.current = false
        }}
        className={cn(
          'inline-flex size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
          className,
        )}
      >
        <SmilePlusIcon aria-hidden className="size-4.5" />
      </button>
      {requested && (
        <EmojiPanel
          anchor={triggerRef}
          field={fieldRef}
          open={open}
          onOpenChange={setOpen}
          onPick={pick}
        />
      )}
    </>
  )
}
