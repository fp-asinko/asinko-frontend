import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getFormatter, getTranslations } from 'next-intl/server'
import { BackButton } from '@/components/molecules/back-button'
import { env } from '@/env'
import { buildAlternates, OG_LOCALES } from '@/i18n/alternates'
import { safeLocale } from '@/i18n/safe-locale'
import { getOrThrow } from '@/lib/api'
import { shareImage, thesisImagePath } from '@/lib/share-image/share-metadata'
import type { ThesisItem } from '../feed.types'
import { getThesis } from '../lib/thesis-api'
import { PostMarkdown } from './post-markdown'
import { ThesisBet } from './thesis-bet'
import { ThesisCard } from './thesis-card'
import { ThesisMenu } from './thesis-menu'

/** "Above $150,000 by Dec 3, 2026": the thesis's description, as its summary says it. */
async function targetLine(thesis: ThesisItem, locale: ReturnType<typeof safeLocale>) {
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: 'thesisSummary' }),
    getFormatter({ locale }),
  ])
  const date = format.dateTime(new Date(thesis.deadline), { dateStyle: 'medium' })
  if (!thesis.target) return t('target.none', { date })
  const price = format.number(thesis.target.price, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: thesis.target.price >= 1000 ? 0 : 2,
  })
  return t(`target.${thesis.target.direction}`, { price, date })
}

/**
 * Title, description, canonical, hreflang and share image of a thesis's page (TD-11). A thesis
 * that does not resolve gets no metadata: the page is a 404.
 */
export async function thesisMetadata(id: string, rawLocale: string): Promise<Metadata> {
  const locale = safeLocale(rawLocale)
  const result = await getThesis(id)
  if (!result.ok) return {}
  const thesis = result.data
  const [t, site] = await Promise.all([
    getTranslations({ locale, namespace: 'feed.thesis.page' }),
    getTranslations({ locale, namespace: 'metadata' }),
  ])
  const title = thesis.asset
    ? t('title', { claim: thesis.claim, asset: `$${thesis.asset.symbol}` })
    : thesis.claim
  const description = await targetLine(thesis, locale)
  const image = shareImage(thesisImagePath(locale, thesis.id), thesis.claim)
  return {
    title,
    description,
    alternates: buildAlternates(env.NEXT_PUBLIC_SITE_URL, locale, thesis.path),
    openGraph: {
      title,
      description,
      siteName: site('title'),
      locale: OG_LOCALES[locale],
      type: 'article',
      ...image.openGraph,
    },
    twitter: image.twitter,
  }
}

/**
 * The thesis of a /thesis/{id} page (TD-10): one that does not exist, or an invalid id, is the
 * not-found page. Any other failure throws: the thesis is the page's main content (error.tsx).
 */
export async function resolveThesisRoute(id: string): Promise<ThesisItem> {
  const result = await getThesis(id)
  if (!result.ok && (result.code === 'NOT_FOUND' || result.code === 'INVALID')) notFound()
  return getOrThrow(result)
}

/**
 * A thesis's own page (TD-06 to TD-09): its card whole, with the reasoning, what it bets on and
 * where it stands, and its arguments' counts until they come (MVP-141, Q3).
 */
export async function ThesisDetail({ thesis }: { thesis: ThesisItem }) {
  const t = await getTranslations('feed.thesis')
  return (
    <>
      <ThesisCard
        thesis={thesis}
        variant="detail"
        leading={<BackButton variant="plain" />}
        menu={thesis.canCancel ? <ThesisMenu id={thesis.id} claim={thesis.claim} /> : undefined}
      >
        <div className="mt-4 type-post-body">
          <PostMarkdown className="gap-4">{thesis.reasoning}</PostMarkdown>
        </div>
        <ThesisBet thesis={thesis} />
      </ThesisCard>
      <section
        id="arguments"
        aria-labelledby="arguments-title"
        className="scroll-mt-20 border-t px-4 py-5 md:px-0"
      >
        <h2 id="arguments-title" className="type-section text-muted-foreground">
          {t('argumentsTitle')}
        </h2>
        <p className="mt-2 type-ui font-semibold">
          {t('argumentsCount', {
            pro: thesis.argumentCount.pro,
            contra: thesis.argumentCount.contra,
          })}
        </p>
        <p className="mt-1 type-small text-muted-foreground">{t('argumentsSoon')}</p>
      </section>
    </>
  )
}
