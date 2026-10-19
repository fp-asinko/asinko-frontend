'use client'

import { FileStackIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { SavedDraft } from '../composer.types'
import { DraftsDialog } from './drafts-dialog'

const DESKTOP = '(min-width: 48rem)'

/**
 * "Drafts", as Reddit's (specs/drafts-tags DT-02, DT-03): opens the account's drafts. Opening one
 * with something written asks first: it replaces the form. The window comes with the editor, which
 * is already loaded on first use (seo.md): deferring it again would only add to every route.
 */
export function DraftsButton({
  written,
  onOpen,
  onDeleted,
  openedFocus,
}: {
  /** Whether the form has something written, asked at that moment. */
  written: () => boolean
  onOpen: (draft: SavedDraft) => void
  onDeleted: (id: string) => void
  /** Where the focus goes once a draft is opened: the form's title (WCAG 2.4.3). */
  openedFocus: () => HTMLElement | null
}) {
  const t = useTranslations('composer.drafts')
  const [open, setOpen] = useState(false)
  const [layout, setLayout] = useState<'sheet' | 'modal'>('modal')
  const [replacing, setReplacing] = useState<SavedDraft | null>(null)
  // Each opening asks again (DT-02): a new window, never the list of the last time.
  const [opening, setOpening] = useState(0)
  const button = useRef<HTMLButtonElement>(null)
  // Closing gives the focus back to "Drafts"; opening a draft, to the form.
  const back = useRef<HTMLElement | null>(null)

  function take(draft: SavedDraft) {
    back.current = openedFocus()
    setOpen(false)
    setReplacing(null)
    onOpen(draft)
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        onClick={() => {
          setLayout(window.matchMedia(DESKTOP).matches ? 'modal' : 'sheet')
          back.current = button.current
          setOpening((count) => count + 1)
          setOpen(true)
        }}
        className="ml-auto inline-flex h-10 tap items-center gap-1.5 rounded-full px-3 type-action font-bold text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4"
      >
        <FileStackIcon aria-hidden />
        {t('open')}
      </button>
      <DraftsDialog
        key={opening}
        layout={layout}
        open={open}
        onOpenChange={setOpen}
        onOpen={(draft) => (written() ? setReplacing(draft) : take(draft))}
        onDeleted={onDeleted}
        returnFocusTo={back}
      />
      <AlertDialog open={replacing !== null} onOpenChange={(next) => !next && setReplacing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('replaceTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('replaceBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => replacing && take(replacing)}>
              {t('replaceConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
