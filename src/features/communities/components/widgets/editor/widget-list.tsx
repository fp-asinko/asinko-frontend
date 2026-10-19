'use client'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  GripVerticalIcon,
  PinIcon,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import { cn } from '@/lib/utils'
import type { WidgetDraft } from '../../../lib/widget-drafts'

const ICON =
  'inline-flex size-9 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-40 aria-disabled:active:scale-100 [&_svg]:size-4'

/**
 * The widgets in "Edit widgets" (specs/community-widgets CW-08, CW-09): "Community details" pinned
 * first, then each widget with its type, its title and "›" to edit it. They move by dragging the
 * handle (mouse or finger: pointer events, no library) and with "Move up" and "Move down", which
 * work from the keyboard and a screen reader (WCAG 2.5.7); the handle takes the arrows too. Each
 * move is announced. A widget the server refused is marked.
 */
export function WidgetList({
  drafts,
  errors,
  onEdit,
  onMove,
}: {
  drafts: WidgetDraft[]
  /** By draft key: why the server refused it (already translated). */
  errors: Record<string, string>
  onEdit: (key: string) => void
  onMove: (key: string, to: number) => void
}) {
  const t = useTranslations('communities.widgets')
  const rows = useRef(new Map<string, HTMLLIElement>())
  const [dragging, setDragging] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')
  const hintId = useId()
  const name = (draft: WidgetDraft) => draft.title || t(`types.${draft.type}`)
  // A row moved in the DOM may lose the focus (the browser drops it on insertBefore): the control
  // that moved it takes it back once the list is drawn (WCAG 2.4.3).
  const refocus = useRef<string | null>(null)
  useLayoutEffect(() => {
    if (!refocus.current) return
    const control = document.querySelector<HTMLElement>(`[data-control="${refocus.current}"]`)
    refocus.current = null
    if (control && document.activeElement !== control) control.focus()
  }, [drafts])

  /** Moves a widget; `quiet` while dragging: only where it ends is said. */
  function move(draft: WidgetDraft, to: number, control: string, quiet = false) {
    const target = Math.max(0, Math.min(drafts.length - 1, to))
    if (target === drafts.indexOf(draft)) return
    refocus.current = `${draft.key}:${control}`
    onMove(draft.key, target)
    if (!quiet) say(draft, target)
  }

  function say(draft: WidgetDraft, position: number) {
    setAnnounce(
      t('editor.moved', { name: name(draft), position: position + 1, total: drafts.length }),
    )
  }

  /** The row under the pointer: the first whose middle is below it, else the last. */
  function indexAt(y: number) {
    const index = drafts.findIndex((draft) => {
      const box = rows.current.get(draft.key)?.getBoundingClientRect()
      return box ? y < box.top + box.height / 2 : false
    })
    return index === -1 ? drafts.length - 1 : index
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>, draft: WidgetDraft) {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(draft.key)
  }

  function onPointerMove(event: PointerEvent<HTMLButtonElement>, draft: WidgetDraft) {
    if (dragging !== draft.key) return
    const to = indexAt(event.clientY)
    if (to !== drafts.indexOf(draft)) move(draft, to, 'drag', true)
  }

  function onPointerUp(draft: WidgetDraft) {
    if (dragging !== draft.key) return
    setDragging(null)
    say(draft, drafts.indexOf(draft))
  }

  function onHandleKey(event: KeyboardEvent<HTMLButtonElement>, draft: WidgetDraft) {
    const index = drafts.indexOf(draft)
    if (event.key === 'ArrowUp') move(draft, index - 1, 'drag')
    else if (event.key === 'ArrowDown') move(draft, index + 1, 'drag')
    else return
    event.preventDefault()
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        <li className="flex min-h-14 items-center gap-2 rounded-lg border bg-surface px-3 py-2">
          <PinIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1">
            <span className="block type-small font-bold">{t('editor.details')}</span>{' '}
            <span className="block type-meta text-muted-foreground">{t('editor.detailsHint')}</span>
          </span>
        </li>
        {drafts.map((draft, index) => {
          const error = errors[draft.key]
          return (
            <li
              key={draft.key}
              ref={(element) => {
                if (element) rows.current.set(draft.key, element)
                else rows.current.delete(draft.key)
              }}
              data-dragging={dragging === draft.key || undefined}
              className={cn(
                'flex min-h-14 items-center gap-1 rounded-lg border bg-background py-1 pr-1 pl-1 transition-colors data-dragging:border-foreground data-dragging:bg-surface',
                error && 'border-destructive',
              )}
            >
              <button
                type="button"
                aria-label={t('editor.drag', { name: name(draft) })}
                aria-describedby={hintId}
                data-control={`${draft.key}:drag`}
                onPointerDown={(event) => onPointerDown(event, draft)}
                onPointerMove={(event) => onPointerMove(event, draft)}
                onPointerUp={() => onPointerUp(draft)}
                onPointerCancel={() => setDragging(null)}
                onKeyDown={(event) => onHandleKey(event, draft)}
                className={cn(ICON, 'cursor-grab touch-none active:cursor-grabbing')}
              >
                <GripVerticalIcon aria-hidden />
              </button>
              <span className="min-w-0 flex-1">
                <span className="block truncate type-small font-bold">{name(draft)}</span>{' '}
                <span className="block type-meta text-muted-foreground">
                  {t(`types.${draft.type}`)}
                </span>
                {error && <span className="block type-meta text-destructive">{error}</span>}
              </span>
              <button
                type="button"
                aria-label={t('editor.moveUp', { name: name(draft) })}
                aria-disabled={index === 0 || undefined}
                data-control={`${draft.key}:up`}
                onClick={() => move(draft, index - 1, 'up')}
                className={ICON}
              >
                <ArrowUpIcon aria-hidden />
              </button>
              <button
                type="button"
                aria-label={t('editor.moveDown', { name: name(draft) })}
                aria-disabled={index === drafts.length - 1 || undefined}
                data-control={`${draft.key}:down`}
                onClick={() => move(draft, index + 1, 'down')}
                className={ICON}
              >
                <ArrowDownIcon aria-hidden />
              </button>
              <button
                type="button"
                aria-label={t('editor.editOne', { name: name(draft) })}
                data-edit-key={draft.key}
                onClick={() => onEdit(draft.key)}
                className={ICON}
              >
                <ChevronRightIcon aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
      <p role="status" className="sr-only">
        {announce}
      </p>
      {/* What the handle also takes, besides dragging. */}
      <p id={hintId} hidden>
        {t('editor.dragHint')}
      </p>
    </>
  )
}
