import type { EditProfileField, ProfileDetails } from '../communities.types'

/** A step of "Complete your profile" (specs/profile-showcase PS-02). */
export type ProfileStep = {
  id: 'avatar' | 'headline' | 'bio' | 'location' | 'links' | 'openTo' | 'banner' | 'featured'
  done: boolean
  /** Where "Edit profile" opens for it; none for featuring, which is done from "⋯". */
  field: EditProfileField | null
}

type StepProfile = Pick<
  ProfileDetails,
  'avatarUrl' | 'headline' | 'bio' | 'city' | 'countryCode' | 'links' | 'openTo' | 'bannerUrl'
>

/**
 * The eight steps, in their order (PS-02): what LinkedIn's suggestions ask first goes first. A step
 * is done when its part of the profile is there; featuring, with one featured at least.
 */
export function profileSteps(profile: StepProfile, featuredCount: number): ProfileStep[] {
  return [
    { id: 'avatar', done: profile.avatarUrl !== null, field: 'avatar' },
    { id: 'headline', done: profile.headline !== null, field: 'headline' },
    { id: 'bio', done: profile.bio !== null, field: 'bio' },
    {
      id: 'location',
      done: profile.city !== null || profile.countryCode !== null,
      field: 'location',
    },
    { id: 'links', done: profile.links.length > 0, field: 'links' },
    { id: 'openTo', done: profile.openTo.length > 0, field: 'openTo' },
    { id: 'banner', done: profile.bannerUrl !== null, field: 'banner' },
    { id: 'featured', done: featuredCount > 0, field: null },
  ]
}
