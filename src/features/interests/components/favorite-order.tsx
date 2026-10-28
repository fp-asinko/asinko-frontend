'use client'

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** How long a row takes to slide to its new place (≤ 300ms, design-system.md § Movimiento). */
const SLIDE_MS = 250
/** --ease-out of globals.css: the Web Animations API does not read CSS variables. */
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)'

type Row = { slug: string; favorite: boolean; node: ReactNode }

/** A star tells its list it changed, at the tap and again if it failed (specs/favorites FV-06). */
const FavoriteOrderContext = createContext<((slug: string, favorite: boolean) => void) | null>(null)

export function useFavoriteOrder() {
  return useContext(FavoriteOrderContext)
}

/**
 * The rows of a "Your interests" list, favorites first, reordered at once when a star changes and
 * each row sliding to its new place (specs/favorites FV-06, PO 2026-10-28): FLIP, measured before
 * the change and animated from there after it. The rows come drawn by the server; within favorites
 * and the rest, the server's order. When the server's data comes back, it rules again.
 */
export function FavoriteOrder({ rows, itemClassName }: { rows: Row[]; itemClassName?: string }) {
  // The marks changed here, until the server's data comes back with them.
  const [local, setLocal] = useState<{ from: Row[]; marks: Map<string, boolean> }>({
    from: rows,
    marks: new Map(),
  })
  const marks = local.from === rows ? local.marks : new Map<string, boolean>()
  const items = useRef(new Map<string, HTMLLIElement>())
  const before = useRef<Map<string, DOMRect> | null>(null)

  const favoriteOf = (row: Row) => marks.get(row.slug) ?? row.favorite
  // sort is stable: within favorites and the rest, the server's order.
  const ordered = [...rows].sort((a, b) => Number(favoriteOf(b)) - Number(favoriteOf(a)))
  const order = ordered.map((row) => row.slug).join(' ')

  function change(slug: string, favorite: boolean) {
    before.current = new Map(
      [...items.current].map(([key, element]) => [key, element.getBoundingClientRect()]),
    )
    setLocal({ from: rows, marks: new Map(marks).set(slug, favorite) })
  }

  useLayoutEffect(() => {
    const from = before.current
    before.current = null
    if (!from || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    for (const [slug, element] of items.current) {
      const old = from.get(slug)
      if (!old) continue
      const now = element.getBoundingClientRect()
      const dx = old.left - now.left
      const dy = old.top - now.top
      if (!dx && !dy) continue
      // transform, not translate: it adds to a tile's hover lift (translate) instead of replacing it.
      element.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], {
        duration: SLIDE_MS,
        easing: EASE_OUT,
      })
    }
  }, [order])

  return (
    <FavoriteOrderContext.Provider value={change}>
      {ordered.map((row) => (
        <li
          key={row.slug}
          ref={(element) => {
            if (element) items.current.set(row.slug, element)
            else items.current.delete(row.slug)
          }}
          className={itemClassName}
        >
          {row.node}
        </li>
      ))}
    </FavoriteOrderContext.Provider>
  )
}
