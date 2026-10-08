import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { HouseAd as Ad } from '../feed.types'

/**
 * A house ad between the comments, shaped as a comment (specs/post-detail-refresh PD-07 to
 * PD-10): logo, "Advertiser · Ad", the text, "Learn more" with the real domain beside it, and the
 * image when there is one, to the right (96px in phones, 128px from sm). A section named
 * "Ad: Advertiser": a screen reader hears that it is an ad first, and each ad has its own name. The link opens in another tab, sponsored (PD-09).
 */
export function CommentAd({ ad }: { ad: Ad }) {
  const t = useTranslations('postDetail.ad')

  return (
    <section aria-label={t('region', { advertiser: ad.advertiser })} className="flex gap-2.5">
      <UserAvatar name={ad.advertiser} imageUrl={ad.logoUrl} size="xs" />
      <div className="min-w-0 flex-1 wrap-anywhere">
        <p className="mb-0.75 flex flex-wrap items-center gap-x-1.25 type-meta text-muted-foreground">
          <span className="font-bold text-foreground">{ad.advertiser}</span>
          <span aria-hidden>·</span>
          <span>{t('label')}</span>
        </p>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="type-small">{ad.body}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              <a
                href={ad.url}
                target="_blank"
                rel="sponsored noopener noreferrer"
                // The visible text first in the name (WCAG 2.5.3), then who and where it opens.
                aria-label={t('ctaLabel', { advertiser: ad.advertiser })}
                className="inline-flex h-11 tap items-center rounded-full border border-input px-4 type-action outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8"
              >
                {t('cta')}
              </a>
              <span className="type-meta text-muted-foreground">{ad.domain}</span>
            </div>
          </div>
          {ad.imageUrl && (
            <Image
              src={ad.imageUrl}
              alt=""
              width={256}
              height={160}
              sizes="(min-width: 640px) 128px, 96px"
              unoptimized={ad.imageUrl.endsWith('.svg')}
              className="aspect-8/5 w-24 shrink-0 rounded-lg border object-cover sm:w-32"
            />
          )}
        </div>
      </div>
    </section>
  )
}
