import { ImageIcon, LinkIcon, RadioIcon, ZapIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { GatedComingSoon } from '@/components/organisms/auth-gate'
import { ComposeTrigger } from '@/components/organisms/compose'
import { UserAvatar } from '@/components/molecules/user-avatar'

/** A round icon button of the box's row, as X's. */
const ICON =
  'inline-flex size-9 tap items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4.5'

/**
 * The composer box at the top of a feed (H-09), as X's: the avatar and the prompt without a box;
 * below, the formats as icons and Publish on the right. Each part goes to the page to create a
 * post (specs/submit-page SU-02, Q1), on its format: the prompt and Publish on Text, the link and
 * the image icons on theirs. Thesis and Live are coming soon (H-26). On a community's page it says
 * where the post goes: "Post in #defi", and the page arrives with it chosen.
 */
export function ComposerPlaceholder({
  viewerName,
  communityHandle,
  communitySlug,
}: {
  viewerName: string | null
  communityHandle?: string
  /** The community of the page: "Create" takes it along. */
  communitySlug?: string
}) {
  const t = useTranslations('feed.composer')
  const prompt = communityHandle ? t('postIn', { handle: communityHandle }) : t('placeholder')
  const soon = [
    { key: 'thesis', icon: ZapIcon },
    { key: 'live', icon: RadioIcon },
  ] as const

  return (
    // The cards' edges: the whole column from md, as the posts and their images below. From sm,
    // one row: the prompt on the left, the formats and Publish on the right (specs/composer-row).
    <div className="border-b bg-card px-4 py-3.5 sm:flex sm:items-center sm:gap-3 md:px-0">
      <div className="flex items-center gap-3 sm:min-w-0 sm:flex-1">
        <UserAvatar
          name={viewerName ?? '?'}
          tone={viewerName ? 'identity' : 'neutral'}
          size="md"
          className="size-10"
        />
        {/* The prompt reads as the title the person is about to write: same size, no box. */}
        <ComposeTrigger
          community={communitySlug}
          className="flex h-10.75 min-w-0 flex-1 items-center rounded-md text-left text-[1.0625rem] text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="truncate">{prompt}</span>
        </ComposeTrigger>
      </div>
      {/* On a phone, its own row under a line, edge to edge as the editor's footer (CR-02). */}
      <div className="mt-3 flex items-center gap-0.5 border-t pt-2.5 sm:mt-0 sm:shrink-0 sm:border-t-0 sm:pt-0">
        <ComposeTrigger
          type="link"
          community={communitySlug}
          aria-label={t('link')}
          className={ICON}
        >
          <LinkIcon aria-hidden />
        </ComposeTrigger>
        <ComposeTrigger
          type="image"
          community={communitySlug}
          aria-label={t('image')}
          className={ICON}
        >
          <ImageIcon aria-hidden />
        </ComposeTrigger>
        {soon.map(({ key, icon: Icon }) => (
          <GatedComingSoon key={key} action="post" label={t(key)} className={ICON}>
            <Icon aria-hidden />
          </GatedComingSoon>
        ))}
        {/* As X: Publish waits on the right, quiet (the gray pill: white on a light black would
            not reach 4.5:1). The same place as the prompt: one link for assistive tech and the
            keyboard (WCAG 2.4.4). */}
        <ComposeTrigger
          community={communitySlug}
          aria-hidden
          tabIndex={-1}
          className="ml-auto inline-flex h-9 tap items-center rounded-full bg-muted px-4 type-action font-bold text-muted-foreground outline-none hover:bg-muted-hover hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 sm:ml-1.5"
        >
          {t('publish')}
        </ComposeTrigger>
      </div>
    </div>
  )
}
