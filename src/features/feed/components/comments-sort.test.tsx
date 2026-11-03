import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router, setPathname } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommentsSort } from './comments-sort'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const PATH = '/post/abc/eth-btc'

describe('CommentsSort (specs/post-detail-refresh PD-03, PD-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPathname(PATH)
  })

  it('says the current order, and opens a menu with the four, the current one checked', async () => {
    renderWithIntl(<CommentsSort current="new" />)
    const trigger = screen.getByRole('button', { name: 'Sort by: New' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    await userEvent.click(trigger)
    const menu = await screen.findByRole('menu', {}, { timeout: 8000 })
    const items = within(menu).getAllByRole('menuitemradio')
    expect(items.map((item) => item.textContent)).toEqual(['Best', 'Top', 'New', 'Old'])
    expect(within(menu).getByRole('menuitemradio', { name: 'New' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  it('keeps what else the URL says: a thesis’s side (specs/thesis-arguments TA-03)', async () => {
    const { unmount } = renderWithIntl(<CommentsSort current="best" keep={{ side: 'contra' }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Sort by: Best' }))
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Old' }, { timeout: 8000 }),
    )
    expect(router.push).toHaveBeenCalledWith(`${PATH}?side=contra&sort=old`, { scroll: false })
    unmount()

    renderWithIntl(<CommentsSort current="old" keep={{ side: 'contra' }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Sort by: Old' }))
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Best' }, { timeout: 8000 }),
    )
    expect(router.push).toHaveBeenLastCalledWith(`${PATH}?side=contra`, { scroll: false })
  })

  it('puts the order in the URL, keeping the scroll; the default one without it', async () => {
    const { unmount } = renderWithIntl(<CommentsSort current="best" />)
    await userEvent.click(screen.getByRole('button', { name: 'Sort by: Best' }))
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Old' }, { timeout: 8000 }),
    )
    expect(router.push).toHaveBeenCalledWith(`${PATH}?sort=old`, { scroll: false })
    // Chosen, the menu closes (a radio item alone would keep it open).
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    unmount()

    renderWithIntl(<CommentsSort current="top" />)
    await userEvent.click(screen.getByRole('button', { name: 'Sort by: Top' }))
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Best' }, { timeout: 8000 }),
    )
    expect(router.push).toHaveBeenLastCalledWith(PATH, { scroll: false })
  })

  it('speaks Spanish', () => {
    renderWithIntl(<CommentsSort current="best" />, { locale: 'es' })
    expect(screen.getByRole('button', { name: 'Ordenar por: Mejores' })).toBeInTheDocument()
  })
})
