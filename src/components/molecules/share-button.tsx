'use client'

import { CheckIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useState, type ComponentProps } from 'react'

type State = 'idle' | 'copied' | 'failed'

/**
 * Shares a page of the site (specs/comment-threads CT-11): on a phone, the system's share sheet;
 * elsewhere, the link goes to the clipboard and the button says so for 2s (announced too). `href`
 * is a path of the site without the locale (a post's path: /post/1/slug), which gets the page's,
 * or a fragment of this page (#comment-1). The look comes from where it sits.
 */
export function ShareButton({
  href,
  children,
  ...props
}: Omit<ComponentProps<'button'>, 'onClick' | 'type'> & { href: string }) {
  const t = useTranslations('share')
  const locale = useLocale()
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [state])

  async function share() {
    // Without the query (a sort, a search): the link is to the page, as anyone would open it.
    const base = `${window.location.origin}${window.location.pathname}`
    const url = new URL(href.startsWith('/') ? `/${locale}${href}` : href, base).href
    const phone = window.matchMedia('(pointer: coarse)').matches
    if (phone && typeof navigator.share === 'function') {
      // Closing the sheet rejects: nothing to say.
      await navigator.share({ url }).catch(() => {})
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
      <button type="button" {...props} onClick={share}>
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
    </>
  )
}
