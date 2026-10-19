import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
// By its path, as the profile's parts (seo.md): the feature's index brings the pages' client parts.
import {
  achievementsMetadata,
  AchievementsView,
  getAchievementsPage,
} from '@/features/communities/components/achievements-page'

// A person's achievements, whole: /user/{username}/achievements in every locale, as the profile
// (specs/profile-achievements AC-06 to AC-08). Outside (main) and without loading.tsx: a real 404.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/user/[username]/achievements'>): Promise<Metadata> {
  const { locale, username } = await params
  return achievementsMetadata(decodeURIComponent(username), locale)
}

export default async function AchievementsPage({
  params,
}: PageProps<'/[locale]/user/[username]/achievements'>) {
  const { username } = await params
  const { profile, achievements } = await getAchievementsPage(decodeURIComponent(username))
  return (
    <PageColumns>
      <AchievementsView profile={profile} achievements={achievements} />
    </PageColumns>
  )
}
