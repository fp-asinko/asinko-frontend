import type { ReactNode } from 'react'

/** Empty or unavailable state of a list: a message and an optional action. No business logic. */
export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="type-ui text-muted-foreground">{message}</p>
      {action}
    </div>
  )
}
