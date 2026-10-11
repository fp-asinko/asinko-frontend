import { ImageResponse } from 'next/og'
import { getTranslations } from 'next-intl/server'
import { safeLocale } from '@/i18n/safe-locale'
import { shareFonts } from '@/lib/share-image/share-image'
import { SHARE_CONTENT_TYPE, SHARE_SIZE } from '@/lib/share-image/share-size'
import { GenericShareCard } from './_share/generic-card'

// The brand's image for every page of a language without its own (specs/share-preview SP-04).

export async function generateImageMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: safeLocale(params.locale), namespace: 'metadata' })
  return [{ id: 'brand', alt: t('description'), size: SHARE_SIZE, contentType: SHARE_CONTENT_TYPE }]
}

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale: safeLocale(locale), namespace: 'metadata' })
  return new ImageResponse(<GenericShareCard tagline={t('description')} />, {
    ...SHARE_SIZE,
    fonts: await shareFonts(),
  })
}
