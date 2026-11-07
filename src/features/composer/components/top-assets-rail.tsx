'use client'

import { CheckIcon } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import { cn } from '@/lib/utils'
import type { CommunityOption, SuggestedAssets } from '../composer.types'

/**
 * Three assets beside the search (specs/thesis-form-steps FS-04 to FS-07, PO 2026-11-05): the
 * viewer's interests, then the popular ones, under a label that says which. Three equal columns,
 * still, level with the search; a light pill each, its logo and symbol. A tap chooses it, as the
 * search would; the chosen one is marked. Without any, nothing shows.
 */
export function TopAssetsRail({
  suggested,
  chosen,
  onChoose,
}: {
  suggested: SuggestedAssets
  chosen: CommunityOption | null
  onChoose: (asset: CommunityOption) => void
}) {
  const t = useTranslations('composer.thesis.topAssets')
  if (suggested.assets.length === 0) return null
  const label = t(suggested.basis)

  return (
    // Its pills level with the search. Beside it (sm), the label goes up to the step's title row,
    // out of the flow, so the row is as tall as the search and the title as close as in the other
    // steps (PO 2026-11-06). Under it, in phones, the label stays above the pills.
    <section aria-label={label} className="relative flex min-w-0 flex-col gap-1.5 self-end">
      <p
        aria-hidden
        className="type-meta text-muted-foreground sm:absolute sm:bottom-full sm:left-0 sm:mb-2"
      >
        {label}
      </p>
      <div className="grid h-12 grid-cols-3 items-center gap-2">
        {suggested.assets.map((option) => {
          // By its symbol: unique per asset, whichever list it came from.
          const active = chosen?.slug === option.slug
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              aria-label={t('item', { handle: option.handle, name: option.name })}
              onClick={() => onChoose(option)}
              className={cn(
                'inline-flex h-10 min-w-0 tap items-center justify-center gap-2 rounded-full px-2 type-action font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'border bg-surface text-foreground hover:bg-muted',
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
              <span aria-hidden className="truncate">
                {option.handle}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
