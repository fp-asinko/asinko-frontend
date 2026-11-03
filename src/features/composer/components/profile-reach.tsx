'use client'

import { useTranslations } from 'next-intl'

type ProfileReachProps = {
  id: string
  /** The chosen place is the author's personal channel. */
  own: boolean
}

/**
 * Says whether what is published also shows on the author's profile (specs/submit-form-layout
 * SF-13): in a group it does, as the profile lists all they publish; in their channel, only there.
 */
export function ProfileReach({ id, own }: ProfileReachProps) {
  const t = useTranslations('composer.community')
  return (
    <p id={id} className="type-meta text-muted-foreground">
      {t(own ? 'onlyProfile' : 'alsoProfile')}
    </p>
  )
}
