import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { FeaturedMenuContext, FeatureMenu, type FeaturedMenuState } from './featured-menu'

function renderMenu(featured: string[] = [], state: Partial<FeaturedMenuState> = {}) {
  const set = vi.fn()
  renderWithIntl(
    <FeaturedMenuContext
      value={{
        isFeatured: (kind, id) => featured.includes(`${kind}:${id}`),
        full: featured.length >= 3,
        max: 3,
        pending: false,
        set,
        ...state,
      }}
    >
      <FeatureMenu kind="post" id="p1" label="Options for the post Rates" />
    </FeaturedMenuContext>,
  )
  return { set }
}

const open = async () => {
  await userEvent.click(screen.getByRole('button', { name: 'Options for the post Rates' }))
  return screen.findByRole('menuitem', {}, { timeout: 3000 })
}

describe('FeatureMenu (specs/profile-showcase PS-07)', () => {
  it('draws nothing outside your own profile', () => {
    renderWithIntl(<FeatureMenu kind="post" id="p1" label="Options" />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('features it, closing at once', async () => {
    const { set } = renderMenu()
    const item = await open()
    expect(item).toHaveTextContent('Feature on your profile')
    await userEvent.click(item)
    expect(set).toHaveBeenCalledWith('post', 'p1', true)
    expect(screen.getByRole('button', { name: 'Options for the post Rates' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('takes out one that is featured', async () => {
    const { set } = renderMenu(['post:p1'])
    const item = await open()
    expect(item).toHaveTextContent('Remove from featured')
    await userEvent.click(item)
    expect(set).toHaveBeenCalledWith('post', 'p1', false)
  })

  it('says to take one out first with the maximum featured', async () => {
    renderMenu(['post:a', 'post:b', 'thesis:c'])
    const item = await open()
    expect(item).toHaveTextContent('You have 3 featured: remove one first.')
    expect(item).toHaveAttribute('aria-disabled', 'true')
  })
})
