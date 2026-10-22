'use client'

import * as React from 'react'
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import { XIcon } from 'lucide-react'

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        // asinko: opens in 200ms and closes in 150ms, ease-out (specs/home-motion).
        'fixed inset-0 isolate z-50 bg-black/10 ease-out supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:duration-200 data-open:fade-in-0 data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  closeLabel,
  overlay = 'default',
  ...props
}: DialogPrimitive.Popup.Props & {
  /**
   * asinko: `solid` for a window too large for the backdrop's blur, redrawn on every frame of
   * its animation (specs/profile-edit-flow EF-12): a darker veil, without blur.
   */
  overlay?: 'default' | 'solid'
} &
  // asinko: the close button needs a translated accessible name (i18n.md, WCAG 4.1.2).
  (
    { showCloseButton?: true; closeLabel: string } | { showCloseButton: false; closeLabel?: never }
  )) {
  return (
    <DialogPortal>
      <DialogOverlay
        className={
          overlay === 'solid'
            ? 'bg-black/25 supports-backdrop-filter:backdrop-blur-none'
            : undefined
        }
      />
      <DialogPrimitive.Popup
        data-slot="dialog-content"
        className={cn(
          // asinko: opens in 200ms and closes in 150ms, ease-out (specs/home-motion).
          'fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 ease-out outline-none sm:max-w-sm data-open:animate-in data-open:duration-200 data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:duration-150 data-closed:fade-out-0 data-closed:zoom-out-95',
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={<Button variant="ghost" className="absolute top-2 right-2" size="icon-sm" />}
          >
            <XIcon />
            <span className="sr-only">{closeLabel}</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="dialog-header" className={cn('flex flex-col gap-2', className)} {...props} />
  )
}

// asinko: without the built-in "Close" button, which had a fixed English label (i18n.md).
function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-xl border-t bg-muted/50 p-4 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-heading text-base leading-none font-medium', className)}
      {...props}
    />
  )
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground',
        className,
      )}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
