import type { Metadata } from 'next'
import { PageColumns } from '@/components/organisms/app-shell'
import { PostDetail, postMetadata, resolvePostRoute } from '@/features/feed'

// A post's page: /post/{id}/{slug} in every locale, as Reddit (specs/post-create-detail § 1).
// Outside (main) and without loading.tsx, as /hub: real 308 redirects and 404s.
export async function generateMetadata({
  params,
}: PageProps<'/[locale]/post/[id]/[[...slug]]'>): Promise<Metadata> {
  const { locale, id } = await params
  return postMetadata(id, locale)
}

export default async function PostPage({
  params,
  searchParams,
}: PageProps<'/[locale]/post/[id]/[[...slug]]'>) {
  const [{ locale, id, slug }, query] = await Promise.all([params, searchParams])
  const post = await resolvePostRoute(id, slug, locale)
  return (
    <PageColumns>
      <PostDetail post={post} searchParams={query} />
    </PageColumns>
  )
}
