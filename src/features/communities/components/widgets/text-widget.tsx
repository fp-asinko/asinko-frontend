import type { ReactNode } from 'react'

/** A widget of text (CW-06): its body as Markdown, rendered by the page (the feed's renderer). */
export function TextWidgetBody({ markdown }: { markdown: ReactNode }) {
  return <div className="type-small text-muted-foreground">{markdown}</div>
}
