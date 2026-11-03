import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getFormatter, getTranslations } from 'next-intl/server'
import { BackButton } from '@/components/molecules/back-button'
import { Skeleton } from '@/components/ui/skeleton'
import { env } from '@/env'
import { buildAlternates, OG_LOCALES } from '@/i18n/alternates'
import { safeLocale } from '@/i18n/safe-locale'
import { getOrThrow } from '@/lib/api'
import { getViewer } from '@/lib/session'
import { shareImage, thesisImagePath } from '@/lib/share-image/share-metadata'
import { thesisPrice } from '@/lib/theses/price'
import type { ThesisItem } from '../feed.types'
import { getThesis } from '../lib/thesis-api'
import { PostMarkdown } from './post-markdown'
import { ThesisBet } from './thesis-bet'
import { ThesisCard } from './thesis-card'
import { ThesisMenu } from './thesis-menu'
import { ThesisArguments } from './thesis-arguments'
import { ThesisUpdates } from './thesis-updates'
import { thesisArgumentsQuerySchema } from '../schemas/thesis-arguments-query.schema'

/** "Above $150,000 by Dec 3, 2026": the thesis's description, as its summary says it. */
async function targetLine(thesis: ThesisItem, locale: ReturnType<typeof safeLocale>) {
  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: 'thesisSummary' }),
    getFormatter({ locale }),
  ])
  const date = format.dateTime(new Date(thesis.deadline), { dateStyle: 'medium' })
  if (!thesis.target) return t('target.none', { date })
  const price = thesisPrice(format, thesis.target.price)
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
 * A thesis's own page (TD-06 to TD-08): its card whole, with the reasoning, what it bets on and
 * where it stands; its author's updates, then its arguments, For and Against (specs/thesis-arguments).
 */
export async function ThesisDetail({
  thesis,
  searchParams,
}: {
  thesis: ThesisItem
  /** User input from the URL: validated here (security.md § 5). */
  searchParams: Record<string, string | string[] | undefined>
}) {
  const viewer = await getViewer()
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
      {/* A secondary section: it streams in, and never holds the arguments back. */}
      <Suspense fallback={<UpdatesSkeleton />}>
        <ThesisUpdates
          thesisId={thesis.id}
          // Its author, while it is open (TA-10). Not canCancel: that one ends in the last 10 %.
          canPublish={
            thesis.state === 'open' &&
            viewer !== null &&
            thesis.author !== null &&
            viewer.username === thesis.author.username
          }
        />
      </Suspense>
      <ThesisArguments thesis={thesis} query={thesisArgumentsQuerySchema.parse(searchParams)} />
    </>
  )
}

/** The room of an update while the section loads: no jump when it arrives (CLS). */
function UpdatesSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 border-t px-4 pt-5 pb-5 md:px-0">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  )
}
