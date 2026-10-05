'use client'

import { EllipsisIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

// The Base UI Menu is heavy and only needed on tap: loaded on the first open (HR-07, seo.md),
// and fetched ahead when the pointer or the focus reaches the button, so the tap feels instant.
const loadPopup = () => import('./more-menu-popup')
const MoreMenuPopup = dynamic(() => loadPopup().then((mod) => mod.MoreMenuPopup), { ssr: false })

/** The "⋯" of the top bar, as Reddit's: the settings that do not need their own button (HR-03). */
export function MoreMenu() {
  const t = useTranslations('common')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)
  // The trigger is outside the menu: pressing it while open closes the menu (outside press), so
  // the click that follows must not open it again.
  const wasOpen = useRef(false)
  const [compact, setCompact] = useState(false)

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="size-10 rounded-full text-muted-foreground hover:bg-surface"
        aria-label={t('menu.more')}
        aria-haspopup="menu"
        aria-expanded={open}
        onPointerEnter={loadPopup}
        onFocus={loadPopup}
        onPointerDown={() => (wasOpen.current = open)}
        onClick={() => {
          setCompact(!window.matchMedia('(min-width: 768px)').matches)
          setRequested(true)
          setOpen(!wasOpen.current)
          wasOpen.current = false
        }}
      >
        <EllipsisIcon aria-hidden className="size-5" />
      </Button>
      {requested && (
        <MoreMenuPopup open={open} onOpenChange={setOpen} anchor={triggerRef} compact={compact} />
      )}
    </>
  )
}
