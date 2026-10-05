'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Joined = {
  has: (slug: string) => boolean
  mark: (slug: string) => void
  unmark: (slug: string) => void
}

// Without a provider (isolated component tests) nothing is ever marked as joined.
const JoinedContext = createContext<Joined>({ has: () => false, mark: () => {}, unmark: () => {} })

/**
 * Communities joined during this visit (specs/community-first § 3.2): every join button of a
 * community hides at once, in the feed and the column. Mounted in the layout, so it survives
 * router.refresh(); a reload starts empty and the server data takes over.
 */
export function JoinedProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<ReadonlySet<string>>(new Set())

  const mark = useCallback((slug: string) => setSlugs((last) => new Set(last).add(slug)), [])
  const unmark = useCallback(
    (slug: string) =>
      setSlugs((last) => {
        const next = new Set(last)
        next.delete(slug)
        return next
      }),
    [],
  )
  const value = useMemo<Joined>(
    () => ({ has: (slug) => slugs.has(slug), mark, unmark }),
    [slugs, mark, unmark],
  )

  return <JoinedContext.Provider value={value}>{children}</JoinedContext.Provider>
}

export function useJoined() {
  return useContext(JoinedContext)
}

/** Hides its content once the community is joined: a suggestion row in the column (CF-10). */
export function HideWhenJoined({ slug, children }: { slug: string; children: ReactNode }) {
  return useJoined().has(slug) ? null : children
}
