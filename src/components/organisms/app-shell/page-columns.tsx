import type { ReactNode } from 'react'

/*
 * Center + right columns of a page (design.md §3). The center is at most 42.5rem (680px, as in the
 * prototype); the right column (20rem) only shows from lg. Without `aside`, the center stays centered.
 */
export function PageColumns({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  if (!aside) return <div className="mx-auto w-full max-w-[42.5rem] min-w-0">{children}</div>

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[minmax(0,42.5rem)_20rem]">
      <div className="min-w-0">{children}</div>
      <aside className="sticky top-18 hidden self-start lg:block">{aside}</aside>
    </div>
  )
}
