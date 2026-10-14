'use client'

import { CheckIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useRef, useState, type ComponentProps } from 'react'

/** The window comes on first use (specs/share-menu SM-07). */
const loadDialog = () => import('./share-dialog').then((module) => module.ShareDialog)
const ShareDialog = dynamic(loadDialog)

type State = 'idle' | 'copied' | 'failed'

/**
 * Shares a page of the site (specs/comment-threads CT-11): on a phone, the system's share sheet.
 * Elsewhere, a post opens the share window with its image and where to send it (specs/share-menu
 * SM-01); anything else (a comment) goes to the clipboard and the button says so for 2s (announced
 * too). `href` and `post.preview` are paths of the site without the locale (a post's path:
 * /post/1/slug), which get the page's; `href` can also be a fragment of this page (#comment-1). The
 * look comes from where it sits.
 */
export function ShareButton({
  href,
  post,
  children,
  ...props
}: Omit<ComponentProps<'button'>, 'onClick' | 'type'> & {
  href: string
  /** A post: its title and its share image, for the share window. */
  post?: { title: string; preview: string }
}) {
  const t = useTranslations('share')
  const locale = useLocale()
  const [state, setState] = useState<State>('idle')
  const [dialog, setDialog] = useState<{ open: boolean; url: string } | null>(null)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [state])

  const localized = (path: string) => (path.startsWith('/') ? `/${locale}${path}` : path)

  async function share() {
    // Without the query (a sort, a search): the link is to the page, as anyone would open it.
    const base = `${window.location.origin}${window.location.pathname}`
    const url = new URL(localized(href), base).href
    const phone = window.matchMedia('(pointer: coarse)').matches
    if (phone && typeof navigator.share === 'function') {
      // Closing the sheet rejects: nothing to say.
      await navigator.share({ url }).catch(() => {})
      return
    }
    if (post) {
      setDialog({ open: true, url })
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup={post ? 'dialog' : undefined}
        {...props}
        onClick={share}
        onPointerEnter={post ? () => void loadDialog() : undefined}
        onFocus={post ? () => void loadDialog() : undefined}
      >
        {state === 'idle' ? (
          children
        ) : (
          <>
            {state === 'copied' && <CheckIcon aria-hidden className="size-4" />}
            {t(state)}
          </>
        )}
      </button>
      <span role="status" className="sr-only">
        {state === 'idle' ? '' : t(state)}
      </span>
      {post && dialog && (
        <ShareDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog({ ...dialog, open })}
          url={dialog.url}
          title={post.title}
          preview={localized(post.preview)}
          returnFocusTo={button}
        />
      )}
    </>
  )
}
