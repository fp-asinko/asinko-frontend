import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { SubmitAside } from '@/features/composer/components/submit-aside'
import { parseSubmitQuery } from '@/features/composer/components/submit-page'

// The right column of the page to create a post: the chosen community, as Reddit's
// (specs/submit-page SU-07, § 2), and the related ones (specs/related-aside). It waits on its
// own: the page never waits for it.
export default async function SubmitRight({ searchParams }: PageProps<'/[locale]/submit'>) {
  const { community, related, type } = parseSubmitQuery(await searchParams)
  return (
    <Suspense fallback={<Skeleton className="m-3.5 h-48 rounded-lg" />}>
      <div className="arrive">
        <SubmitAside community={community} related={related} thesis={type === 'thesis'} />
      </div>
    </Suspense>
  )
}
