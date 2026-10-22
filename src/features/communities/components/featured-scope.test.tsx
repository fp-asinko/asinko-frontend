import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FeatureMenu } from '@/components/organisms/featured'
import { router } from '@/test/navigation-mock'
import { renderWithIntl } from '@/test/render-with-intl'
import { FeaturedScope } from './featured-scope'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
const action = vi.hoisted(() => ({ setFeatured: vi.fn() }))
vi.mock('../actions/featured.action', () => ({ setFeatured: action.setFeatured }))

async function feature() {
  renderWithIntl(
    <FeaturedScope featured={[]} max={3}>
      <FeatureMenu kind="post" id="p1" label="Options for the post Rates" />
    </FeaturedScope>,
  )
  await userEvent.click(screen.getByRole('button', { name: 'Options for the post Rates' }))
  // The menu is loaded on the first open (deferred): give it time under load.
  await userEvent.click(
    await screen.findByRole('menuitem', { name: 'Feature on your profile' }, { timeout: 8000 }),
  )
}

describe('FeaturedScope (specs/profile-showcase PS-07)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('saves, announces it and renders the page again', async () => {
    action.setFeatured.mockResolvedValue({ ok: true, data: null })
    await feature()
    expect(action.setFeatured).toHaveBeenCalledWith({ kind: 'post', id: 'p1', featured: true })
    expect(await screen.findByRole('status')).toHaveTextContent('Featured on your profile.')
    expect(router.refresh).toHaveBeenCalled()
  })

  it('shows why it failed until closed', async () => {
    action.setFeatured.mockResolvedValue({ ok: false, error: 'featured.errors.limit' })
    await feature()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'You already have 3 featured. Remove one first.',
    )
    expect(router.refresh).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })
})
