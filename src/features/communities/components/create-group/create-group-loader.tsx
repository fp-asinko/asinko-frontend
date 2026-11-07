'use client'

import dynamic from 'next/dynamic'
import { arriving } from '@/components/molecules/arriving'
import { Skeleton } from '@/components/ui/skeleton'

/** The form's outline: six steps and the button, so nothing jumps when it arrives (CLS). */
function FormSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-19 rounded-2xl" />
      <Skeleton className="h-24 rounded-2xl" />
      <Skeleton className="h-27 rounded-2xl" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-31 rounded-2xl" />
      <Skeleton className="h-19 rounded-2xl" />
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
    </div>
  )
}

/**
 * The form to create a group, loaded after the page (specs/community-create CG-14): it brings
 * react-hook-form and zod, which would put the page over the JS budget (seo.md).
 */
export const CreateGroupLoader = dynamic(
  () => import('./create-group-form').then((mod) => arriving(mod.CreateGroupForm)),
  { ssr: false, loading: FormSkeleton },
)
