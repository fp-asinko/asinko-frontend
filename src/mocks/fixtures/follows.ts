import type { RawUserSummary } from '@/lib/api/contract'
import { DEMO_USER } from '../demo-user'
import { FAN_NAMES, PROFILES } from './users'

// Who follows whom (E01, specs/follow-lists): @maria has enough followers to page (her fans, the
// demo viewer and two of the regulars), and follows three people. The demo viewer follows the
// profiles marked `isFollowedByViewer`. Everyone else follows nobody.

const named = (...usernames: string[]) =>
  usernames.map((username) => PROFILES.find((each) => each.username === username)!.id)

const FANS = named(...FAN_NAMES)

const FOLLOWING: Record<string, string[]> = {
  [DEMO_USER.id]: PROFILES.filter((each) => each.isFollowedByViewer).map((each) => each.id),
  [named('maria')[0]!]: named('federico', 'jeppe', 'quantsimula'),
  [named('federico')[0]!]: named('maria'),
  [named('jeppe')[0]!]: named('maria'),
  ...Object.fromEntries(FANS.map((fan) => [fan, named('maria')])),
}

export function followingOf(userId: string): string[] {
  return FOLLOWING[userId] ?? []
}

export function followersOf(userId: string): string[] {
  return Object.entries(FOLLOWING)
    .filter(([, followed]) => followed.includes(userId))
    .map(([follower]) => follower)
}

/**
 * A person in a list, with whether the demo viewer follows them (proposal P-017): null for the
 * viewer themself.
 */
export function listItem(userId: string): RawUserSummary {
  const user = PROFILES.find((each) => each.id === userId)!
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    accuracyRate: user.accuracyRate,
    isFollowedByViewer:
      user.id === DEMO_USER.id ? null : followingOf(DEMO_USER.id).includes(user.id),
  }
}
