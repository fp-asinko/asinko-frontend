import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { parseFeedParams } from '../schemas/feed-params.schema'
import { FeedTypeMenuPopup } from './feed-type-menu-popup'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('FeedTypeMenuPopup (specs/feed-type-filter FT-04, FT-05)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('checks the current type, and choosing one navigates and closes it', async () => {
    const anchor = createRef<HTMLButtonElement>()
    const onOpenChange = vi.fn()
    renderWithIntl(
      <>
        <button ref={anchor} type="button">
          anchor
        </button>
        <FeedTypeMenuPopup
          params={parseFeedParams({ type: 'posts' })}
          open
          onOpenChange={onOpenChange}
          anchor={anchor}
        />
      </>,
    )
    const menu = await screen.findByRole('menu')
    expect(within(menu).getByRole('menuitemradio', { name: 'Posts' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Theses' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
    expect(router.push).toHaveBeenCalledWith(
      { pathname: '/', query: { type: 'theses' } },
      { scroll: false },
    )
  })
})
