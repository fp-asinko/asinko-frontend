import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageColumns } from '@/components/organisms/app-shell'
import { env } from '@/env'
import { buildAlternates } from '@/i18n/alternates'
import { routing } from '@/i18n/routing'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const safeLocale = routing.locales.find((each) => each === locale) ?? routing.defaultLocale
  return { alternates: buildAlternates(env.NEXT_PUBLIC_SITE_URL, safeLocale, '/') }
}

// Placeholder: the feed belongs to the `home` spec.
export default async function HomePage() {
  const t = await getTranslations('home')

  return (
    <PageColumns>
      <h1 className="type-page-title">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('placeholder')}</p>
    </PageColumns>
  )
}
