import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FavoriteOrder } from './favorite-order'
import { FavoriteStar } from './favorite-star'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const action = vi.hoisted(() => ({ setFavorite: vi.fn() }))
vi.mock('@/lib/communities/set-favorite.action', () => action)

const rows = ['macro', 'defi', 'latam'].map((slug) => ({
  slug,
  favorite: slug === 'latam',
  node: (
    <>
      <span>{slug}</span>
      <FavoriteStar slug={slug} handle={`#${slug}`} initial={slug === 'latam'} />
    </>
  ),
}))

// Each row by its name (the first span), not its star's alert.
const order = () =>
  screen.getAllByRole('listitem').map((item) => item.querySelector('span')?.textContent)

describe('FavoriteOrder (specs/favorites FV-06)', () => {
  beforeEach(() => action.setFavorite.mockReset())

  it('puts favorites first, the rest in the order they came', () => {
    renderWithIntl(
      <ul>
        <FavoriteOrder rows={rows} />
      </ul>,
    )
    expect(order()).toEqual(['latam', 'macro', 'defi'])
  })

  it('moves a row at the tap, without waiting for the server', async () => {
    let answer!: (value: unknown) => void
    action.setFavorite.mockReturnValue(new Promise((done) => (answer = done)))
    renderWithIntl(
      <ul>
        <FavoriteOrder rows={rows} />
      </ul>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Add #defi to favorites' }))
    // Among favorites, the order they came in: defi before latam.
    expect(order()).toEqual(['defi', 'latam', 'macro'])
    answer({ ok: true, data: { favorite: true } })
  })

  it('puts it back when it fails (FV-04)', async () => {
    action.setFavorite.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(
      <ul>
        <FavoriteOrder rows={rows} />
      </ul>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Remove #latam from favorites' }))
    // One alert per star: the one that failed says so.
    await vi.waitFor(() =>
      expect(screen.getAllByRole('alert').some((alert) => alert.textContent)).toBe(true),
    )
    expect(order()).toEqual(['latam', 'macro', 'defi'])
  })
})
