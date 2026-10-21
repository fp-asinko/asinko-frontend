import type { RawCommunityMember } from '@/lib/api/contract'
import { DEMO_USER } from '../demo-user'
import { communityBySlug } from './communities'
import { followersOf, followingOf } from './follows'
import { FAN_NAMES, PROFILES } from './users'

// Who is in each community (E02, specs/community-members), newest first as the backend: #defi has
// enough members to page (the regulars and @maria's fans); the other groups and assets, a few
// regulars. The oldest is the creator (PRINCIPAL_MODERATOR, as the backend lists it). The demo
// viewer shows first where it is a member. A personal channel's members are its followers.

type Profile = (typeof PROFILES)[number]

const REGULARS = PROFILES.filter(
  (each) => each.id !== DEMO_USER.id && !FAN_NAMES.includes(each.username),
)
const FANS = PROFILES.filter((each) => FAN_NAMES.includes(each.username))
const byId = (id: string) => PROFILES.find((each) => each.id === id)!

function member(profile: Profile, role: RawCommunityMember['role']): RawCommunityMember {
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName ?? null,
    avatarUrl: profile.avatarUrl,
    role,
    // P-017: whether the demo viewer follows them; null for the viewer themself.
    isFollowedByViewer:
      profile.id === DEMO_USER.id ? null : followingOf(DEMO_USER.id).includes(profile.id),
  }
}

/** The members of a community, newest first; an empty list for a slug that does not exist. */
export function membersOf(slug: string): RawCommunityMember[] {
  const community = communityBySlug(slug)
  if (!community) return []
  if (community.type === 'PERSONAL_CHANNEL') {
    const owner = byId(community.createdByProfileId ?? '')
    return [
      ...followersOf(owner.id).map((id) => member(byId(id), 'MEMBER')),
      member(owner, 'PRINCIPAL_MODERATOR'),
    ]
  }
  // Oldest first, then reversed: the first regular created it.
  const people = slug === 'defi' ? [...REGULARS, ...FANS] : REGULARS.slice(0, 4)
  const oldestFirst = people.map((each, index) =>
    member(each, index === 0 ? 'PRINCIPAL_MODERATOR' : 'MEMBER'),
  )
  if (community.viewerMembership) {
    oldestFirst.push(member(byId(DEMO_USER.id), community.viewerMembership))
  }
  return oldestFirst.reverse()
}
