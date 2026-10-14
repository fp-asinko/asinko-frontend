/** Where a post can go from the share window (specs/share-menu SM-03), in its order. */
export const SHARE_TARGETS = ['x', 'whatsapp', 'telegram', 'email'] as const

export type ShareTarget = (typeof SHARE_TARGETS)[number]

/**
 * Each network's own share page, with the link and the title: no script of theirs is loaded
 * (SM-03). Email opens the mail app.
 */
export function shareTargetUrl(target: ShareTarget, url: string, title: string): string {
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)
  switch (target) {
    case 'x':
      return `https://x.com/intent/post?url=${u}&text=${t}`
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`
    case 'telegram':
      return `https://t.me/share/url?url=${u}&text=${t}`
    case 'email':
      return `mailto:?subject=${t}&body=${u}`
  }
}
