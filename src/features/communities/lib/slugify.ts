import { SLUG_MAX } from '../schemas/create-group.schema'

/**
 * A group's handle from its name (specs/community-create CG-05): without accents, lowercase, a
 * hyphen for whatever is not a letter or a digit, never two in a row nor at the ends, and cut at
 * 30 without leaving a hyphen at the end. "Dividendos LatAm!" → "dividendos-latam".
 */
export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, SLUG_MAX)
    .replace(/-+$/, '')
}
