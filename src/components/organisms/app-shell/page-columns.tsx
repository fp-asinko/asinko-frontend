import type { ReactNode } from 'react'

/** Center column of a page: up to 780px (48.75rem) as in the prototype, centered. */
export function PageColumns({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-195 min-w-0">{children}</div>
}
