'use client'

import dynamic from 'next/dynamic'
import { PencilIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createContext, use, useRef, useState, type ReactNode } from 'react'
import { useRouter } from '@/i18n/navigation'
import type { EditableGroup, EditGroupField } from '../../communities.types'

/** The window comes on first use: no group page pays for it in its first load (seo.md). */
const loadDialog = () => import('./edit-group-dialog').then((module) => module.EditGroupDialog)
// It opens on a click: no SSR, and its own Suspense (as "Edit profile").
const EditGroupDialog = dynamic(loadDialog, { ssr: false })

/** From md the window; under it the full screen. */
const DESKTOP = '(min-width: 768px)'

const OpenContext = createContext<((field?: EditGroupField) => void) | null>(null)

/**
 * "Edit group" for its moderators (specs/community-edit CE-01 to CE-05): holds the window for its
 * button and for the steps of "Get your group started", which open it on their field. Saved, the
 * page refreshes to show it. The focus goes back to whatever opened it (WCAG 2.4.3).
 */
export function EditGroupProvider({
  group,
  children,
}: {
  group: EditableGroup
  children: ReactNode
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [layout, setLayout] = useState<'sheet' | 'modal'>('modal')
  const [field, setField] = useState<EditGroupField | null>(null)
  // Each opening starts from what is saved (a new key); 0: never opened, nothing loaded.
  const [opening, setOpening] = useState(0)
  const opener = useRef<HTMLElement | null>(null)

  function openOn(next?: EditGroupField) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setLayout(window.matchMedia(DESKTOP).matches ? 'modal' : 'sheet')
    setField(next ?? null)
    setOpening((count) => count + 1)
    setOpen(true)
  }

  return (
    <OpenContext value={openOn}>
      {children}
      {opening > 0 && (
        <EditGroupDialog
          key={opening}
          layout={layout}
          open={open}
          onOpenChange={setOpen}
          group={group}
          field={field}
          returnFocusTo={opener}
          onSaved={() => router.refresh()}
        />
      )}
    </OpenContext>
  )
}

function useOpenEditGroup() {
  const open = use(OpenContext)
  if (!open) throw new Error('Inside EditGroupProvider only')
  return open
}

// Intent before the click: by the time it lands, the window is usually there.
const preload = { onPointerEnter: () => void loadDialog(), onFocus: () => void loadDialog() }

/** "Edit group" in the group's header (CE-01): the gray outlined pill of "Edit profile". */
export function EditGroupButton() {
  const t = useTranslations('communities.editGroup')
  const open = useOpenEditGroup()
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      {...preload}
      onClick={() => open()}
      className="inline-flex h-8 tap items-center gap-1.5 rounded-full border border-border-strong bg-background px-3.5 type-action outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <PencilIcon aria-hidden className="size-3.5" />
      {t('button')}
    </button>
  )
}

/** A step of "Get your group started" (CE-07): an outlined pill, as a link too. */
export const STEP_PILL =
  'inline-flex h-11 tap items-center gap-1.5 rounded-full border border-input px-4 type-action outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 [&_svg]:size-4'

/** A step of "Get your group started" (CE-07): opens the window on its field. */
export function EditGroupPrompt({
  field,
  children,
}: {
  field: EditGroupField
  children: ReactNode
}) {
  const open = useOpenEditGroup()
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      {...preload}
      onClick={() => open(field)}
      className={STEP_PILL}
    >
      {children}
    </button>
  )
}
