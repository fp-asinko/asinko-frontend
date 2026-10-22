'use client'

import { PencilIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import type { CommunityWidget } from '../../../communities.types'

/** The window comes on first use: only a moderator ever opens it (seo.md). */
const loadDialog = () => import('./edit-widgets-dialog').then((module) => module.EditWidgetsDialog)
// ssr: false gives it its own Suspense: while its code comes, the nearest one (a feed's) does not
// go back to its skeleton (the PO saw Share "loading", 2026-10-21). It opens on a click: no SSR.
const EditWidgetsDialog = dynamic(loadDialog, { ssr: false })

/** From lg the window; under it the full screen, as "Edit profile". */
const DESKTOP = '(min-width: 1024px)'

/**
 * "Edit widgets", a moderator's tool in the group's header, by the actions, as Reddit's
 * "Moderation" (specs/community-widgets CW-08): the same in phones and desktop, and with the page
 * (in the right column it would travel twice, seo.md). Opens the window with the group's widgets;
 * after saving, the page shows them and it is said; the focus comes back here.
 */
export function EditWidgetsButton({
  slug,
  communityId,
  widgets,
}: {
  slug: string
  communityId: string
  widgets: CommunityWidget[]
}) {
  const t = useTranslations('communities.widgets.editor')
  const [open, setOpen] = useState(false)
  const [opened, setOpened] = useState(false)
  const [layout, setLayout] = useState<'sheet' | 'modal'>('modal')
  const [saved, setSaved] = useState(false)
  // Each opening starts again from what is saved: never what was discarded, never a widget saved
  // since without its id (the page brought it back with one).
  const [session, setSession] = useState(0)
  const button = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-haspopup="dialog"
        onPointerEnter={() => void loadDialog()}
        onFocus={() => void loadDialog()}
        onClick={() => {
          setLayout(window.matchMedia(DESKTOP).matches ? 'modal' : 'sheet')
          setSaved(false)
          setSession((count) => count + 1)
          setOpened(true)
          setOpen(true)
        }}
        className="inline-flex h-8 tap items-center gap-1.5 rounded-full border border-border-strong bg-background px-3.5 type-action outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <PencilIcon aria-hidden className="size-4" />
        {t('edit')}
      </button>
      <span role="status" className="sr-only">
        {saved ? t('saved') : ''}
      </span>
      {opened && (
        <EditWidgetsDialog
          key={session}
          layout={layout}
          open={open}
          onOpenChange={setOpen}
          slug={slug}
          communityId={communityId}
          widgets={widgets}
          onSaved={() => setSaved(true)}
          returnFocusTo={button}
        />
      )}
    </>
  )
}
