import { getTranslations } from 'next-intl/server'

// Placeholder: the feed belongs to the `home` spec.
export default async function HomePage() {
  const t = await getTranslations('home')

  return (
    <main>
      <h1>{t('title')}</h1>
      <p>{t('placeholder')}</p>
    </main>
  )
}
