'use client'

import dynamic from 'next/dynamic'
import { PencilIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { useRouter } from '@/i18n/navigation'

/** The window comes on first use: nobody else's profile pays for it (seo.md). */
const loadDialog = () => import('./edit-profile-dialog').then((module) => module.EditProfileDialog)
const EditProfileDialog = dynamic(loadDialog)

/** From md the window; under it the full screen, as the post editor. */
const DESKTOP = '(min-width: 768px)'

/**
 * "Edit profile" on your own profile (specs/profile-edit PE-01), where others see Follow: a gray
 * outlined pill. Saved, the page refreshes to show the new bio (PE-03) and it is announced.
 */
export function EditProfileButton({ bio }: { bio: string | null }) {
  const t = useTranslations('communities.edit')
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [layout, setLayout] = useState<'sheet' | 'modal'>('modal')
  const [saved, setSaved] = useState(false)
  // Each opening starts from the saved bio (a new key); 0: never opened, nothing loaded.
  const [opening, setOpening] = useState(0)
  const trigger = useRef<HTMLButtonElement>(null)

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        // Intent before the click: by the time it lands, the window is usually there.
        onPointerEnter={() => void loadDialog()}
        onFocus={() => void loadDialog()}
        onClick={() => {
          setLayout(window.matchMedia(DESKTOP).matches ? 'modal' : 'sheet')
          setSaved(false)
          setOpening((count) => count + 1)
          setOpen(true)
        }}
        className="inline-flex h-8 tap items-center gap-1.5 rounded-full border border-border-strong bg-background px-3.5 type-action outline-none hover:bg-surface focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <PencilIcon aria-hidden className="size-3.5" />
        {t('button')}
      </button>
      <p role="status" className="sr-only">
        {saved ? t('saved') : ''}
      </p>
      {opening > 0 && (
        <EditProfileDialog
          key={opening}
          layout={layout}
          open={open}
          onOpenChange={setOpen}
          bio={bio}
          returnFocusTo={trigger}
          onSaved={() => {
            setSaved(true)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
