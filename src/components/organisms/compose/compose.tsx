'use client'

import { useLocale } from 'next-intl'
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '@/i18n/routing'
import { Link } from '@/i18n/navigation'
import { submitPath, type SubmitType } from '@/i18n/submit-path'

/** The community a page is about, to preselect it on the page to create a post (PC-06). */
export type ComposeCommunity = {
  id: string
  /** Its slug: "Create" carries it to the page to create a post (specs/submit-page). */
  slug: string
  handle: string
  name: string
  /** The viewer's own channel: shown as "Your profile". */
  own?: boolean
}

type Compose = {
  /** The page's community while the page is open (ComposeScope); null elsewhere. */
  scope: ComposeCommunity | null
  setScope: (community: ComposeCommunity | null) => void
}

// Without a provider (isolated component tests) there is no community.
export const ComposeContext = createContext<Compose>({ scope: null, setScope: () => {} })

/** The community of the page being read: every "Create" takes it along (PC-06). */
export function useCompose() {
  return useContext(ComposeContext)
}

/** Holds the page's community for the "Create" links of the bars and the page. No business. */
export function ComposeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<ComposeCommunity | null>(null)
  const value = useMemo(() => ({ scope, setScope }), [scope])
  return <ComposeContext value={value}>{children}</ComposeContext>
}

/**
 * "Create": a link to the page to create a post (specs/submit-page SU-02), with the page's
 * community and the format to open on. The top bar, the bottom bar, a community's header and the
 * feed's box. `community` names it when the server already knows it (a community's header), so the
 * link is right before the page's scope arrives. The look comes from where it sits.
 */
export function ComposeTrigger({
  type,
  community,
  className,
  children,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  tabIndex,
}: {
  type?: SubmitType
  /** The community's slug; else the page's (ComposeScope). */
  community?: string
  className?: string
  children: ReactNode
  'aria-label'?: string
  /** A twin of another link to the same place: out of the reading order. */
  'aria-hidden'?: boolean
  tabIndex?: number
}) {
  const { scope } = useCompose()
  const locale = useLocale() as Locale
  return (
    <Link
      href={submitPath(locale, { community: community ?? scope?.slug, type })}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      tabIndex={tabIndex}
      className={className}
    >
      {children}
    </Link>
  )
}
