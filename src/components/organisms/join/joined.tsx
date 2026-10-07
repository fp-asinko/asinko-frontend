'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type Joined = {
  /** Joined during this visit. */
  has: (slug: string) => boolean
  /** Left during this visit (specs/community-pages CP-05). */
  hasLeft: (slug: string) => boolean
  mark: (slug: string) => void
  markLeft: (slug: string) => void
  /** Forgets what this visit did to the community: the server data rules again (a rollback). */
  unmark: (slug: string) => void
}

// Without a provider (isolated component tests) nothing is ever marked.
const JoinedContext = createContext<Joined>({
  has: () => false,
  hasLeft: () => false,
  mark: () => {},
  markLeft: () => {},
  unmark: () => {},
})

/**
 * Communities joined or left during this visit (specs/community-first § 3.2, community-pages
 * § 4): every join button of a community hides at once, in the feed, the column and the page
 * header, and leaving brings them back. Mounted in the layout, so it survives router.refresh(); a
 * reload starts empty and the server data takes over.
 */
export function JoinedProvider({ children }: { children: ReactNode }) {
  // true: joined, false: left. A community not in the map follows the server data.
  const [state, setState] = useState<ReadonlyMap<string, boolean>>(new Map())

  const set = useCallback(
    (slug: string, joined: boolean | null) =>
      setState((last) => {
        const next = new Map(last)
        if (joined === null) next.delete(slug)
        else next.set(slug, joined)
        return next
      }),
    [],
  )
  const value = useMemo<Joined>(
    () => ({
      has: (slug) => state.get(slug) === true,
      hasLeft: (slug) => state.get(slug) === false,
      mark: (slug) => set(slug, true),
      markLeft: (slug) => set(slug, false),
      unmark: (slug) => set(slug, null),
    }),
    [state, set],
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
