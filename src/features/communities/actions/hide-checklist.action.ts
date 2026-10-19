'use server'

import { cookies } from 'next/headers'
import { CHECKLIST_COOKIE } from '../lib/checklist-cookie'

/**
 * Hides "Complete your profile" in this browser (specs/profile-showcase PS-03): a preference of the
 * browser, not of the account, kept a year. Takes nothing; the page is rendered again without it.
 */
export async function hideChecklist(): Promise<void> {
  const store = await cookies()
  store.set(CHECKLIST_COOKIE, 'hidden', {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
  })
}
