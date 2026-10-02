import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageColumns } from '@/components/organisms/app-shell'
import { env } from '@/env'
import { HomeFeed } from '@/features/feed'
import { buildAlternates } from '@/i18n/alternates'
import { routing } from '@/i18n/routing'

export async function generateMetadata({ params }: PageProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params
  const safeLocale = routing.locales.find((each) => each === locale) ?? routing.defaultLocale
  return { alternates: buildAlternates(env.NEXT_PUBLIC_SITE_URL, safeLocale, '/') }
}

export default async function HomePage({ searchParams }: PageProps<'/[locale]'>) {
  const t = await getTranslations('home')

  return (
    <PageColumns>
      {/* The prototype has no visible page title; the single H1 is for screen readers and SEO. */}
      <h1 className="sr-only">{t('title')}</h1>
      <HomeFeed searchParams={searchParams} />
    </PageColumns>
  )
}
