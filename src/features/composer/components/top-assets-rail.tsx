'use client'

import { CheckIcon } from 'lucide-react'
import { useFormatter, useTranslations } from 'next-intl'
import { MarqueeRail } from '@/components/molecules/marquee-rail'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'
import type { CommunityOption, TopAsset } from '../composer.types'

/**
 * The assets with the most theses, beside the search (specs/thesis-form-steps FS-04 to FS-07): a
 * pill each, its logo, symbol and how many theses, the most first. A tap chooses it, as the search
 * would; the chosen one is marked. They go by as a ticker (FS-05). Without any, nothing shows and the search takes the width.
 */
/** Seconds each asset takes to go by: a slow, even pace, whatever the count. */
const PACE = 4

export function TopAssetsRail({
  assets,
  chosen,
  onChoose,
}: {
  assets: readonly TopAsset[]
  chosen: CommunityOption | null
  onChoose: (asset: CommunityOption) => void
}) {
  const t = useTranslations('composer.thesis.topAssets')
  const format = useFormatter()
  if (assets.length === 0) return null

  return (
    <MarqueeRail label={t('label')} duration={assets.length * PACE} className="self-center">
      {assets.map(({ option, thesisCount }) => {
        // By its symbol: unique per asset, whichever list it came from.
        const active = chosen?.slug === option.slug
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            aria-label={t('item', { handle: option.handle, name: option.name, count: thesisCount })}
            onClick={() => onChoose(option)}
            className={cn(
              'inline-flex h-11 tap items-center gap-2 rounded-full pr-3.5 pl-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted-hover',
            )}
          >
            {/* Chosen, a ✓ in the logo's place: not only its color says so (FS-06). */}
            {active ? (
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-foreground text-primary">
                <CheckIcon aria-hidden className="size-4" strokeWidth={3} />
              </span>
            ) : (
              <UserAvatar
                name={option.handle}
                colorKey={option.slug}
                imageUrl={option.avatarUrl}
                size="xs"
                className="size-7 shrink-0 rounded-full"
              />
            )}
            <span aria-hidden className="flex flex-col items-start leading-tight">
              <span className="type-action font-bold">{option.handle}</span>
              <span
                className={cn(
                  'type-caption tabular-nums',
                  active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                )}
              >
                {t('count', { count: thesisCount, shown: format.number(thesisCount) })}
              </span>
            </span>
          </button>
        )
      })}
    </MarqueeRail>
  )
}
