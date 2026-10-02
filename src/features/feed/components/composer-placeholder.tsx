import { PenLineIcon, RadioIcon, ZapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ComingSoon } from '@/components/molecules/coming-soon'
import { UserAvatar } from '@/components/molecules/user-avatar'

/**
 * The prototype's "What are you thinking?" box (H-09). Creating posts is postponed, so the input
 * and the Post / Thesis / Live actions are coming soon (H-26).
 */
export function ComposerPlaceholder({ viewerName }: { viewerName: string | null }) {
  const t = useTranslations('feed.composer')
  const actions = [
    { key: 'post', icon: PenLineIcon },
    { key: 'thesis', icon: ZapIcon },
    { key: 'live', icon: RadioIcon },
  ] as const

  return (
    <div className="border-b bg-card px-4 py-3.5">
      <div className="flex items-center gap-3">
        <UserAvatar name={viewerName ?? '?'} size="md" className="size-10" />
        {/* Column flex: stretches the coming-soon wrapper (and its button) to the full width. */}
        <div className="flex min-w-0 flex-1 flex-col">
          <ComingSoon
            label={t('placeholder')}
            className="flex h-10.75 w-full items-center rounded-full border bg-surface px-4 text-left type-ui text-muted-foreground"
          >
            <span className="truncate">{t('placeholder')}</span>
          </ComingSoon>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 border-t pt-3">
        {actions.map(({ key, icon: Icon }) => (
          <div key={key} className="flex flex-col">
            <ComingSoon
              label={t(key)}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg type-action text-muted-foreground"
            >
              <Icon aria-hidden className="size-4" />
              {t(key)}
            </ComingSoon>
          </div>
        ))}
      </div>
    </div>
  )
}
