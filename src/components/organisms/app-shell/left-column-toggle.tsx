'use client'

import { MenuIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useSyncExternalStore, type MouseEvent } from 'react'
import {
  LEFT_COLUMN_COOKIE,
  LEFT_COLUMN_SUBMIT_COOKIE,
  writeLeftColumnCookie,
} from '@/lib/left-column'

// A page with a choice of its own (the page to create a post) puts its mark while it is shown; the
// shell's button then opens and folds that one (specs/sidebar-toggle § 2).
let scope: { open: boolean } | null = null
const listeners = new Set<() => void>()

function setScope(next: { open: boolean } | null) {
  scope = next
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const readScope = () => scope
const noScope = () => null

/**
 * Opens and folds the left column, Reddit's way (specs/sidebar-toggle SL-01 to SL-03): a round ☰
 * floating over the column's edge, from md. The site's state starts as the server read it from the
 * cookie; the CSS (`left-folded:`, globals.css) reads `data-left-site` and a page's mark, so the
 * column and this button are right before hydrating too. One name; aria-expanded says the rest.
 */
export function LeftColumnToggle({ initialFolded }: { initialFolded: boolean }) {
  const t = useTranslations('common.leftColumn')
  const [folded, setFolded] = useState(initialFolded)
  const page = useSyncExternalStore(subscribe, readScope, noScope)
  const open = page ? page.open : !folded

  function toggle(event: MouseEvent<HTMLButtonElement>) {
    // Folding with the focus inside the column (a click does not move it in Safari or Firefox on
    // macOS): back to the button, not on something about to vanish (WCAG 2.4.3).
    if (open && document.getElementById('left-column')?.contains(document.activeElement)) {
      event.currentTarget.focus()
    }
    if (page) {
      setScope({ open: !page.open })
      writeLeftColumnCookie(LEFT_COLUMN_SUBMIT_COOKIE, page.open ? 'folded' : 'open')
      return
    }
    setFolded(!folded)
    writeLeftColumnCookie(LEFT_COLUMN_COOKIE, folded ? 'open' : 'folded')
  }

  return (
    <button
      type="button"
      data-left-site={folded ? 'folded' : 'open'}
      aria-expanded={open}
      aria-controls="left-column"
      aria-label={t('label')}
      onClick={toggle}
      className={
        // Centered on the column's line: at 260px open, at 32px folded. It slides with the edge
        // (`tap` animates translate in 200ms); to fold, in 150 as the column (colors, borders,
        // translate, the press: the list of `tap` in globals.css).
        'fixed top-18 left-4 z-20 hidden size-8 translate-x-57 tap items-center justify-center rounded-full border bg-background text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:inline-flex left-folded:translate-x-0 left-folded:[transition-duration:150ms,150ms,150ms,150ms,120ms] [&_svg]:size-4'
      }
    >
      <MenuIcon aria-hidden />
    </button>
  )
}

/**
 * The mark of a page with its own choice: the page to create a post, folded unless opened there
 * (specs/sidebar-toggle SL-09). Drawn by the page with what it read from its cookie; while it is
 * shown, the shell's button works on it.
 */
export function LeftColumnScope({ initialOpen }: { initialOpen: boolean }) {
  const page = useSyncExternalStore(subscribe, readScope, noScope)

  // Registered on mount, gone on leaving: the other pages go back to the site's choice.
  useEffect(() => {
    setScope({ open: initialOpen })
    return () => setScope(null)
  }, [initialOpen])

  const open = page ? page.open : initialOpen
  return <span hidden data-left-scope={open ? 'open' : 'folded'} />
}
