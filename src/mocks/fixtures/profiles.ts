import { z } from 'zod'
import { DEMO_USER } from '../demo-user'

// Example fixture for E01 `GET /api/v1/profiles/{identifier}` (docs/references/api/E01-*.md).
// It proves the mock mechanism end to end; real views register their own mocks.
export const profileSchema = z.object({
  id: z.uuid(),
  username: z.string().min(3).max(30),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  isPublic: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED', 'DELETED']),
  accuracyRate: z.number().nullable(),
  followerCount: z.number().int(),
  followingCount: z.number().int(),
  createdAt: z.iso.datetime(),
})

export type Profile = z.infer<typeof profileSchema>

export const PROFILES: Profile[] = [
  {
    id: DEMO_USER.id,
    username: DEMO_USER.username,
    avatarUrl: null,
    bio: 'Demo account while login is not available.',
    isPublic: true,
    status: 'ACTIVE',
    accuracyRate: null,
    followerCount: 0,
    followingCount: 0,
    createdAt: '2026-10-01T00:00:00Z',
  },
]
