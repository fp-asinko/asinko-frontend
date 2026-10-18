import { Skeleton } from '@/components/ui/skeleton'

/**
 * The Replies tab while it comes (specs/backend-adoption BK-03): the shape of each reply (where,
 * what it says, when), so nothing jumps when the list arrives.
 */
export function ReplyListSkeleton() {
  return (
    <ul aria-hidden className="divide-y">
      {[0, 1, 2].map((index) => (
        <li key={index} className="flex flex-col gap-2 px-4 py-4 md:px-0">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-24" />
        </li>
      ))}
    </ul>
  )
}
