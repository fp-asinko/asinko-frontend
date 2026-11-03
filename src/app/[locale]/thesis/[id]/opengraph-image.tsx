import { ImageResponse } from 'next/og'
import { getFormatter, getTranslations } from 'next-intl/server'
import { ShareCard } from '@/features/feed/components/share-card'
import { getThesis } from '@/features/feed/lib/thesis-api'
import { safeLocale } from '@/i18n/safe-locale'
import { clampTitle, shareFonts } from '@/lib/share-image/share-image'
import { SHARE_CONTENT_TYPE, SHARE_SIZE } from '@/lib/share-image/share-size'
import { LOGO_SRC } from '../../_share/brand'
import { GenericShareCard } from '../../_share/generic-card'

// A thesis's image for other apps (specs/thesis-detail TD-11), as a post's: its claim, where it was
// published and what it bets on. One that cannot be shown gets the brand's image.

// Per thesis, at request time: the read goes through the session's cookies (getViewer).
export const dynamic = 'force-dynamic'

type Params = { locale: string; id: string }

async function shownThesis(id: string) {
  const result = await getThesis(id)
  return result.ok ? result.data : null
}

/** Its alt text is the claim. */
export async function generateImageMetadata({ params }: { params: Params }) {
  const thesis = await shownThesis(params.id)
  const t = await getTranslations({ locale: safeLocale(params.locale), namespace: 'metadata' })
  return [
    {
      id: 'card',
      alt: thesis?.claim ?? t('description'),
      size: SHARE_SIZE,
      contentType: SHARE_CONTENT_TYPE,
    },
  ]
}

export default async function Image({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale, id } = await params
  const locale = safeLocale(rawLocale)
  const [thesis, fonts] = await Promise.all([shownThesis(id), shareFonts()])
  const options = { ...SHARE_SIZE, fonts }

  if (!thesis) {
    const t = await getTranslations({ locale, namespace: 'metadata' })
    return new ImageResponse(<GenericShareCard tagline={t('description')} />, options)
  }

  const [t, format] = await Promise.all([
    getTranslations({ locale, namespace: 'thesisSummary' }),
    getFormatter({ locale }),
  ])
  const date = format.dateTime(new Date(thesis.deadline), { dateStyle: 'medium' })
  const target = thesis.target
    ? t(`target.${thesis.target.direction}`, {
        price: format.number(thesis.target.price, {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: thesis.target.price >= 1000 ? 0 : 2,
        }),
        date,
      })
    : t('target.none', { date })
  const community = thesis.community
  return new ImageResponse(
    <ShareCard
      logoSrc={LOGO_SRC}
      title={clampTitle(thesis.claim)}
      community={
        community
          ? {
              handle: community.personal
                ? (thesis.author?.handle ?? community.handle)
                : community.handle,
              colorKey: community.personal
                ? (thesis.author?.username ?? community.slug)
                : community.slug,
              person: community.personal,
            }
          : null
      }
      author={community?.personal ? null : (thesis.author?.handle ?? null)}
      stats={target}
    />,
    options,
  )
}
