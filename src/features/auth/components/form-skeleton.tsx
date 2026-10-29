import { Skeleton } from '@/components/ui/skeleton'

/** The place of a form while it loads (it is deferred, seo.md § Zod): the same height, no jump. */
export function FormSkeleton({ fields }: { fields: number }) {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  )
}
