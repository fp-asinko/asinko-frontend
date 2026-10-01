import 'server-only'
import { env } from '@/env'
import { DEMO_USER } from '@/mocks/demo-user'

export type Viewer = { id: string; username: string }

/**
 * The current user (F-38). With mocks: the demo user. Without mocks and without login: nobody, so
 * writes get UNAUTHENTICATED. The login spec replaces this function only (api-integration.md).
 */
export async function getViewer(): Promise<Viewer | null> {
  return env.API_MOCKS ? DEMO_USER : null
}
