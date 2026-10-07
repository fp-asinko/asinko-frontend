/** Longest slug kept in a post URL: enough to read it, short enough to share. */
const SLUG_MAX = 60

/**
 * The readable part of a post URL, from its title (specs/post-create-detail § 1): lower case,
 * without accents, words joined with "-", cut at a word near 60 characters. Only for reading and
 * SEO: the id decides which post it is. An empty result (a title of emoji) becomes "post".
 */
export function postSlug(title: string): string {
  const words = title
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)

  let slug = ''
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word
    if (next.length > SLUG_MAX) break
    slug = next
  }
  // A first word longer than the limit is cut rather than dropped.
  if (!slug && words[0]) slug = words[0].slice(0, SLUG_MAX)
  return slug || 'post'
}

/** The page of a post, the same in every locale, as Reddit: /post/{id}/{slug}. */
export function postPath(id: string, title: string): string {
  return `/post/${encodeURIComponent(id)}/${postSlug(title)}`
}
