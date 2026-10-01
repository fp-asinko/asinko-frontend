'use client'

import { MenuIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { useRef, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'

// The Dialog (Base UI) is ~25 KB gzip and only needed on tap: load it on the first open (seo.md).
const MobileSidebarPanel = dynamic(
  () => import('./mobile-sidebar-panel').then((module) => module.MobileSidebarPanel),
  { ssr: false },
)

// Left column as a panel on mobile (< md). The content comes from the server as children.
export function MobileSidebar({ children }: { children: ReactNode }) {
  const t = useTranslations('common.nav')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [requested, setRequested] = useState(false)

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        className="size-11 md:hidden"
        aria-label={t('openMenu')}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setRequested(true)
          setOpen(true)
        }}
      >
        <MenuIcon aria-hidden />
      </Button>
      {requested && (
        <MobileSidebarPanel open={open} onOpenChange={setOpen} returnFocusTo={triggerRef}>
          {children}
        </MobileSidebarPanel>
      )}
    </>
  )
}
