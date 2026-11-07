import { mountToaster } from './toaster-host'

export type ToastRequest = { message: string; kind?: 'success' | 'error' | 'info' }

let show: ((request: ToastRequest) => void) | null = null

/**
 * Shows a toast (sonner) from a Client Component. The toaster mounts with the first one, in a
 * root of its own on the body: nothing in the layout, and a toast survives a client navigation.
 * Sonner travels with whoever imports this: only from code loaded after the page (a form behind
 * `next/dynamic`), never from what a route loads first (seo.md § Performance). Not an `import()`
 * here: each one costs every route its entry in the manifest.
 */
export function notify(request: ToastRequest) {
  show ??= mountToaster()
  show(request)
}
