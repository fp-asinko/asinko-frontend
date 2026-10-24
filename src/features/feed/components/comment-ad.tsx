import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { UserAvatar } from '@/components/molecules/user-avatar'
import type { AdItem } from '../feed.types'

/**
 * An ad with a post's comments, shaped as a comment (specs/ads AD-04): the logo and "Advertiser ·
 * Ad", then the piece across the comment's width, whole and up to 320px tall (its text must read:
 * the image leads, Q2), its own text if it has one, and "Learn more" with the real domain. A
 * section named "Ad: Advertiser" (AD-07); the link opens in another tab, sponsored (AD-06). A
 * Server Component: no JavaScript.
 */
export function CommentAd({ ad }: { ad: AdItem }) {
  const t = useTranslations('ads')

  return (
    <section aria-label={t('region', { advertiser: ad.advertiser })} className="flex gap-2.5">
      <UserAvatar name={ad.advertiser} imageUrl={ad.logoUrl} size="xs" className="rounded-md" />
      <div className="min-w-0 flex-1 wrap-anywhere">
        <p className="mb-1.5 flex flex-wrap items-center gap-x-1.25 type-meta text-muted-foreground">
          <span className="font-bold text-foreground">{ad.advertiser}</span>
          <span aria-hidden>·</span>
          <span>{t('label')}</span>
        </p>
        {ad.image && (
          // Its own proportion holds the place before it loads; a tall one stops at 320px, whole.
          <div className="overflow-hidden rounded-lg border bg-surface">
            <Image
              src={ad.image.src}
              alt={ad.image.alt}
              width={ad.image.width}
              height={ad.image.height}
              sizes="(min-width: 768px) 640px, 100vw"
              className="h-auto max-h-80 w-full object-contain"
            />
          </div>
        )}
        {ad.body && <p className="mt-2 type-small">{ad.body}</p>}
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href={ad.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            aria-label={t('ctaLabel', { advertiser: ad.advertiser })}
            className="inline-flex h-11 tap items-center rounded-full bg-muted px-4 type-action outline-none hover:bg-muted-hover focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8"
          >
            {t('cta')}
          </a>
          <span className="type-meta text-muted-foreground">{ad.domain}</span>
        </div>
      </div>
    </section>
  )
}
