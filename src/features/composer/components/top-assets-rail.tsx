'use client'

import { useFormatter, useTranslations } from 'next-intl'
import { ScrollRail } from '@/components/molecules/scroll-rail'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'
import type { CommunityOption, TopAsset } from '../composer.types'

/**
 * The assets with the most theses, beside the search (specs/thesis-form-steps FS-04 to FS-07): a
 * pill each, its logo, symbol and how many theses, the most first. A tap chooses it, as the search
 * would; the chosen one is marked. Without any, nothing shows and the search takes the width.
 */
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
    <ScrollRail label={t('label')} className="self-center">
      {assets.map(({ option, thesisCount }) => {
        const active = chosen?.id === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            aria-label={t('item', { name: option.name, count: thesisCount })}
            onClick={() => onChoose(option)}
            className={cn(
              'inline-flex h-11 tap items-center gap-2 rounded-full pr-3.5 pl-1.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
              active
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted-hover',
            )}
          >
            <UserAvatar
              name={option.handle}
              colorKey={option.slug}
              imageUrl={option.avatarUrl}
              size="xs"
              className="size-7 shrink-0 rounded-full"
            />
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
    </ScrollRail>
  )
}
