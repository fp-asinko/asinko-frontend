import { getTranslations } from 'next-intl/server'
import { PageColumns } from '@/components/organisms/app-shell'

// Placeholder: the feed belongs to the `home` spec.
export default async function HomePage() {
  const t = await getTranslations('home')

  return (
    <PageColumns>
      <h1 className="text-title-1">{t('title')}</h1>
      <p className="mt-2 text-muted-foreground">{t('placeholder')}</p>
    </PageColumns>
  )
}
