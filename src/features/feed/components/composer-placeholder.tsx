import { PenLineIcon, RadioIcon, ZapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GatedComingSoon } from '@/components/organisms/auth-gate'
import { ComposeTrigger } from '@/components/organisms/compose'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'

const ACTION =
  'flex h-9 w-full tap items-center justify-center gap-2 rounded-lg type-action text-muted-foreground'

/**
 * The prototype's "What are you thinking?" box (H-09). The box and Post open the post editor
 * (specs/post-create-detail PC-03); Thesis and Live are coming soon (H-26). Without a session,
 * all of them open the account modal (specs/guest-experience G-04). On a community's page it
 * says where the post goes: "Post in #defi".
 */
export function ComposerPlaceholder({
  viewerName,
  communityHandle,
}: {
  viewerName: string | null
  communityHandle?: string
}) {
  const t = useTranslations('feed.composer')
  const prompt = communityHandle ? t('postIn', { handle: communityHandle }) : t('placeholder')
  const soon = [
    { key: 'thesis', icon: ZapIcon },
    { key: 'live', icon: RadioIcon },
  ] as const

  return (
    <div className="border-b bg-card px-4 py-3.5">
      <div className="flex items-center gap-3">
        <UserAvatar
          name={viewerName ?? '?'}
          tone={viewerName ? 'identity' : 'neutral'}
          size="md"
          className="size-10"
        />
        <ComposeTrigger className="flex h-10.75 min-w-0 flex-1 tap items-center rounded-full bg-surface px-4 text-left type-ui text-muted-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="truncate">{prompt}</span>
        </ComposeTrigger>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 border-t pt-3">
        <ComposeTrigger
          type="TEXT"
          className={cn(
            ACTION,
            'outline-none hover:bg-surface hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50',
          )}
        >
          <PenLineIcon aria-hidden className="size-4" />
          {t('post')}
        </ComposeTrigger>
        {soon.map(({ key, icon: Icon }) => (
          <div key={key} className="flex flex-col">
            <GatedComingSoon action="post" label={t(key)} className={ACTION}>
              <Icon aria-hidden className="size-4" />
              {t(key)}
            </GatedComingSoon>
          </div>
        ))}
      </div>
    </div>
  )
}
