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
        // data-[side=left] overrides the 3/4 width from sheet.tsx (same specificity).
        className="px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-6 data-[side=left]:w-72 motion-reduce:transition-none"
      >
        <div className="flex items-center justify-between">
          <SheetTitle className="px-3 type-ui font-semibold">{t('menu')}</SheetTitle>
          <SheetClose
            render={
              <Button variant="ghost" size="icon" className="size-11" aria-label={t('closeMenu')} />
            }
          >
            <XIcon aria-hidden />
          </SheetClose>
        </div>
        {children}
      </SheetContent>
    </Sheet>
  )
}
