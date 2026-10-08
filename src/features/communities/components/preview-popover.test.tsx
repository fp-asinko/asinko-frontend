import { screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { Preview } from '../communities.types'
import { PreviewPopover } from './preview-popover'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))
vi.mock('@/lib/communities/leave-community.action', () => ({ leaveCommunity: vi.fn() }))
vi.mock('@/lib/communities/set-favorite.action', () => ({ setFavorite: vi.fn() }))
const action = vi.hoisted(() => ({ getPreview: vi.fn() }))
vi.mock('../actions/get-preview.action', () => action)

const preview = (slug: string): Preview => ({
  community: {
    slug,
    handle: `#${slug}`,
    subtitle: null,
    description: 'About it.',
    avatarUrl: null,
    bannerUrl: null,
    kind: 'group',
    memberCount: 3,
    createdAt: null,
    viewerMembership: null,
  },
  profile: null,
})

function setup(slug: string) {
  const anchor = document.createElement('a')
  document.body.append(anchor)
  const { unmount } = renderWithIntl(
    <PreviewPopover anchor={anchor} target={{ kind: 'group', slug }} open onClose={vi.fn()} />,
  )
  return { anchor, unmount }
}

describe('PreviewPopover (specs/mention-preview § 2, MP-08)', () => {
  beforeEach(() => {
    action.getPreview.mockReset()
  })

  it('shows a skeleton while the data travels, then the card, describing the link', async () => {
    let answer!: (value: unknown) => void
    action.getPreview.mockReturnValue(new Promise((done) => (answer = done)))
    const { anchor } = setup('macro')
    expect(await screen.findByRole('status')).toHaveTextContent('Loading preview')

    answer({ ok: true, data: preview('macro') })
    expect(await screen.findByRole('link', { name: '#macro' })).toBeInTheDocument()
    expect(action.getPreview).toHaveBeenCalledWith({ kind: 'group', slug: 'macro' })
    const summary = document.getElementById(anchor.getAttribute('aria-describedby')!)
    expect(summary).toHaveTextContent('About it.')
  })

  it('shows no card when the data fails', async () => {
    action.getPreview.mockResolvedValue({ ok: false, error: 'api.errors.NOT_FOUND' })
    setup('gone')
    await waitFor(() => expect(action.getPreview).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument())
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows a card already seen at once, without asking again', async () => {
    action.getPreview.mockResolvedValue({ ok: true, data: preview('defi') })
    const { unmount } = setup('defi')
    await screen.findByRole('link', { name: '#defi' })
    unmount()

    action.getPreview.mockClear()
    setup('defi')
    expect(await screen.findByRole('link', { name: '#defi' })).toBeInTheDocument()
    expect(action.getPreview).not.toHaveBeenCalled()
  })
})
