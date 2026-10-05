import 'server-only'
import { cookies } from 'next/headers'
import { env } from '@/env'
import { DEMO_USER } from '@/mocks/demo-user'
import { readDevSession } from './auth/dev-session'

export type Viewer = { id: string; username: string }

/**
 * Turns the demo user off in one browser, to test the experience without a session
 * (specs/guest-experience T-05). Only read with every route mocked, which src/env.ts refuses in
 * production: it can never hide a real session.
 */
export const MOCK_GUEST_COOKIE = 'asinko-mock-guest'

/**
 * The current user (F-38). With every route mocked (API_MOCKS=true): the demo user, unless the
 * browser asked to be a guest. Otherwise, the development login's session (specs/dev-login) or
 * nobody, so writes get UNAUTHENTICATED. The auth spec replaces this function only
 * (api-integration.md).
 */
export async function getViewer(): Promise<Viewer | null> {
  if (env.API_MOCKS === 'all') {
    const guest = (await cookies()).get(MOCK_GUEST_COOKIE)?.value === '1'
    return guest ? null : DEMO_USER
  }
  const session = await readDevSession()
  return session ? { id: session.userId, username: session.username } : null
}

/** The Bearer token for the backend (P-002), or null without a session. */
export async function getAccessToken(): Promise<string | null> {
  if (env.API_MOCKS === 'all') return null
  return (await readDevSession())?.accessToken ?? null
}
