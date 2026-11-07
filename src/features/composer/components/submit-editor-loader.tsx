'use client'

import dynamic from 'next/dynamic'
import { arriving } from '@/components/molecules/arriving'
import { EditorSkeleton } from './submit-editor-skeleton'

/**
 * The editor of the page to create a post, loaded after the page (seo.md § Performance): the form
 * brings react-hook-form and zod, which Turbopack ships whole (~90 KB gzip with its locales) and
 * would put the page far over the budget. The heading, the rules and the right column arrive from
 * the server; the form's place keeps its shape meanwhile, so nothing jumps (CLS).
 */
export const SubmitEditorLoader = dynamic(
  () => import('./submit-editor').then((mod) => arriving(mod.SubmitEditor)),
  { ssr: false, loading: EditorSkeleton },
)

export { EditorSkeleton }
