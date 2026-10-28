import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FavoriteStar } from './favorite-star'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const action = vi.hoisted(() => ({ setFavorite: vi.fn() }))
vi.mock('@/lib/communities/set-favorite.action', () => action)

describe('FavoriteStar (specs/favorites)', () => {
  beforeEach(() => action.setFavorite.mockReset())

  it('marks a favorite at once, by the community slug (FV-02, FV-05)', async () => {
    action.setFavorite.mockResolvedValue({ ok: true, data: { favorite: true } })
    renderWithIntl(<FavoriteStar slug="maria" handle="@maria" initial={false} />)
    const star = screen.getByRole('button', { name: 'Add @maria to favorites' })
    expect(star).toHaveAttribute('aria-pressed', 'false')
    // Empty: only on the row's hover or focus.
    expect(star).toHaveClass('opacity-0', 'group-hover/row:opacity-100')
    await userEvent.click(star)
    expect(action.setFavorite).toHaveBeenCalledWith({ slug: 'maria', favorite: true })
    expect(
      await screen.findByRole('button', { name: 'Remove @maria from favorites' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('a favorite is always there, black (FV-01)', () => {
    renderWithIntl(<FavoriteStar slug="macro" handle="#macro" initial />)
    const star = screen.getByRole('button', { name: 'Remove #macro from favorites' })
    expect(star).not.toHaveClass('opacity-0')
    expect(star.querySelector('svg')).toHaveClass('fill-current')
  })

  it('goes back and says so when it fails (FV-04)', async () => {
    action.setFavorite.mockResolvedValue({ ok: false, error: 'api.errors.UNAVAILABLE' })
    renderWithIntl(<FavoriteStar slug="macro" handle="#macro" initial={false} />)
    await userEvent.click(screen.getByRole('button', { name: 'Add #macro to favorites' }))
    expect(await screen.findByRole('alert')).not.toBeEmptyDOMElement()
    expect(screen.getByRole('button', { name: 'Add #macro to favorites' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })
})
