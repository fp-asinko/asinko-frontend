'use client'

import { useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useAuthGate } from '@/components/organisms/auth-gate'
import { useRouter } from '@/i18n/navigation'
import { createGroup } from '../actions/create-group.action'
import { uploadGroupImage } from '../actions/upload-group-image.action'
import type { CreateGroupForm, CreateGroupInput } from '../schemas/create-group.schema'
import type { ProfileImageKind } from '../components/edit-profile-images'

const FIELDS = ['name', 'slug', 'description', 'rules', 'mainUrl'] as const

export type GroupImages = Partial<Record<ProfileImageKind, Blob>>

export type CreateGroupState =
  | { status: 'idle' }
  | { status: 'creating' }
  /** Something other than a field failed: what is written stays, to try again (CG-11). */
  | { status: 'error'; error: string }
  /** Created, but an image could not be saved: its page, and which one failed (CG-11, Q5). */
  | { status: 'partial'; href: string; failed: ProfileImageKind }
  | { status: 'created' }

/**
 * Creates the group, then uploads each image chosen with the group already there, and goes to its
 * page (specs/community-create CG-09 to CG-11). A field the backend refuses gets its error and the
 * focus; without a session, the account window opens. An image that fails leaves the group made:
 * the form says so, with the link to it.
 */
export function useCreateGroup(form: UseFormReturn<CreateGroupForm, unknown, CreateGroupInput>) {
  const router = useRouter()
  const { openGate } = useAuthGate()
  const [state, setState] = useState<CreateGroupState>({ status: 'idle' })

  async function submit(values: CreateGroupForm, images: GroupImages) {
    if (state.status === 'creating' || state.status === 'created') return
    setState({ status: 'creating' })
    const result = await createGroup(values)
    if (!result.ok) {
      if (result.error === 'api.errors.UNAUTHENTICATED') {
        setState({ status: 'idle' })
        return openGate('login')
      }
      const field = FIELDS.find((name) => result.fieldErrors?.[name]?.[0])
      if (field) {
        setState({ status: 'idle' })
        form.setError(field, { message: result.fieldErrors?.[field]?.[0] }, { shouldFocus: true })
        return
      }
      return setState({ status: 'error', error: result.error })
    }

    const { id, slug } = result.data
    const href = `/hub/${slug}`
    for (const kind of ['avatar', 'banner'] as const) {
      const image = images[kind]
      if (!image) continue
      const data = new FormData()
      data.set('communityId', id)
      data.set('slug', slug)
      data.set('kind', kind)
      data.set('file', image)
      const uploaded = await uploadGroupImage(data)
      if (!uploaded.ok) return setState({ status: 'partial', href, failed: kind })
    }
    setState({ status: 'created' })
    router.push(href)
  }

  return { state, submit }
}
