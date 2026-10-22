'use client'

import { CameraIcon, ImageIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { IMAGE_TYPES } from '@/lib/prepare-image'
import { cn } from '@/lib/utils'

export type ProfileImageKind = 'avatar' | 'banner'

/** The camera button of a kind: the focus comes back to it (WCAG 2.4.3). */
export const changeImageId = (prefix: string, kind: ProfileImageKind) => `${prefix}-change-${kind}`

/**
 * Round, over the image: legible on any photo with its fill and border. No blur: it was redrawn on
 * every frame of the window's animation.
 */
const CAMERA =
  'absolute inline-flex size-11 tap md:size-9 items-center justify-center rounded-full border bg-background/90 text-foreground outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4.5'

/**
 * The photo and the banner in "Edit profile" (specs/profile-presentation PP-07,
 * specs/profile-edit-flow EF-01): how they look now (or the color and the initials), with a camera
 * button over each, as X and LinkedIn. Its menu uploads another image, to crop, or removes the one
 * there is. Only JPEG, PNG or WebP are offered (never SVG, security.md § 6).
 */
export function ProfileImages({
  idPrefix,
  username,
  avatar,
  banner,
  onPick,
  onRemove,
  className,
}: {
  /** For the ids of its buttons (changeImageId). */
  idPrefix: string
  /** Their colors and initials when there is no image. */
  username: string
  avatar: string | null
  banner: string | null
  onPick: (kind: ProfileImageKind, file: File) => void
  onRemove: (kind: ProfileImageKind) => void
  className?: string
}) {
  const t = useTranslations('communities.edit')
  const input = useRef<HTMLInputElement>(null)
  const picking = useRef<ProfileImageKind>('avatar')

  const camera = (kind: ProfileImageKind, has: boolean, label: string, position: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={changeImageId(idPrefix, kind)}
        aria-label={label}
        className={cn(CAMERA, position)}
      >
        <CameraIcon aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          className="min-h-10"
          onClick={() => {
            picking.current = kind
            input.current?.click()
          }}
        >
          <ImageIcon aria-hidden />
          {t('uploadImage')}
        </DropdownMenuItem>
        {has && (
          <DropdownMenuItem
            className="min-h-10"
            variant="destructive"
            onClick={() => onRemove(kind)}
          >
            <Trash2Icon aria-hidden />
            {t('remove')}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <fieldset className={className}>
      {/* Named by its section's title too: only for who navigates by groups. */}
      <legend className="sr-only">{t('images')}</legend>
      {/* As the profile shows them: the banner (4:1) and the round photo on its edge. */}
      <div className="relative mb-9">
        <IdentityBanner
          colorKey={username}
          imageUrl={banner}
          className="aspect-4/1 w-full overflow-hidden rounded-lg"
        />
        {camera('banner', Boolean(banner), t('changeBanner'), 'top-2 right-2')}
        <div className="absolute -bottom-7 left-3">
          <UserAvatar
            name={username}
            colorKey={username}
            imageUrl={avatar}
            size="xl"
            className="size-16 rounded-full border-3 border-background text-lg"
          />
          {camera('avatar', Boolean(avatar), t('changePhoto'), '-right-3 -bottom-1')}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        // Picked through the menus: out of the tab order and of what is read.
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) onPick(picking.current, file)
        }}
      />
    </fieldset>
  )
}
