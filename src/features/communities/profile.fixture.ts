import type { ProfileDetails } from './communities.types'

/** A person's profile for tests: @maria, with a track record; each test overrides what it checks. */
export function profileDetails(overrides: Partial<ProfileDetails> = {}): ProfileDetails {
  return {
    id: '00000000-0000-4000-8000-000000000101',
    username: 'maria',
    displayName: 'María Ruiz',
    badge: null,
    bio: 'On-chain analyst.',
    avatarUrl: null,
    followerCount: 120,
    followingCount: 48,
    accuracyRate: 0.75,
    currentStreak: 3,
    correctCount: 9,
    incorrectCount: 3,
    cancelledCount: 1,
    joinedAt: '2026-03-02T10:00:00.000Z',
    isSelf: false,
    ...overrides,
  }
}
