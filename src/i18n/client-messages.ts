import type { AbstractIntlMessages } from 'next-intl'

/**
 * Namespaces the Client Components use (i18n.md § Server y Client Components: the browser gets
 * only what it needs). `client-messages.test.ts` scans every 'use client' file and fails if one
 * uses a namespace missing here.
 */
export const CLIENT_NAMESPACES = [
  'authGate',
  'common',
  'comments',
  'composer',
  'communities.actions',
  'communities.profile',
  'communities.theses.more',
  'devLogin',
  'emoji',
  'errors.unexpected',
  'feed.card',
  'feed.comments',
  'feed.loadMore',
  'feed.poll',
  'feed.vote',
  'join',
  'mentions',
  'postDetail.search',
  'postDetail.sort',
  'preview',
  'rightColumn.recent',
  'share',
] as const

/** The subset of `messages` under CLIENT_NAMESPACES, keeping their nesting. */
export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {}
  for (const namespace of CLIENT_NAMESPACES) {
    const path = namespace.split('.')
    let source: unknown = messages
    let target = picked
    path.forEach((part, index) => {
      source = (source as Record<string, unknown> | undefined)?.[part]
      if (source === undefined) return
      if (index === path.length - 1) target[part] = source as AbstractIntlMessages
      else target = (target[part] ??= {}) as AbstractIntlMessages
    })
  }
  return picked
}
