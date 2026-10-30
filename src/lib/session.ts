import 'server-only'
import { cookies } from 'next/headers'
import { env } from '@/env'
import { allowedImageUrl } from '@/lib/images'
import { DEMO_USER } from '@/mocks/demo-user'
import { readSession } from './auth/session'

/** avatarUrl: the account's photo, only for its own avatar (specs/auth design.md § 14). */
export type Viewer = { id: string; username: string; avatarUrl?: string | null }

/** Who is looking: nobody, an account still choosing its username (AU-11), or a user. */
export type AccountState = 'guest' | 'needs-profile' | 'ready'

/**
 * Turns the demo user off in one browser, to test the experience without a session
 * (specs/guest-experience T-05). Only read with every route mocked, which src/env.ts refuses in
 * production: it can never hide a real session.
 */
export const MOCK_GUEST_COOKIE = 'asinko-mock-guest' // also in lib/auth/session.ts

/**
 * The current user (F-38), from the session (specs/auth): with a profile, or null. With every
 * route mocked (API_MOCKS=true) and no session, the demo user, unless the browser asked to be a
 * guest. Writes without a viewer get UNAUTHENTICATED.
 */
export async function getViewer(): Promise<Viewer | null> {
  const session = await readSession()
  if (session) {
    if (!session.username) return null
    const avatarUrl = allowedImageUrl(session.avatarUrl ?? null)
    return { id: session.userId, username: session.username, avatarUrl }
  }
  if (env.API_MOCKS === 'all') {
    const guest = (await cookies()).get(MOCK_GUEST_COOKIE)?.value === '1'
    return guest ? null : DEMO_USER
  }
  return null
}

/** For the layout: the account modal for a guest, the username screen for an account without one. */
export async function getAccountState(): Promise<AccountState> {
  const session = await readSession()
  if (session && !session.username) return 'needs-profile'
  return (await getViewer()) ? 'ready' : 'guest'
}

/** The Bearer token for the backend (P-002, AU-15), or null without a session. */
export async function getAccessToken(): Promise<string | null> {
  return (await readSession())?.accessToken ?? null
}
