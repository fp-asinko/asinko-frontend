import { cookies } from 'next/headers'
import type { FeaturedItem, ProfileDetails } from '../communities.types'
import { CHECKLIST_COOKIE } from '../lib/checklist-cookie'
import { toEditableProfile } from '../lib/editable-profile'
import { profileSteps } from '../lib/profile-steps'
import { EditProfileProvider } from './edit-profile-button'
import { FeaturedSection } from './featured-section'
import { ProfileChecklist } from './profile-checklist'

/**
 * What goes between a profile's header and its tabs (specs/profile-showcase): on your own, "Complete
 * your profile" unless hidden in this browser; for everyone, what the person featured.
 */
export async function ProfileShowcase({
  profile,
  featured,
  pagePath,
}: {
  profile: ProfileDetails
  featured: FeaturedItem[]
  /** The profile's page: its Posts tab. */
  pagePath: string
}) {
  const hidden = profile.isSelf && (await cookies()).get(CHECKLIST_COOKIE)?.value === 'hidden'

  return (
    <>
      {profile.isSelf && !hidden && (
        // Its steps open "Edit profile" too: a window of its own, as the header's.
        <EditProfileProvider profile={toEditableProfile(profile)}>
          <ProfileChecklist steps={profileSteps(profile, featured.length)} postsPath={pagePath} />
        </EditProfileProvider>
      )}
      <FeaturedSection
        items={featured}
        postsPath={pagePath}
        thesesPath={`${pagePath}?tab=theses`}
        own={profile.isSelf}
      />
    </>
  )
}
