'use client'

import { ImageIcon, Trash2Icon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useRef, type ReactNode } from 'react'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { IMAGE_TYPES } from '@/lib/prepare-image'

export type ProfileImageKind = 'avatar' | 'banner'

const PILL =
  'inline-flex h-9 tap items-center gap-1.5 rounded-full bg-muted px-3.5 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4'

/**
 * The photo and the banner in "Edit profile" (specs/profile-presentation PP-07): how they look now
 * (or the color and the initials), with "Change" for each, which picks an image to crop, and
 * "Remove" when there is one. Only JPEG, PNG or WebP are offered (never SVG, security.md § 6).
 */
/** The "Change" button of a kind: the focus comes back to it (WCAG 2.4.3). */
export const changeImageId = (prefix: string, kind: ProfileImageKind) => `${prefix}-change-${kind}`

export function ProfileImages({
  idPrefix,
  username,
  avatar,
  banner,
  onPick,
  onRemove,
}: {
  /** For the ids of its buttons (changeImageId). */
  idPrefix: string
  /** Their colors and initials when there is no image. */
  username: string
  avatar: string | null
  banner: string | null
  onPick: (kind: ProfileImageKind, file: File) => void
  onRemove: (kind: ProfileImageKind) => void
}) {
  const t = useTranslations('communities.edit')
  const input = useRef<HTMLInputElement>(null)
  const picking = useRef<ProfileImageKind>('avatar')

  function pick(kind: ProfileImageKind) {
    picking.current = kind
    input.current?.click()
  }

  const action = (
    kind: ProfileImageKind,
    has: boolean,
    change: string,
    remove: string,
  ): ReactNode => (
    <>
      <button
        id={changeImageId(idPrefix, kind)}
        type="button"
        onClick={() => pick(kind)}
        className={PILL}
      >
        <ImageIcon aria-hidden />
        {change}
      </button>
      {has && (
        <button
          type="button"
          onClick={() => {
            onRemove(kind)
            // "Remove" goes away with the image: the focus goes to its "Change".
            requestAnimationFrame(() =>
              document.getElementById(changeImageId(idPrefix, kind))?.focus(),
            )
          }}
          className={PILL}
        >
          <Trash2Icon aria-hidden />
          {remove}
        </button>
      )}
    </>
  )

  return (
    <fieldset>
      <legend className="mb-2 type-action">{t('images')}</legend>
      {/* As the profile shows them: the banner (4:1) and the round photo on its edge. */}
      <div className="relative mb-9">
        <IdentityBanner
          colorKey={username}
          imageUrl={banner}
          className="aspect-4/1 w-full overflow-hidden rounded-lg"
        />
        <UserAvatar
          name={username}
          colorKey={username}
          imageUrl={avatar}
          size="xl"
          className="absolute -bottom-7 left-3 size-16 rounded-full border-3 border-background text-lg"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {action('avatar', Boolean(avatar), t('changePhoto'), t('removePhoto'))}
        {action('banner', Boolean(banner), t('changeBanner'), t('removeBanner'))}
      </div>
      <input
        ref={input}
        type="file"
        accept={IMAGE_TYPES.join(',')}
        // Picked through the buttons: out of the tab order and of what is read.
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
