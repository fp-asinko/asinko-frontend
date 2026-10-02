import { cn } from 'cn'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      // asinko: no pulse with prefers-reduced-motion (design-system.md § Accesibilidad).
      className={cn('rounded-md bg-muted motion-safe:animate-pulse', className)}
      {...props}
    />
  )
}

export { Skeleton }
