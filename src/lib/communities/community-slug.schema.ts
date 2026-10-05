import { z } from 'zod'

/** A community slug as the backend writes it (lowercase groups, BTC for an asset). */
export const communitySlugSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/)
