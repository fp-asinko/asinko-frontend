'use client'

import { useLocale } from 'next-intl'
import type { ComponentProps, MouseEvent } from 'react'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

/** What keeps its own click inside a card: its buttons, links, fields and the comments preview. */
const OWN_CLICK =
  'a, button, input, textarea, select, summary, label, [role="button"], [role="menuitem"], [data-card-own-click]'

/**
 * A post card that opens its post anywhere on it, as Reddit's (PO, 2026-10-09), besides its
 * title, which stays the link for the keyboard and screen readers. A click on its votes,
 * comments, Share, Join, links or mentions does what it always did; selecting text does not
 * navigate; Ctrl or Cmd click opens it in another tab. A click inside a dialog that opened from
 * the card (a portal) is not the card's. The post's page is prefetched on hover.
 */
export function CardLink({
  href,
  className,
  children,
  ...props
}: ComponentProps<'article'> & { href: string }) {
  const router = useRouter()
  const locale = useLocale()

  function open(event: MouseEvent<HTMLElement>) {
    const target = event.target as Element
    if (event.defaultPrevented || event.button !== 0) return
    // Not in the card's own DOM (a portaled dialog), or something with a click of its own.
    if (!event.currentTarget.contains(target) || target.closest(OWN_CLICK)) return
    if (window.getSelection()?.toString()) return
    if (event.metaKey || event.ctrlKey) {
      window.open(`/${locale}${href}`, '_blank', 'noopener')
      return
    }
    router.push(href)
  }

  return (
    // A redundant mouse shortcut: the title is the card's link for the keyboard and screen readers.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- the title link is the keyboard way
    <article
      {...props}
      onClick={open}
      onPointerEnter={() => router.prefetch(href)}
      className={cn('cursor-pointer', className)}
    >
      {children}
    </article>
  )
}
