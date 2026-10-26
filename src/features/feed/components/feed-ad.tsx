import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { AdItem } from '../feed.types'

/**
 * An ad in a feed, where the backend put it (specs/ads AD-01 to AD-03). The piece leads: a small
 * "Advertiser · Ad" above, the image whole at its own proportion (its text and its legal lines are
 * never cut), its own text if it has one, and "Learn more" with the real destination. A tall
 * piece stops at 540px, whole and centered on the surface gray. A section named "Ad: Advertiser",
 * so a screen reader hears it is an ad first (AD-07); the link opens in another tab, sponsored
 * (AD-06). A Server Component: no JavaScript (AD-09).
 */
export function FeedAd({ ad }: { ad: AdItem }) {
  const t = useTranslations('ads')

  return (
    <section
      aria-label={t('region', { advertiser: ad.advertiser })}
      className="px-4 py-4.5 wrap-anywhere md:px-0 md:py-5.5"
    >
      <div className="mb-2 flex items-center gap-2">
        <UserAvatar
          name={ad.advertiser}
          imageUrl={ad.logoUrl}
          size="md"
          className="size-6 rounded-md text-[0.5625rem]"
        />
        <p className="flex min-w-0 items-center gap-x-1.25 type-meta text-muted-foreground">
          <span className="truncate font-bold text-foreground">{ad.advertiser}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{t('label')}</span>
        </p>
      </div>
      {ad.image && (
        // Its own size holds the place: nothing moves when it loads (AD-03).
        <div className="overflow-hidden rounded-2xl border bg-surface">
          <Image
            src={ad.image.src}
            alt={ad.image.alt}
            width={ad.image.width}
            height={ad.image.height}
            sizes="(min-width: 768px) 748px, 100vw"
            // Its own proportion holds the place before it loads (lazy, below): full width. In phones
            // a tall one stops at 540px, whole and centered on the gray; from md, the whole width
            // and the height it needs, never cut (AD-03, PO 2026-10-26).
            className="h-auto max-h-135 w-full object-contain md:max-h-none"
          />
        </div>
      )}
      {ad.body && <p className="mt-3 type-post-body">{ad.body}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={ad.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          // The visible text first in the name (WCAG 2.5.3), then who and where it opens.
          aria-label={t('ctaLabel', { advertiser: ad.advertiser })}
          className="inline-flex h-11 tap items-center rounded-full bg-muted px-4 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9"
        >
          {t('cta')}
        </a>
        <span className="type-meta text-muted-foreground">{ad.domain}</span>
      </div>
    </section>
  )
}
