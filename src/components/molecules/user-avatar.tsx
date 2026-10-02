import Image from 'next/image'
import { cn } from '@/lib/utils'

const SIZES = {
  xs: { box: 'size-5 text-[0.5rem]', px: 20 },
  sm: { box: 'size-7 text-[0.6875rem]', px: 28 },
  md: { box: 'size-9 text-xs', px: 36 },
  lg: { box: 'size-11 text-sm', px: 44 },
} as const

/**
 * Avatar of a user or community. Server-rendered (no client JS): the image when there is one,
 * otherwise the initials on a neutral surface. Decorative: the name is always next to it.
 */
export function UserAvatar({
  name,
  imageUrl,
  size = 'sm',
  className,
}: {
  name: string
  imageUrl?: string | null
  size?: keyof typeof SIZES
  className?: string
}) {
  const { box, px } = SIZES[size]
  const initials = name
    .replace(/^[@#$]/, '')
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      aria-hidden
      data-testid="user-avatar"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-semibold text-muted-foreground',
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
