import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SubmitAside } from '@/features/composer/components/submit-aside'

// The right column of the page to create a post: the chosen community, as Reddit's
// (specs/submit-page SU-07, § 2). It waits on its own: the page never waits for it.
export default async function SubmitRight({ searchParams }: PageProps<'/[locale]/publicar'>) {
  const { community } = await searchParams
  return (
    <Suspense fallback={<Skeleton className="m-3.5 h-48 rounded-lg" />}>
      <SubmitAside community={typeof community === 'string' ? community : undefined} />
    </Suspense>
  )
}
