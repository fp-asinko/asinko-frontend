'use client'

import { PinIcon, PinOffIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { RefObject } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'

/**
 * The menu of "⋯" (specs/profile-showcase PS-07), loaded on its first open: feature it, or take it
 * out. With three featured, featuring is disabled and says why.
 */
export function FeaturedMenuPopup({
  open,
  onOpenChange,
  anchor,
  featured,
  full,
  max,
  disabled,
  onChoose,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor: RefObject<HTMLButtonElement | null>
  featured: boolean
  full: boolean
  /** How many can be featured. */
  max: number
  disabled: boolean
  onChoose: () => void
}) {
  const t = useTranslations('featured')
  const blocked = !featured && full

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuContent anchor={anchor} finalFocus={anchor} align="end" className="w-60">
        <DropdownMenuItem
          className="min-h-10 items-start py-2"
          disabled={blocked || disabled}
          onClick={() => {
            // Closed at once: the page renders again with the change (no menu left open).
            onOpenChange(false)
            onChoose()
          }}
        >
          {featured ? <PinOffIcon aria-hidden /> : <PinIcon aria-hidden />}
          <span className="flex flex-col gap-0.5">
            {featured ? t('remove') : t('add')}
            {blocked && (
              <span className="type-meta text-muted-foreground">{t('full', { max })}</span>
            )}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
