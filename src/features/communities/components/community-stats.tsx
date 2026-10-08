import { useFormatter, useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { ProfileDetails } from '../communities.types'

// The numbers under a community's or a person's name: in its page header and in its hover card
// (specs/community-pages CP-11, specs/mention-preview MP-03, MP-05).

/** "1,204 members", the number in bold. */
export function MemberCount({ count, className }: { count: number; className?: string }) {
  const t = useTranslations('communities')
  return (
    <p className={cn('type-meta text-muted-foreground', className)}>
      {t.rich('members', { count, b: (chunks) => <Strong>{chunks}</Strong> })}
    </p>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>
}

/** Followers · accuracy · streak (CP-11); the streak counts correct theses in a row, not days. */
export function ProfileStats({
  profile,
  className,
}: {
  profile: Pick<ProfileDetails, 'followerCount' | 'accuracyRate' | 'currentStreak'>
  className?: string
}) {
  const t = useTranslations('communities.profile')
  const format = useFormatter()
  const parts = [
    t.rich('followers', {
      count: profile.followerCount,
      b: (chunks) => <Strong>{chunks}</Strong>,
    }),
    profile.accuracyRate !== null &&
      t.rich('accuracy', {
        value: format.number(profile.accuracyRate, { style: 'percent' }),
        b: (chunks) => <Strong>{chunks}</Strong>,
      }),
    t.rich('streak', { count: profile.currentStreak, b: (chunks) => <Strong>{chunks}</Strong> }),
  ].filter(Boolean)

  return (
    <p className={cn('flex flex-wrap gap-x-2 type-meta text-muted-foreground', className)}>
      {parts.map((part, index) => (
        // Not flex inside: the bold number and its word keep a normal space between them.
        <span key={index}>
          {index > 0 && (
            <span aria-hidden className="mr-2">
              ·
            </span>
          )}
          {part}
        </span>
      ))}
    </p>
  )
}
