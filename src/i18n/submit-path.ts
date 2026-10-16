import type { Locale } from './routing'

/**
 * The page to create a post, by locale (specs/submit-page SU-01): /en/submit, /es/publicar,
 * /pt/publicar. Two folders draw it (submit and publicar): next-intl's `pathnames` would type every
 * link of the site against a list of routes.
 */
export const SUBMIT_SEGMENT: Record<Locale, 'submit' | 'publicar'> = {
  en: 'submit',
  es: 'publicar',
  pt: 'publicar',
}

/** The format the page opens on (`?type=`). */
export type SubmitType = 'text' | 'link' | 'image'

/**
 * Where "Create" goes: the page of the locale, with the community (its slug) and the format. A
 * path without the locale: the localized Link adds it.
 */
export function submitPath(
  locale: Locale,
  { community, type }: { community?: string | null; type?: SubmitType } = {},
): string {
  const query = new URLSearchParams()
  if (community) query.set('community', community)
  if (type && type !== 'text') query.set('type', type)
  const search = query.toString()
  return `/${SUBMIT_SEGMENT[locale]}${search ? `?${search}` : ''}`
}
