import Image from 'next/image'
import { identityIndex } from '@/lib/identity-color'
import { cn } from '@/lib/utils'

const SIZES = {
  xs: { box: 'size-5 text-[0.5rem]', px: 20 },
  sm: { box: 'size-7 text-[0.6875rem]', px: 28 },
  md: { box: 'size-9 text-xs', px: 36 },
  lg: { box: 'size-11 text-sm', px: 44 },
  xl: { box: 'size-12 text-base', px: 48 },
} as const

// Full class names, never interpolated: Tailwind only generates the classes it finds written out.
const IDENTITY_CLASSES = [
  'from-avatar-0 to-avatar-0-to text-avatar-0-foreground',
  'from-avatar-1 to-avatar-1-to text-avatar-1-foreground',
  'from-avatar-2 to-avatar-2-to text-avatar-2-foreground',
  'from-avatar-3 to-avatar-3-to text-avatar-3-foreground',
  'from-avatar-4 to-avatar-4-to text-avatar-4-foreground',
  'from-avatar-5 to-avatar-5-to text-avatar-5-foreground',
  'from-avatar-6 to-avatar-6-to text-avatar-6-foreground',
  'from-avatar-7 to-avatar-7-to text-avatar-7-foreground',
] as const

/**
 * Avatar of a user or community. Server-rendered (no client JS): the image when there is one,
 * otherwise the initials on the person's identity color (FC-01), stable across screens. `neutral`
 * is for a placeholder that is nobody yet (the composer without a session). `colorKey` is the stable
 * key of the color when the visible name is not (a community: its slug, never its display name).
 * Decorative: the name is always next to it.
 */
export function UserAvatar({
  name,
  imageUrl,
  size = 'sm',
  tone = 'identity',
  colorKey = name,
  className,
}: {
  name: string
  colorKey?: string
  imageUrl?: string | null
  size?: keyof typeof SIZES
  tone?: 'identity' | 'neutral'
  className?: string
}) {
  const { box, px } = SIZES[size]
  const color = tone === 'identity' ? identityIndex(colorKey) : null
  const initials = name
    .replace(/^[@#$]/, '')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      aria-hidden
      data-testid="user-avatar"
      // The palette slot, for tests and debugging: the color itself is decorative.
      data-color={imageUrl || color === null ? undefined : color}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold',
        // With an image, a neutral background: a round logo ($BTC) shows no gradient in its corners.
        imageUrl || color === null
          ? 'bg-muted text-muted-foreground'
          : cn('bg-linear-135', IDENTITY_CLASSES[color]),
        box,
        className,
      )}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt="" fill sizes={`${px}px`} className="object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}
