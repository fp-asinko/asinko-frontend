import type { ReactNode } from 'react'

/** Full-page status (not found, unexpected error, empty). Receives text already translated. */
export function StatusMessage({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <h1 className="text-title-2">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
