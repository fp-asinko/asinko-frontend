import { notFound } from 'next/navigation'

// Any URL inside a locale that no route handles shows [locale]/not-found.tsx, with the shell and
// translations (a top-level dynamic root layout cannot compose the default 404).
export default function CatchAll() {
  notFound()
}
