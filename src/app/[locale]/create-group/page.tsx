import type { Metadata } from 'next'
// By their paths, not the feature's index: the index also brings what other pages use (seo.md).
import {
  CreateGroupPage,
  createGroupMetadata,
} from '@/features/communities/components/create-group/create-group-page'
import { safeLocale } from '@/i18n/safe-locale'

// The page to create a group (specs/community-create): the same word in every locale (Q1). Outside
// (main) and without loading.tsx, as /submit: it resolves the session before sending anything.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/create-group'>): Promise<Metadata> {
  const { locale } = await params
  return createGroupMetadata(safeLocale(locale))
}

export default function CreateGroupRoute() {
  return <CreateGroupPage />
}
