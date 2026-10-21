'use client'

import { EllipsisIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { createContext, use, useRef, useState } from 'react'

/** A post, a poll or a thesis that can be featured on a profile. */
export type FeaturableKind = 'post' | 'poll' | 'thesis'

/**
 * What "⋯" needs to know and do (specs/profile-showcase PS-07), given by whoever owns the
 * featured: whether an item is, whether there is room for one more, and how to change it. This
 * organism only draws; the feature behind it saves.
 */
export type FeaturedMenuState = {
  isFeatured: (kind: FeaturableKind, id: string) => boolean
  full: boolean
  /** How many can be featured. */
  max: number
  pending: boolean
  set: (kind: FeaturableKind, id: string, featured: boolean) => void
}

/** Provided only on your own profile: without it, "⋯" draws nothing. */
export const FeaturedMenuContext = createContext<FeaturedMenuState | null>(null)

// The Base UI menu comes on the first open, fetched ahead when the pointer or the focus reaches
// "⋯" (as the comments' order, seo.md).
const loadMenu = () => import('./featured-menu-popup')
const FeaturedMenuPopup = dynamic(() => loadMenu().then((mod) => mod.FeaturedMenuPopup), {
  ssr: false,
})

/**
 * "⋯" on one of your posts or theses (PS-07): "Feature on your profile" or "Remove from
 * featured". With the maximum featured, featuring says to take one out first. The same cards serve
 * every feed: outside your own profile there is no state, and nothing is drawn.
 */
export function FeatureMenu({
  kind,
  id,
  label,
}: {
  kind: FeaturableKind
  id: string
  label: string
}) {
  const featured = use(FeaturedMenuContext)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  // Pressing the trigger while open closes the menu (outside press): the click must not reopen it.
  const wasOpen = useRef(false)
  if (!featured) return null
  const isFeatured = featured.isFeatured(kind, id)

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerEnter={loadMenu}
        onFocus={loadMenu}
        onPointerDown={() => (wasOpen.current = open)}
        onClick={() => {
          setRequested(true)
          setOpen(!wasOpen.current)
          wasOpen.current = false
        }}
        className="inline-flex size-9 shrink-0 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4.5"
      >
        <EllipsisIcon aria-hidden />
      </button>
      {requested && (
        <FeaturedMenuPopup
          open={open}
          onOpenChange={setOpen}
          anchor={trigger}
          featured={isFeatured}
          full={featured.full}
          max={featured.max}
          disabled={featured.pending}
          onChoose={() => featured.set(kind, id, !isFeatured)}
        />
      )}
    </>
  )
}
