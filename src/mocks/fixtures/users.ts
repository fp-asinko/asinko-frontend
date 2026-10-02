import type { RawProfile, RawUserSummary } from '@/lib/api/contract'
import { DEMO_USER } from '../demo-user'
import { daysAgo, mockId } from './ids'

type Seed = Pick<RawProfile, 'username' | 'bio' | 'accuracyRate' | 'points' | 'badgeStatus'> &
  Partial<RawProfile>

function profile(n: number, seed: Seed): RawProfile {
  const correct = seed.correctCount ?? 0
  return {
    id: mockId(1, n),
    usernameChangedAt: null,
    avatarUrl: null,
    countryCode: null,
    countrySource: null,
    language: null,
    isPublic: true,
    status: 'ACTIVE',
    createdAt: daysAgo(120 - n * 7),
    currentStreak: 0,
    correctCount: correct,
    incorrectCount: 0,
    cancelledCount: 0,
    isFollowedByViewer: false,
    followerCount: 0,
    followingCount: 0,
    ...seed,
  }
}

export const PROFILES: RawProfile[] = [
  {
    ...profile(0, {
      username: DEMO_USER.username,
      bio: 'Demo account until login exists.',
      accuracyRate: null,
      points: 0,
      badgeStatus: 'NONE',
    }),
    id: DEMO_USER.id,
    isFollowedByViewer: null,
  },
  profile(1, {
    username: 'maria',
    bio: "On-chain analyst. If it's not on the blockchain, it didn't happen.",
    accuracyRate: 0.74,
    points: 12400,
    badgeStatus: 'IDENTITY_VERIFIED',
    currentStreak: 4,
    correctCount: 115,
    incorrectCount: 41,
    followerCount: 12400,
    followingCount: 180,
    isFollowedByViewer: true,
    countryCode: 'AR',
    countrySource: 'MANUAL',
    language: 'es',
  }),
  profile(2, {
    username: 'federico',
    bio: 'Macro + crypto. I write long and I am wrong in public.',
    accuracyRate: 0.68,
    points: 3200,
    badgeStatus: 'NONE',
    currentStreak: 2,
    correctCount: 59,
    incorrectCount: 28,
    followerCount: 3200,
    followingCount: 410,
    isFollowedByViewer: true,
  }),
  profile(3, {
    username: 'jeppe',
    bio: 'Building a public track record. Long BTC, short narratives.',
    accuracyRate: 0.79,
    points: 18900,
    badgeStatus: 'INSTITUTIONAL',
    currentStreak: 6,
    correctCount: 161,
    incorrectCount: 43,
    followerCount: 18900,
    followingCount: 95,
    isFollowedByViewer: true,
    language: 'en',
  }),
  profile(4, {
    username: 'quantsimula',
    bio: 'Quant models, zero vibes.',
    accuracyRate: 0.71,
    points: 5100,
    badgeStatus: 'IDENTITY_VERIFIED',
    currentStreak: 3,
    correctCount: 52,
    incorrectCount: 21,
    followerCount: 5100,
  }),
  profile(5, {
    username: 'macropilar',
    bio: 'Rates, liquidity and cycles. The Fed moves everything, even your shitcoin.',
    accuracyRate: 0.63,
    points: 2840,
    badgeStatus: 'NONE',
    currentStreak: 1,
    correctCount: 37,
    incorrectCount: 21,
    followerCount: 2840,
  }),
  profile(6, {
    username: 'esmev',
    bio: 'DeFi since 2020. Protocol deep dives.',
    accuracyRate: 0.7,
    points: 1830,
    badgeStatus: 'NONE',
    currentStreak: 3,
    correctCount: 31,
    incorrectCount: 14,
    followerCount: 1830,
    countryCode: 'BR',
    countrySource: 'IP',
    language: 'pt',
  }),
  profile(7, {
    username: 'diamondgrandma',
    bio: 'HODLing since 2017. Not selling, not even if my grandkids ask 💎',
    accuracyRate: 0.41,
    points: 612,
    badgeStatus: 'NONE',
    correctCount: 12,
    incorrectCount: 17,
    followerCount: 612,
  }),
  profile(8, {
    username: 'capitalprudente',
    bio: null,
    accuracyRate: null,
    points: 23,
    badgeStatus: 'NONE',
    followerCount: 23,
    isPublic: false,
  }),
]

export function userByUsername(username: string) {
  return PROFILES.find((each) => each.username === username)
}

/** Short shape embedded in posts and comments. */
export function summary(username: string): RawUserSummary {
  const user = userByUsername(username)
  if (!user) throw new Error(`Unknown mock user ${username}`)
  return {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    accuracyRate: user.accuracyRate,
  }
}
