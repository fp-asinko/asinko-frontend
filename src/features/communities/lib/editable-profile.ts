import type { EditableProfile, ProfileDetails } from '../communities.types'

/** What "Edit profile" starts with: what the profile has now (specs/profile-presentation PP-05). */
export function toEditableProfile(profile: ProfileDetails): EditableProfile {
  return {
    username: profile.username,
    displayName: profile.displayName,
    headline: profile.headline,
    countryCode: profile.countryCode,
    city: profile.city,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    bannerUrl: profile.bannerUrl,
    openTo: profile.openTo,
    links: profile.links.map((link) => link.url),
  }
}
