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

// Opening is slower than closing (design-system.md § Movimiento): what was asked for shows calmly.
const OPEN_MS = 200
const CLOSE_MS = 150

/** Not in jsdom (no Web Animations) nor with reduced motion: then the change is instant. */
function canAnimate(element: HTMLElement | null | undefined): element is HTMLElement {
  return (
    typeof element?.animate === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/**
 * Slides an element's height between two measures, its overflow clipped meanwhile: a thread that
 * opens or closes (specs/comment-threads CT-16). Web Animations, because the height goes to and
 * from "auto"; the global reduced-motion rule does not reach them, hence canAnimate.
 */
function slide(element: HTMLElement, from: number, to: number, duration: number) {
  const easing = getComputedStyle(element).getPropertyValue('--ease-out').trim() || 'ease-out'
  return element.animate(
    [
      { height: `${from}px`, overflow: 'clip' },
      { height: `${to}px`, overflow: 'clip' },
    ],
    { duration, easing },
  )
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
  // Closed, but its parts still shown while the thread slides up over them.
  const [closing, setClosing] = useState(false)
  const row = useRef<HTMLDivElement>(null)
  const expand = useRef<HTMLButtonElement>(null)
  const motion = useRef<Animation | null>(null)
  const item = () => row.current?.closest('li')
  // A shared comment inside opens it at once: the page scrolls to it, nothing may move meanwhile.
  useReveal(
    (id) => Boolean(item()?.contains(document.getElementById(id))),
    () => {
      motion.current?.cancel()
      setOpen(true)
      setClosing(false)
    },
  )

  // Closed by the person: the focus goes to ⊕, where the comment can be opened again. Rendered
  // at once (flushSync) and focused within the same event: an effect could run after the tap's
  // last events and leave the focus on nothing. Then the thread slides up to its author's row.
  function collapse() {
    const li = item()
    const from = li?.getBoundingClientRect().height ?? 0
    const animated = canAnimate(li)
    motion.current?.cancel()
    flushSync(() => {
      setOpen(false)
      setClosing(animated)
    })
    expand.current?.focus()
    if (!animated || !row.current) return
    const animation = slide(li, from, row.current.getBoundingClientRect().height, CLOSE_MS)
    animation.onfinish = () => setClosing(false)
    motion.current = animation
  }

  // Slides down from where it is: from the author's row, or midway if it was still closing.
  function reopen() {
    const li = item()
    const from = li?.getBoundingClientRect().height ?? 0
    motion.current?.cancel()
    flushSync(() => {
      setOpen(true)
      setClosing(false)
    })
    if (!canAnimate(li)) return
    motion.current = slide(li, from, li.getBoundingClientRect().height, OPEN_MS)
  }
  const shown = open || closing

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
              onClick={reopen}
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
      <div hidden={!shown} className="thread-body relative ml-(--av)">
        {body}
      </div>
      {replies && (
        <ul
          hidden={!shown}
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
 * covers it. Every comment has it, a reply without replies too (CT-07): there it stands alone,
 * under the avatar's column.
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
      className={`thread-collapse absolute top-1/2 left-[calc(var(--av)/-2_-_0.75rem)] inline-flex -translate-y-1/2 ${ROUND}`}
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
  const self = useRef<HTMLLIElement>(null)
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
    <li ref={self} className="thread-child thread-elbow flex h-(--av) items-center">
      <button
        type="button"
        aria-expanded={false}
        onClick={() => {
          opened.current = true
          // The list grows from its height with the button to its height with the replies.
          const list = self.current?.parentElement
          const from = list?.getBoundingClientRect().height ?? 0
          flushSync(() => setOpen(true))
          if (canAnimate(list)) slide(list, from, list.getBoundingClientRect().height, OPEN_MS)
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
