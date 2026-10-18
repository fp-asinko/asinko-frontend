'use client'

import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/utils'

/** The viewer's choice (specs/submit-tools ST-09): a convenience, kept in the browser. */
const KEY = 'asinko:left-column:submit'
const CHANGED = 'asinko:left-column'

// Storage can throw (private mode, blocked site data): then the column starts folded.
function readOpen(): boolean {
  try {
    return window.localStorage.getItem(KEY) === 'open'
  } catch {
    return false
  }
}

function writeOpen(open: boolean) {
  try {
    window.localStorage.setItem(KEY, open ? 'open' : 'folded')
  } catch {
    // Not kept: the column still folds and unfolds.
  }
  window.dispatchEvent(new Event(CHANGED))
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange)
  return () => window.removeEventListener(CHANGED, onChange)
}

/**
 * Folds the shell's left column ("Your interests") on the page that renders it: the page to create
 * a post (specs/submit-tools ST-08, ST-09). Only that page pays for it; the shell folds by CSS
 * while this button says `data-left-fold="folded"` (AppShell). It starts folded, also on the
 * server, so the first paint does not jump; the browser may remember it open. It sits over the
 * column's top, at its right edge when open.
 */
export function LeftColumnFold() {
  const t = useTranslations('common.leftColumn')
  const open = useSyncExternalStore(subscribe, readOpen, () => false)

  return (
    <button
      type="button"
      data-left-fold={open ? 'open' : 'folded'}
      aria-expanded={open}
      aria-controls="left-column"
      // One name; aria-expanded says whether it is open (a disclosure).
      aria-label={t('label')}
      onClick={() => writeOpen(!open)}
      className={cn(
        'fixed top-17.5 z-20 hidden size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:inline-flex [&_svg]:size-4.5',
        open ? 'left-54' : 'left-2.5',
      )}
    >
      {open ? <PanelLeftCloseIcon aria-hidden /> : <PanelLeftOpenIcon aria-hidden />}
    </button>
  )
}
