import { screen } from '@testing-library/react'
import { useTranslations } from 'next-intl'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from './render-with-intl'

function HomeTitle() {
  const t = useTranslations('home')
  return <h1>{t('title')}</h1>
}

describe('renderWithIntl', () => {
  it('renders components with the default locale messages', () => {
    renderWithIntl(<HomeTitle />)
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })
})
