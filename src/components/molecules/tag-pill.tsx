import { cn } from '@/lib/utils'

/**
 * A post's tag, as Reddit's flair (specs/drafts-tags DT-07, DT-10): a small gray pill, its text
 * plain (a community's own word). Beside a title on a card, and in the editor once chosen.
 */
export function TagPill({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 max-w-full shrink-0 items-center rounded-full bg-muted px-2.5 type-meta font-semibold text-foreground',
        className,
      )}
    >
      <span className="truncate">{label}</span>
    </span>
  )
}
