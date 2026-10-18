'use client'

import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  TextQuoteIcon,
  type LucideIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState, type KeyboardEvent, type RefObject } from 'react'
import { insertText } from '@/lib/insert-text'
import { formatMarkdown, type FormatKind } from '@/lib/markdown-format'
import { cn } from '@/lib/utils'

const BUTTONS: ReadonlyArray<{ kind: FormatKind; icon: LucideIcon; key?: 'B' | 'I' | 'K' }> = [
  { kind: 'bold', icon: BoldIcon, key: 'B' },
  { kind: 'italic', icon: ItalicIcon, key: 'I' },
  { kind: 'link', icon: LinkIcon, key: 'K' },
  { kind: 'list', icon: ListIcon },
  { kind: 'quote', icon: TextQuoteIcon },
  { kind: 'code', icon: CodeIcon },
]

const SHORTCUTS: Record<string, FormatKind> = { b: 'bold', i: 'italic', k: 'link' }

/**
 * Writes a format into a field as if typed (specs/submit-tools ST-04, ST-05): through the
 * browser's own insertText, so Ctrl/⌘ + Z undoes it; where it is missing, as the emojis do
 * (insertText of lib, outside the undo history). Leaves chosen what formatMarkdown says.
 */
export function applyFormat(field: HTMLTextAreaElement, kind: FormatKind) {
  const edit = formatMarkdown(field.value, field.selectionStart, field.selectionEnd, kind)
  field.focus()
  field.setSelectionRange(edit.start, edit.end)
  const typed = document.execCommand?.('insertText', false, edit.text) ?? false
  if (!typed) insertText(field, edit.text, { start: edit.start, end: edit.end })
  field.setSelectionRange(...edit.select)
}

/** Ctrl/⌘ + B, I or K in the field (ST-05): the format it asks for, else null. */
export function formatShortcut(event: KeyboardEvent<HTMLTextAreaElement>): FormatKind | null {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey) return null
  return SHORTCUTS[event.key.toLowerCase()] ?? null
}

/**
 * The Markdown toolbar of the post body, as Reddit's (specs/submit-tools ST-04 to ST-06): bold,
 * italic, link, list, quote and code. A WAI-ARIA toolbar: one Tab stop, the arrows, Home and End
 * move along it. A press keeps the field's selection (no focus on mouse down) and formats it.
 */
export function FormatToolbar({
  fieldRef,
  className,
}: {
  fieldRef: RefObject<HTMLTextAreaElement | null>
  className?: string
}) {
  const t = useTranslations('composer.format')
  const [active, setActive] = useState(0)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function move(event: KeyboardEvent<HTMLDivElement>) {
    const last = BUTTONS.length - 1
    const next =
      event.key === 'ArrowRight'
        ? active === last
          ? 0
          : active + 1
        : event.key === 'ArrowLeft'
          ? active === 0
            ? last
            : active - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null) return
    event.preventDefault()
    setActive(next)
    buttons.current[next]?.focus()
  }

  return (
    <div
      role="toolbar"
      aria-label={t('label')}
      aria-orientation="horizontal"
      onKeyDown={move}
      className={cn('flex items-center gap-0.5', className)}
    >
      {BUTTONS.map(({ kind, icon: Icon, key }, index) => (
        <button
          key={kind}
          ref={(element) => {
            buttons.current[index] = element
          }}
          type="button"
          tabIndex={index === active ? 0 : -1}
          aria-label={t(kind)}
          // Said once, by the shortcut's own attribute; Control works on every system (⌘ too on
          // a Mac, but Meta is the Windows key elsewhere, which the browser never gets).
          aria-keyshortcuts={key ? `Control+${key}` : undefined}
          title={key ? t('withShortcut', { name: t(kind), key }) : t(kind)}
          // The field keeps its selection: the press does not take the focus first.
          onMouseDown={(event) => event.preventDefault()}
          onFocus={() => setActive(index)}
          onClick={() => fieldRef.current && applyFormat(fieldRef.current, kind)}
          className="inline-flex size-8 tap items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
        >
          <Icon aria-hidden />
        </button>
      ))}
    </div>
  )
}
