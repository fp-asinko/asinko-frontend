'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * The editor of the page to create a post, loaded after the page (seo.md § Performance): the form
 * brings react-hook-form and zod, which Turbopack ships whole (~90 KB gzip with its locales) and
 * would put the page far over the budget. The heading, the rules and the right column arrive from
 * the server; the form's place keeps its shape meanwhile, so nothing jumps (CLS).
 */
export const SubmitEditorLoader = dynamic(
  () => import('./submit-editor').then((mod) => mod.SubmitEditor),
  { ssr: false, loading: EditorSkeleton },
)

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
