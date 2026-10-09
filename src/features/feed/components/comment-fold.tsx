'use client'

import { CircleMinusIcon, CirclePlusIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { flushSync } from 'react-dom'
import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/** Sent by CommentAnchor with the shared comment's element id: its closed threads open. */
export const REVEAL_EVENT = 'comment:reveal'

const FoldContext = createContext<{ collapse: () => void; handle: string }>({
  collapse: () => {},
  handle: '',
})

/** Opens when the comment being revealed (its element id) is one of `holds`. */
function useReveal(holds: (id: string) => boolean, open: () => void) {
  const onReveal = useEffectEvent((event: Event) => {
    if (holds((event as CustomEvent<string>).detail)) open()
  })
  useEffect(() => {
    const listener = (event: Event) => onReveal(event)
    window.addEventListener(REVEAL_EVENT, listener)
    return () => window.removeEventListener(REVEAL_EVENT, listener)
  }, [])
}

const ROUND =
  'z-2 size-6 items-center justify-center rounded-full bg-background text-foreground outline-none hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4'

/**
 * A comment that closes as Reddit's (specs/comment-threads CT-06, CT-09): ⊖ on its line or a
 * click on the line's strip hides its body, actions and replies, and ⊕ takes the avatar's place to
 * open it again. The parts come rendered from the server (the Markdown stays there); closed, they
 * stay in the page `hidden`, so a draft reply or a shared comment inside is not lost. No wrapper:
 * the parts are the `<li>`'s own children, as the wiring's selectors expect.
 */
export function CommentFold({
  handle,
  avatar,
  meta,
  body,
  replies,
}: {
  /** Whose comment: the buttons' names ("Collapse @maria's comment"). */
  handle: string
  avatar: ReactNode
  meta: ReactNode
  body: ReactNode
  /** The replies' `<li>`s (with the comments being sent), or nothing. */
  replies?: ReactNode
}) {
  const t = useTranslations('comments')
  const [open, setOpen] = useState(true)
  const row = useRef<HTMLDivElement>(null)
  const expand = useRef<HTMLButtonElement>(null)
  useReveal(
    (id) => Boolean(row.current?.closest('li')?.contains(document.getElementById(id))),
    () => setOpen(true),
  )

  // Closed by the person: the focus goes to ⊕, where the comment can be opened again. Rendered
  // at once (flushSync) and focused within the same event: an effect could run after the tap's
  // last events and leave the focus on nothing.
  function collapse() {
    flushSync(() => setOpen(false))
    expand.current?.focus()
  }

  return (
    <FoldContext value={{ collapse, handle }}>
      <div ref={row} className="flex min-h-(--av) items-center gap-2">
        <span className="flex size-(--av) shrink-0 items-center justify-center">
          {open ? (
            avatar
          ) : (
            <button
              ref={expand}
              type="button"
              aria-expanded={false}
              aria-label={t('expand', { handle })}
              onClick={() => setOpen(true)}
              className={`inline-flex ${ROUND}`}
            >
              <CirclePlusIcon aria-hidden />
            </button>
          )}
        </span>
        {meta}
      </div>
      {open && (
        // The strip over the line: a click closes the thread, as Reddit. The keyboard has ⊖.
        <div
          aria-hidden
          onClick={collapse}
          className="thread-strip absolute top-[calc(var(--av)+0.25rem)] bottom-0 left-0 z-1 w-(--av) cursor-pointer"
        />
      )}
      <div hidden={!open} className="thread-body relative ml-(--av)">
        {body}
      </div>
      {replies && (
        <ul
          hidden={!open}
          className="thread-children mt-1 ml-(--av) flex flex-col gap-1 empty:hidden"
        >
          {replies}
        </ul>
      )}
    </FoldContext>
  )
}

/**
 * ⊖ on the line, in the actions row (CT-06): centered on the line, over a white circle that
 * covers it. Shown only when the comment has replies (the wiring's CSS).
 */
export function CollapseButton() {
  const t = useTranslations('comments')
  const { collapse, handle } = useContext(FoldContext)
  return (
    <button
      type="button"
      aria-expanded
      aria-label={t('collapse', { handle })}
      onClick={collapse}
      className={`thread-collapse absolute top-1/2 left-[calc(var(--av)/-2_-_0.75rem)] -translate-y-1/2 ${ROUND}`}
    >
      <CircleMinusIcon aria-hidden />
    </button>
  )
}

/**
 * The replies folded from level 4 (PC-14) as Reddit's "⊕ 3 more replies" (CT-08): a reply's row,
 * with its elbow, that gives its place to the replies. The focus goes to the first one. Folded, the
 * replies are not in the page: `ids` (theirs and their replies') says when a shared one is inside.
 */
export function RepliesFold({
  label,
  ids,
  children,
}: {
  label: string
  /** The element ids of every comment inside, the first one first. */
  ids: string[]
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const opened = useRef(false)
  useReveal(
    (id) => ids.includes(id),
    () => setOpen(true),
  )
  const first = ids[0]
  useEffect(() => {
    if (open && opened.current && first) document.getElementById(first)?.focus()
  }, [open, first])

  if (open) return children
  return (
    <li className="thread-child thread-elbow flex h-(--av) items-center">
      <button
        type="button"
        aria-expanded={false}
        onClick={() => {
          opened.current = true
          setOpen(true)
        }}
        className="ml-[calc((var(--av)-1.5rem)/2)] inline-flex h-6 items-center gap-2 rounded-full pr-2 type-meta font-semibold text-foreground outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-background">
          <CirclePlusIcon aria-hidden className="size-4" />
        </span>
        {label}
      </button>
    </li>
  )
}
