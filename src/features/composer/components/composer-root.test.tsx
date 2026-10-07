import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { ComposeTrigger } from '@/components/organisms/compose'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposeScope } from './compose-scope'
import { ComposerRoot } from './composer-root'

const actions = vi.hoisted(() => ({ createPost: vi.fn(), searchCommunities: vi.fn() }))
vi.mock('../actions/create-post.action', () => ({ createPost: actions.createPost }))
vi.mock('../actions/search-communities.action', () => ({
  searchCommunities: actions.searchCommunities,
}))
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

const DEFI = { id: '00000000-0000-4000-8000-000000001001', handle: '#defi', name: 'DeFi' }

function renderRoot({ signedIn = true, scope = false } = {}) {
  return renderWithIntl(
    <AuthGateProvider signedIn={signedIn}>
      <ComposerRoot>
        {scope && <ComposeScope {...DEFI} />}
        <ComposeTrigger>Create</ComposeTrigger>
        <ComposeTrigger type="LINK">Share a link</ComposeTrigger>
      </ComposerRoot>
    </AuthGateProvider>,
  )
}

const create = () => screen.getByRole('button', { name: 'Create' })

describe('ComposerRoot (specs/post-create-detail PC-01 to PC-06)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens the editor, loaded on demand, blank and on Text', async () => {
    renderRoot()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(create())
    // The first import of the deferred editor is slow in jsdom.
    expect(
      await screen.findByRole('dialog', { name: 'Create post' }, { timeout: 10_000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Text' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('combobox', { name: 'Community' })).toHaveValue('')
  })

  it('opens on the asked tab', async () => {
    renderRoot()
    await userEvent.click(screen.getByRole('button', { name: 'Share a link' }))
    expect(await screen.findByRole('tab', { name: 'Link' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it("comes with the page's community chosen (ComposeScope)", async () => {
    renderRoot({ scope: true })
    await userEvent.click(create())
    expect(await screen.findByRole('combobox', { name: 'Community' })).toHaveValue('#defi')
  })

  it('without a session, opens the account modal instead (PC-04)', async () => {
    renderRoot({ signedIn: false })
    await userEvent.click(create())
    expect(await screen.findByRole('dialog', { name: 'Join Asinko to post' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Create post' })).not.toBeInTheDocument()
  })
})
