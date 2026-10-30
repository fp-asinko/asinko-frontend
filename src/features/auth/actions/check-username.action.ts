'use server'

import { readSession } from '@/lib/auth/session'
import { usernameAvailability, type UsernameAvailability } from '../lib/profile-api'
import { profileSchema } from '../schemas/auth.schema'

/**
 * Whether a username is free, while the welcome step is typed (specs/auth AU-24, design.md § 17).
 * A public endpoint: only for a signed-in account still choosing one, and only a valid username
 * goes to the backend (api-integration.md § Validar antes de la red).
 */
export async function checkUsername(raw: unknown): Promise<UsernameAvailability> {
  const parsed = profileSchema.shape.username.safeParse(raw)
  if (!parsed.success) return 'unknown'
  const session = await readSession()
  if (!session || session.username) return 'unknown'
  return usernameAvailability(parsed.data)
}
