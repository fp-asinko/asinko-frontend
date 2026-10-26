'use client'

import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode, RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle } from '@/components/ui/sheet'

// The panel itself (Base UI Dialog). Loaded on the first open by MobileSidebar (seo.md: lazy modals).
export function MobileSidebarPanel({
  open,
  onOpenChange,
  returnFocusTo,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  returnFocusTo: RefObject<HTMLButtonElement | null>
  children: ReactNode
}) {
  const t = useTranslations('common.nav')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        // Own 44px close button: the default one is 28px (design-system.md § Mobile first).
        showCloseButton={false}
        // The trigger lives outside the Dialog, so focus is returned to it explicitly.
        finalFocus={returnFocusTo}
        // data-[side=left] overrides the 3/4 width from sheet.tsx (same specificity). The content
        // scrolls inside, under the close button: the page behind is locked while it is open.
        className="gap-0 pt-[calc(0.25rem+env(safe-area-inset-top))] data-[side=left]:w-72 motion-reduce:transition-none"
      >
        <div className="flex shrink-0 items-center justify-end px-3">
          {/* Only for screen readers: the dialog's name. Nothing to read on screen (PO, 2026-10-26). */}
          <SheetTitle className="sr-only">{t('menu')}</SheetTitle>
          <SheetClose
            render={
              <Button variant="ghost" size="icon" className="size-11" aria-label={t('closeMenu')} />
            }
          >
            <XIcon aria-hidden />
          </SheetClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
