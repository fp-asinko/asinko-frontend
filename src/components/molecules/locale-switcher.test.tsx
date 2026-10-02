import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router, setPathname } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { LocaleSwitcher } from './locale-switcher'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPathname('/')
    window.history.replaceState(null, '', '/en')
  })

  it('offers every locale by its own name, with the current one selected', () => {
    renderWithIntl(<LocaleSwitcher />)
    const select = screen.getByRole('combobox', { name: 'Language' })

    expect(select).toHaveValue('en')
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'English',
      'Español',
      'Português',
    ])
  })

  it('switches to the same page in the chosen locale, keeping the URL filters (H-27)', async () => {
    window.history.replaceState(null, '', '/en?comunidad=btc')
    renderWithIntl(<LocaleSwitcher />)

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'es')

    expect(router.replace).toHaveBeenCalledWith('/?comunidad=btc', { locale: 'es' })
  })
})
