'use client'

import { MenuIcon, XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

// Left column as a panel on mobile (< md). The content comes from the server as children.
export function MobileSidebar({ children }: { children: ReactNode }) {
  const t = useTranslations('common.nav')

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-11 md:hidden"
            aria-label={t('openMenu')}
          />
        }
      >
        <MenuIcon aria-hidden />
      </SheetTrigger>
      <SheetContent
        side="left"
        // Own 44px close button: the default one is 28px (design-system.md § Mobile first).
        showCloseButton={false}
        // data-[side=left] overrides the 3/4 width from sheet.tsx (same specificity).
        className="px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] pb-6 data-[side=left]:w-72 motion-reduce:transition-none"
      >
        <div className="flex items-center justify-between">
          <SheetTitle className="px-3 text-headline">{t('menu')}</SheetTitle>
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
