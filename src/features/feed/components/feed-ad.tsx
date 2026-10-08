import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { HouseAd } from '../feed.types'

/**
 * A house ad in a feed, shaped as a post card (specs/post-detail-refresh PD-16), as Reddit's
 * promoted posts: the logo (40px, as a group's) and "Advertiser · Ad", the text, the image across
 * the card when there is one, and "Learn more" with the real destination. A section named
 * "Ad: Advertiser", so a screen reader hears it is an ad first (PD-10); the link opens in another
 * tab, sponsored (PD-09).
 */
export function FeedAd({ ad }: { ad: HouseAd }) {
  const t = useTranslations('postDetail.ad')

  return (
    <section
      aria-label={t('region', { advertiser: ad.advertiser })}
      className="px-4 py-4.5 wrap-anywhere md:px-0 md:py-5.5"
    >
      <div className="mb-2 flex items-center gap-2">
        <UserAvatar
          name={ad.advertiser}
          imageUrl={ad.logoUrl}
          size="lg"
          className="size-10 text-xs"
        />
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.25 type-meta text-muted-foreground">
          <span className="truncate type-ui font-bold text-foreground">{ad.advertiser}</span>
          <span aria-hidden>·</span>
          <span>{t('label')}</span>
        </p>
      </div>
      <p className="type-post-body">{ad.body}</p>
      {ad.imageUrl && (
        <Image
          src={ad.imageUrl}
          alt=""
          width={1200}
          height={750}
          sizes="(min-width: 768px) 688px, 100vw"
          unoptimized={ad.imageUrl.endsWith('.svg')}
          className="mt-3 aspect-8/5 w-full rounded-2xl border object-cover"
        />
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <a
          href={ad.url}
          target="_blank"
          rel="sponsored noopener noreferrer"
          // The visible text first in the name (WCAG 2.5.3), then who and where it opens.
          aria-label={t('ctaLabel', { advertiser: ad.advertiser })}
          className="inline-flex h-11 tap items-center rounded-full border border-input px-4 type-action outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9"
        >
          {t('cta')}
        </a>
        <span className="type-meta text-muted-foreground">{ad.domain}</span>
      </div>
    </section>
  )
}
