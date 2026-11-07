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

/** Endings for a taken handle (CG-19): a number, the year, or "hub". */
const ENDINGS = ['2', String(new Date().getFullYear()), 'hub']

/**
 * Up to three free-looking alternatives to a taken handle (specs/community-create CG-19): the same
 * handle with an ending, cut so it still fits 30. Only suggestions: each is checked again when
 * chosen.
 */
export function slugAlternatives(slug: string): string[] {
  return ENDINGS.map((ending) => {
    const base = slug.slice(0, SLUG_MAX - ending.length - 1).replace(/-+$/, '')
    return `${base}-${ending}`
  }).filter((each) => each !== slug)
}
