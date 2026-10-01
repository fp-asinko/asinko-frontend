import { useTranslations } from 'next-intl'
import { StatusMessage } from '@/components/organisms/status-message'
import { buttonVariants } from '@/components/ui/button'
import { Link } from '@/i18n/navigation'

// F-24. Rendered inside the shell, translated. Next.js adds noindex to 404 responses.
export default function NotFound() {
  const t = useTranslations('errors.notFound')

  return (
    <StatusMessage
      title={t('title')}
      description={t('description')}
      action={
        <Link href="/" className={buttonVariants({ size: 'lg', className: 'min-h-11 px-5' })}>
          {t('backHome')}
        </Link>
      }
    />
  )
}
