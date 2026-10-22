import { MapPinIcon, SparklesIcon } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { FeedReason } from '../feed.types'

/** The country's name in the page's language, from Intl; null for a code it does not know. */
function countryName(code: string, locale: string): string | null {
  try {
    const name = new Intl.DisplayNames([locale], { type: 'region', fallback: 'none' }).of(code)
    return name ?? null
  } catch {
    return null
  }
}

/**
 * Why Explore shows a card, above its header (specs/explore-v1 EX-01, Q2): the community the
 * viewer follows that brought it, with a link to it, or that it is popular in their country. Icon
 * and text, so it reads without color; a Server Component, so it adds no JavaScript.
 */
export function FeedReasonLine({ reason }: { reason: FeedReason }) {
  const t = useTranslations('feed.card.reason')
  const locale = useLocale()

  const country = reason.type === 'country' ? countryName(reason.countryCode, locale) : null
  if (reason.type === 'country' && !country) return null

  const Icon = reason.type === 'similar' ? SparklesIcon : MapPinIcon
  return (
    <p className="mb-1.5 flex min-h-6 items-center gap-1.5 type-meta text-muted-foreground">
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="min-w-0 truncate">
        {reason.type === 'similar'
          ? t.rich('similar', {
              handle: reason.community.handle,
              community: (chunks) => (
                <Link
                  href={reason.community.path}
                  // The ring is cut by the line's truncate: the underline carries the focus too.
                  className="rounded-sm font-semibold text-foreground underline-offset-2 outline-none hover:underline focus-visible:underline focus-visible:decoration-2 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {chunks}
                </Link>
              ),
            })
          : t('country', { country: country ?? '' })}
      </span>
    </p>
  )
}
