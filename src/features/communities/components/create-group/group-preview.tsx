import { useTranslations } from 'next-intl'
import { IdentityBanner } from '@/components/molecules/identity-banner'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'

/**
 * The avatar's initials without a name yet: "#" (specs/community-create CG-17). UserAvatar drops
 * a leading # (a group's handle), so it takes two.
 */
export const NO_NAME = '##'

/**
 * How the group being created will look (specs/community-create CG-08): its banner (or the color
 * its handle gives it), its square photo, the handle as the title, the name and the description in
 * three lines, and the "Joined" its creator will see. Only render: what the form has comes in.
 */
export function GroupPreview({
  handle,
  name,
  description,
  avatarUrl,
  bannerUrl,
  className,
}: {
  handle: string
  name: string
  description: string
  avatarUrl: string | null
  bannerUrl: string | null
  className?: string
}) {
  const t = useTranslations('createGroup.preview')
  // Without a handle yet, the color of a placeholder: it changes once one is typed.
  const colorKey = handle || 'your-group'
  return (
    <section
      aria-label={t('label')}
      className={cn('overflow-hidden rounded-xl border bg-background', className)}
    >
      <p aria-hidden className="px-3 pt-2.5 pb-2 type-section text-muted-foreground">
        {t('label')}
      </p>
      <IdentityBanner colorKey={colorKey} imageUrl={bannerUrl} className="aspect-4/1 w-full" />
      <div className="px-3 pb-3">
        <UserAvatar
          name={name || NO_NAME}
          colorKey={colorKey}
          imageUrl={avatarUrl}
          size="xl"
          className="relative -mt-6 size-12 rounded-xl border-3 border-background text-base"
        />
        <div className="mt-1.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={cn(
                'text-[1.0625rem] leading-[1.3] font-extrabold wrap-anywhere',
                !handle && 'text-muted-foreground',
              )}
            >
              <span className="mr-0.5 text-[0.75em] font-semibold text-muted-foreground">#</span>
              {handle || t('placeholder')}
            </p>
            {name && <p className="type-meta wrap-anywhere text-muted-foreground">{name}</p>}
          </div>
          {/* Decorative: how its creator will see the button, already a member. */}
          <span
            aria-hidden
            className="inline-flex h-7 shrink-0 items-center rounded-full bg-muted px-3 type-action"
          >
            {t('joined')}
          </span>
        </div>
        {description && (
          <p className="mt-2 line-clamp-3 type-small wrap-anywhere whitespace-pre-line text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
