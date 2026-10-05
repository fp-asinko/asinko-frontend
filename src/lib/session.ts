import 'server-only'
import { cookies } from 'next/headers'
import { env } from '@/env'
import { DEMO_USER } from '@/mocks/demo-user'

export type Viewer = { id: string; username: string }

/**
 * Turns the demo user off in one browser, to test the experience without a session
 * (specs/guest-experience T-05). Only read with every route mocked, which src/env.ts refuses in
 * production: it can never hide a real session.
 */
export const MOCK_GUEST_COOKIE = 'asinko-mock-guest'

/**
 * The current user (F-38). With every route mocked (API_MOCKS=true): the demo user, unless the
 * browser asked to be a guest. Without mocks and without login: nobody, so writes get
 * UNAUTHENTICATED. The login spec replaces this function only (api-integration.md).
 */
export async function getViewer(): Promise<Viewer | null> {
  if (env.API_MOCKS !== 'all') return null
  const guest = (await cookies()).get(MOCK_GUEST_COOKIE)?.value === '1'
  return guest ? null : DEMO_USER
}
