'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'
import { StatusMessage } from '@/components/organisms/status-message'
import { Button } from '@/components/ui/button'

// F-25. Unexpected errors in a page: translated message + retry. Never shows error details.
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  const t = useTranslations('errors.unexpected')

  useEffect(() => {
    // Replaced by Sentry reporting in T-16.
    console.error(error)
  }, [error])

  return (
    <StatusMessage
      title={t('title')}
      description={t('description')}
      action={
        <Button size="lg" className="min-h-11 px-5" onClick={() => retry()}>
          {t('retry')}
        </Button>
      }
    />
  )
}
