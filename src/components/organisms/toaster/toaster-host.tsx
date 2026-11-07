'use client'

import { useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import type { ToastRequest } from './notify'

/** The site's theme is the class next-themes puts on <html>, not the system's. */
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}
const currentTheme = () =>
  document.documentElement.classList.contains('dark') ? ('dark' as const) : ('light' as const)

function ToasterHost() {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => 'light' as const)
  return (
    <Toaster
      theme={theme}
      position="bottom-center"
      // Over the phones' bottom bar.
      mobileOffset={{ bottom: 'calc(4.25rem + env(safe-area-inset-bottom))' }}
    />
  )
}

/** Mounts the toaster once, outside Next's tree; sonner replays what was asked before it subscribed. */
export function mountToaster() {
  const node = document.createElement('div')
  document.body.appendChild(node)
  createRoot(node).render(<ToasterHost />)
  return ({ message, kind }: ToastRequest) => (kind ? toast[kind](message) : toast(message))
}
