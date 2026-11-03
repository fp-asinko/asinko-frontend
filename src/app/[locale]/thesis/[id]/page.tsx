import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
// By its path, not the feature's index: the index also brings the feeds' client parts (seo.md).
import {
  resolveThesisRoute,
  ThesisDetail,
  thesisMetadata,
} from '@/features/feed/components/thesis-route-page'

// A thesis's page: /thesis/{id} in every locale, as a post's (specs/thesis-detail Q1). Outside
// (main) and without loading.tsx, as /post: a real 404.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/thesis/[id]'>): Promise<Metadata> {
  const { locale, id } = await params
  return thesisMetadata(id, locale)
}

export default async function ThesisPage({ params }: PageProps<'/[locale]/thesis/[id]'>) {
  const { id } = await params
  const thesis = await resolveThesisRoute(id)
  return (
    <PageColumns>
      <ThesisDetail thesis={thesis} />
    </PageColumns>
  )
}
