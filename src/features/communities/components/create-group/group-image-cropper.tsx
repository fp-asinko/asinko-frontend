'use client'

import { useTranslations } from 'next-intl'
import { useRef, useState } from 'react'
import type { Area } from 'react-easy-crop'
import { CropFrame } from '@/components/molecules/crop-frame'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cropImage } from '@/lib/prepare-image'
import { cn } from '@/lib/utils'
import type { ProfileImageKind } from '../edit-profile-images'

/** The sizes the group keeps (the profile's): a 400px photo, a 4:1 banner. */
const SIZE = {
  avatar: { width: 400, height: 400 },
  banner: { width: 1500, height: 375 },
} as const

const ERRORS = {
  type: 'errors.imageType',
  unreadable: 'errors.imageUnreadable',
  tooLarge: 'errors.imageTooLarge',
} as const

const PILL =
  'inline-flex h-11 tap items-center rounded-full px-4 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 aria-disabled:active:scale-100 md:h-9'

/**
 * Crops a new group's photo or banner (specs/community-create CG-03.4), in a window: the profile's
 * frame, square for the photo and 4:1 for the banner. Apply prepares that part and hands it back,
 * without uploading: the group does not exist yet (Q5). Back, Escape or closing drops it.
 */
export function GroupImageCropper({
  kind,
  file,
  source,
  onApply,
  onBack,
}: {
  kind: ProfileImageKind
  file: File
  /** The file as a URL to show (its owner revokes it). */
  source: string
  onApply: (image: Blob) => void
  onBack: () => void
}) {
  const t = useTranslations('communities.edit')
  const tGroup = useTranslations('createGroup.images')
  const [working, setWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const area = useRef<Area | null>(null)

  async function apply() {
    if (working || !area.current) return
    setWorking(true)
    setError(null)
    const prepared = await cropImage(file, area.current, SIZE[kind])
    setWorking(false)
    if (!prepared.ok) return setError(t(ERRORS[prepared.error]))
    onApply(prepared.blob)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onBack()}>
      <DialogContent closeLabel={t('back')} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {kind === 'avatar' ? tGroup('cropPhoto') : tGroup('cropBanner')}
          </DialogTitle>
        </DialogHeader>
        <CropFrame
          source={source}
          aspect={kind === 'avatar' ? 1 : 4}
          areaLabel={t('cropArea')}
          zoomLabel={t('zoom')}
          onAreaChange={(pixels) => (area.current = pixels)}
        />
        {error && (
          <p role="alert" className="type-small text-destructive">
            {error}
          </p>
        )}
        <DialogFooter className="flex-row justify-end gap-2">
          <button
            type="button"
            onClick={onBack}
            className={cn(PILL, 'text-muted-foreground hover:bg-muted hover:text-foreground')}
          >
            {t('back')}
          </button>
          <button
            type="button"
            onClick={() => void apply()}
            aria-disabled={working || undefined}
            className={cn(PILL, 'bg-primary text-primary-foreground hover:bg-primary/85')}
          >
            {t('apply')}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
