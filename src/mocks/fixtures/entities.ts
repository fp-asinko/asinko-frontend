import type { RawEntity } from '@/lib/api/contract'
import { assetBySymbol } from './assets'
import { communityBySlug } from './communities'
import { userByUsername } from './users'

// Builds resolved mentions from a body, like the backend does on POST /posts (proposal P-001 asks
// for the same field on reads). Unknown mentions are not resolved, as in the backend.
// Usernames may contain inner dots, never a trailing one ("@federico." ends a sentence).
const MENTION = /\$([A-Z]{2,6})\b|#([a-z0-9][a-z0-9-]*)|@([a-z0-9_]+(?:\.[a-z0-9_]+)*)/g

export function extractEntities(body: string): RawEntity[] {
  const entities: RawEntity[] = []
  for (const match of body.matchAll(MENTION)) {
    const [raw, symbol, slug, username] = match
    const start = match.index
    const position: [number, number] = [start, start + raw.length]

    const resolved = symbol
      ? { type: 'TICKER' as const, id: assetBySymbol(symbol)?.id }
      : slug
        ? { type: 'COMMUNITY' as const, id: communityBySlug(slug)?.id }
        : { type: 'MENTION' as const, id: username ? userByUsername(username)?.id : undefined }

    if (resolved.id) entities.push({ type: resolved.type, raw, resolvedId: resolved.id, position })
  }
  return entities
}
