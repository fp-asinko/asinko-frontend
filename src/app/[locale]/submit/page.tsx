import type { Metadata } from 'next'
// By their paths, not the feature's index: the index also brings what other pages use (seo.md).
import {
  checkSubmitSegment,
  SubmitPage,
  submitMetadata,
} from '@/features/composer/components/submit-page'
import { previewPost } from '@/features/feed/actions/preview-post.action'
import { safeLocale } from '@/i18n/safe-locale'

// The page to create a post (specs/submit-page): /submit in English; the other word redirects or is
// a 404 (SU-01). Outside (main) and without loading.tsx: a real 308 and a real 404.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/submit'>): Promise<Metadata> {
  const { locale } = await params
  return submitMetadata(safeLocale(locale))
}

export default async function SubmitRoute({ params, searchParams }: PageProps<'/[locale]/submit'>) {
  const { locale } = await params
  const query = await searchParams
  checkSubmitSegment('submit', safeLocale(locale), query)
  // The feed's card for the preview (specs/submit-tools ST-01): the page joins both features.
  return <SubmitPage searchParams={query} preview={previewPost} />
}
