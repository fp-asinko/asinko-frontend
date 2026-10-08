import { ImageIcon, LinkIcon, RadioIcon, ZapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GatedComingSoon } from '@/components/organisms/auth-gate'
import { ComposeSlot, ComposeTrigger } from '@/components/organisms/compose'
import { UserAvatar } from '@/components/molecules/user-avatar'

/** A round icon button of the box's row, as X's. */
const ICON =
  'inline-flex size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4.5'

/**
 * The composer box at the top of a feed (H-09), as X's: the avatar and the prompt without a box;
 * below, the formats as icons and Publish on the right. It is the editor closed: touching any of
 * it opens the editor (specs/post-create-detail PC-03), which expands right here in desktop. Image,
 * Thesis and Live are coming soon (H-26). Without a session, all of them open the account modal
 * (specs/guest-experience G-04). On a community's page it says where the post goes: "Post in
 * #defi".
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
    { key: 'image', icon: ImageIcon },
    { key: 'thesis', icon: ZapIcon },
    { key: 'live', icon: RadioIcon },
  ] as const

  return (
    <div className="border-b bg-card px-4 py-3.5">
      <ComposeSlot
        avatar={
          <UserAvatar
            name={viewerName ?? '?'}
            tone={viewerName ? 'identity' : 'neutral'}
            size="md"
            className="size-10"
          />
        }
        prompt={
          // The prompt reads as the title the person is about to write: same size, no box.
          <ComposeTrigger className="flex h-10.75 min-w-0 flex-1 items-center rounded-md text-left text-[1.0625rem] text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <span className="truncate">{prompt}</span>
          </ComposeTrigger>
        }
        actions={
          // Under the prompt, past the avatar (40px + 12px), as the open editor's footer.
          <div className="mt-2 ml-13 flex items-center gap-0.5 border-t pt-2.5">
            <ComposeTrigger type="LINK" aria-label={t('link')} className={ICON}>
              <LinkIcon aria-hidden />
            </ComposeTrigger>
            {soon.map(({ key, icon: Icon }) => (
              <GatedComingSoon key={key} action="post" label={t(key)} className={ICON}>
                <Icon aria-hidden />
              </GatedComingSoon>
            ))}
            {/* As X: Publish waits on the right, quiet until there is something to publish (the gray
                pill: white on a light black would not reach 4.5:1). */}
            <ComposeTrigger
              type="TEXT"
              className="ml-auto inline-flex h-9 tap items-center rounded-full bg-muted px-4 type-action font-bold text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t('publish')}
            </ComposeTrigger>
          </div>
        }
      />
    </div>
  )
}
