import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { GroupStep } from '../../lib/group-steps'
import { EditGroupProvider } from './edit-group-button'
import { GroupChecklist } from './group-checklist'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('../../actions/update-group.action', () => ({ updateGroup: vi.fn() }))
vi.mock('../../actions/upload-group-image.action', () => ({ uploadGroupImage: vi.fn() }))

const GROUP_ID = '00000000-0000-4000-8000-000000001001'
const GROUP = {
  id: GROUP_ID,
  slug: 'options-flow',
  handle: '#options-flow',
  name: 'Options Flow',
  description: 'Calls and puts.',
  rules: null,
  mainUrl: null,
  avatarUrl: null,
  bannerUrl: null,
}

const steps = (done: GroupStep['id'][]): GroupStep[] =>
  (['images', 'description', 'rules', 'post'] as const).map((id) => ({
    id,
    done: done.includes(id),
  }))

function renderChecklist(done: GroupStep['id'][]) {
  return renderWithIntl(
    <EditGroupProvider group={GROUP}>
      <GroupChecklist groupId={GROUP_ID} slug="options-flow" steps={steps(done)} />
    </EditGroupProvider>,
  )
}

describe('GroupChecklist (specs/community-edit CE-07, CE-08)', () => {
  beforeEach(() => {
    document.cookie = `asinko-group-checklist-${GROUP_ID}=; max-age=0; path=/`
  })

  it('shows its progress, what is done and what to do next', () => {
    renderChecklist(['description'])
    const card = screen.getByRole('region', { name: 'Get your group started' })
    expect(card).toHaveTextContent('1 of 4 done')
    expect(card).toHaveTextContent('Say what the group is aboutDone')
    expect(screen.getByRole('button', { name: 'Add a photo and a banner' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Write the first post' })).toHaveAttribute(
      'href',
      '/submit?community=options-flow',
    )
  })

  it('opens "Edit group" on the field of a step', async () => {
    renderChecklist([])
    await userEvent.click(screen.getByRole('button', { name: 'Write its rules' }))
    expect(await screen.findByRole('dialog', { name: 'Edit group' })).toBeInTheDocument()
  })

  it('hides for this group with its own cookie, and comes back with Undo', async () => {
    renderChecklist([])
    await userEvent.click(screen.getByRole('button', { name: 'Hide' }))
    expect(screen.queryByRole('region', { name: 'Get your group started' })).toBeNull()
    expect(document.cookie).toContain(`asinko-group-checklist-${GROUP_ID}=hidden`)
    expect(document.cookie).not.toContain('asinko-profile-checklist=hidden')
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('region', { name: 'Get your group started' })).toBeInTheDocument()
  })

  it('is gone once every step is done', () => {
    const { container } = renderChecklist(['images', 'description', 'rules', 'post'])
    expect(container).toBeEmptyDOMElement()
  })
})
