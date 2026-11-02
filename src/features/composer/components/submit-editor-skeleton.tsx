import { Skeleton } from '@/components/ui/skeleton'

/** The editor's outline: the community chip, the formats, the title, the body and the buttons. */
export function EditorSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <Skeleton className="h-9 w-44 rounded-full" />
      <Skeleton className="h-9 w-64 rounded-lg" />
      <Skeleton className="h-11 rounded-lg" />
      <Skeleton className="h-36 rounded-lg" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-9 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
      </div>
    </div>
  )
}
