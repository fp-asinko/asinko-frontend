import { ChevronDownIcon } from 'lucide-react'
import type { CommunityWidget } from '../../communities.types'

type Of<T extends CommunityWidget['type']> = Extract<CommunityWidget, { type: T }>

/**
 * The rules (CW-06), numbered. A rule with a description unfolds it (a <details>: no JavaScript);
 * one without is plain text.
 */
export function RulesWidgetBody({ widget }: { widget: Of<'RULES'> }) {
  return (
    <ol className="flex flex-col">
      {widget.rules.map((rule, index) => {
        const label = (
          <>
            <span aria-hidden className="w-5 shrink-0 text-muted-foreground tabular-nums">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">{rule.title}</span>
          </>
        )
        return (
          <li key={index} className="border-b last:border-b-0">
            {rule.description ? (
              <details className="group/rule">
                <summary className="flex min-h-10 list-none items-center gap-2 py-2 type-small outline-none focus-visible:ring-3 focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
                  {label}
                  <ChevronDownIcon
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-open/rule:rotate-180"
                  />
                </summary>
                <p className="pb-2.5 pl-7 type-meta whitespace-pre-line text-muted-foreground">
                  {rule.description}
                </p>
              </details>
            ) : (
              <p className="flex min-h-10 items-center gap-2 py-2 type-small">{label}</p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
