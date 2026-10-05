import { XIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from '@/i18n/navigation'
import type { CommunityRef } from '../feed.types'
import { feedHref } from '../lib/feed-href'
import type { FeedParams } from '../schemas/feed-params.schema'

/** The filtered community, as a chip that removes the filter (H-14). */
export function CommunityChip({
  params,
  community,
}: {
  params: FeedParams
  community: CommunityRef | null
}) {
  const t = useTranslations('feed')
  const handle = community?.handle ?? `#${params.community}`

  return (
    <Link
      href={feedHref({ ...params, community: undefined })}
      aria-label={t('chip.remove', { handle })}
      className="ml-auto inline-flex h-8 max-w-full min-w-0 tap items-center gap-1.5 rounded-full bg-muted px-3 type-action font-semibold outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="truncate">{handle}</span>
      <XIcon aria-hidden className="size-3.5 shrink-0" />
    </Link>
  )
}

/** Same place and height while the community name arrives: nothing moves (no CLS). */
export function CommunityChipSkeleton() {
  return <Skeleton aria-hidden className="ml-auto h-8 w-20 rounded-full" />
}
