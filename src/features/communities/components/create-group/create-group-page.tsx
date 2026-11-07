import { UserRoundPlusIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { PageColumns } from '@/components/organisms/app-shell'
import { GateButtons } from '@/components/organisms/auth-gate'
import { EmptyState } from '@/components/organisms/empty-state'
import { routing, type Locale } from '@/i18n/routing'
import { getViewer } from '@/lib/session'
import { CreateGroupLoader } from './create-group-loader'

/** "Create a group", not indexed: a form, not content (specs/community-create CG-02). */
export async function createGroupMetadata(locale: Locale): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'createGroup' })
  const languages = Object.fromEntries(
    routing.locales.map((each) => [each, `/${each}/create-group`]),
  )
  return {
    title: t('title'),
    description: t('description'),
    robots: { index: false, follow: false },
    alternates: {
      canonical: `/${locale}/create-group`,
      languages: { ...languages, 'x-default': '/en/create-group' },
    },
  }
}

/**
 * The page to create a group (specs/community-create CG-01, CG-02): its title and the form, or,
 * without a session, how to get in, as the page to create a post.
 */
export async function CreateGroupPage() {
  const t = await getTranslations('createGroup')
  const viewer = await getViewer()
  return (
    <PageColumns>
      <h1 className="px-4 pt-4 type-page-title md:px-0">{t('title')}</h1>
      {viewer ? (
        <div className="px-4 py-4 md:px-0">
          <CreateGroupLoader />
        </div>
      ) : (
        <EmptyState
          icon={<UserRoundPlusIcon />}
          title={t('gateTitle')}
          description={t('gateBody')}
          action={<GateButtons className="justify-center" />}
        />
      )}
    </PageColumns>
  )
}
