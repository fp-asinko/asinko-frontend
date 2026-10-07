import Image from 'next/image'
import { identityIndex } from '@/lib/identity-color'
import { cn } from '@/lib/utils'

// Full class names, never interpolated: Tailwind only generates the classes it finds written out.
// The same hues as the avatars (--avatar-N → --avatar-N-to): no new colors.
const BANNER_CLASSES = [
  'from-avatar-0 to-avatar-0-to',
  'from-avatar-1 to-avatar-1-to',
  'from-avatar-2 to-avatar-2-to',
  'from-avatar-3 to-avatar-3-to',
  'from-avatar-4 to-avatar-4-to',
  'from-avatar-5 to-avatar-5-to',
  'from-avatar-6 to-avatar-6-to',
  'from-avatar-7 to-avatar-7-to',
] as const

/**
 * The banner of a community or profile page (specs/community-pages § 1): its image, or the
 * gradient of its identity hue, keyed like its avatar (the slug). Decorative.
 */
export function IdentityBanner({
  colorKey,
  imageUrl,
  className,
}: {
  colorKey: string
  imageUrl?: string | null
  className?: string
}) {
  return (
    <div
      aria-hidden
      data-testid="identity-banner"
      data-color={imageUrl ? undefined : identityIndex(colorKey)}
      className={cn(
        'relative overflow-hidden',
        !imageUrl && cn('bg-linear-135', BANNER_CLASSES[identityIndex(colorKey)]),
        className,
      )}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 780px, 100vw"
          className="object-cover"
        />
      )}
    </div>
  )
}
