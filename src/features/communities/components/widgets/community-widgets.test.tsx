import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AuthGateProvider } from '@/components/organisms/auth-gate'
import { JoinedProvider } from '@/components/organisms/join'
import { renderWithIntl } from '@/test/render-with-intl'
import { CommunityWidgets } from './community-widgets'
import { BUTTONS, CALENDAR, COMMUNITIES, GROUP, IMAGES, RULES, TEXT } from './widgets.fixture'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))
vi.mock('@/lib/communities/join-community.action', () => ({ joinCommunity: vi.fn() }))

function renderWidgets(widgets = [TEXT, RULES, BUTTONS, COMMUNITIES, IMAGES, CALENDAR]) {
  return renderWithIntl(
    <AuthGateProvider signedIn>
      <JoinedProvider>
        <CommunityWidgets
          page={GROUP}
          widgets={widgets}
          markdown={(body) => <p>{body}</p>}
          idPrefix="aside"
        />
      </JoinedProvider>
    </AuthGateProvider>,
    { now: new Date('2026-10-19T12:00:00.000Z') },
  )
}

const card = (name: string) => screen.getByRole('region', { name })

describe('CommunityWidgets (specs/community-widgets CW-05, CW-06)', () => {
  it('puts the community details first, then the widgets in their order', () => {
    renderWidgets()
    expect(
      // The cards, named by their headings (the images' row is a region too, named by a label).
      screen
        .getAllByRole('region')
        .flatMap((region) => region.getAttribute('aria-labelledby') ?? []),
    ).toEqual([
      'aside-about',
      'aside-w-text',
      'aside-w-rules',
      'aside-w-buttons',
      'aside-w-communities',
      'aside-w-images',
      'aside-w-calendar',
    ])
    // An image widget without a title is named by its type.
    expect(card('Images')).toBeInTheDocument()
  })

  it('details: description, created, members and public', () => {
    renderWidgets([])
    const about = card('Trading on-chain')
    expect(about).toHaveTextContent('Flows of wallets, exchanges and whales.')
    expect(about).toHaveTextContent('Created Jun 3, 2026')
    expect(about).toHaveTextContent('1,204 members')
    expect(about).toHaveTextContent('Public')
  })

  it('text: its Markdown, rendered by the page', () => {
    renderWidgets([TEXT])
    expect(card('Welcome')).toHaveTextContent('Share the data.')
  })

  it('rules: numbered; one with a description unfolds it', async () => {
    renderWidgets([RULES])
    const rules = card('Rules')
    expect(within(rules).getAllByRole('listitem')).toHaveLength(2)
    const first = within(rules).getByText('Data or it did not happen').closest('details')!
    expect(first).not.toHaveAttribute('open')
    await userEvent.click(within(rules).getByText('Data or it did not happen'))
    expect(first).toHaveAttribute('open')
    expect(within(rules).getByText('No paid signals').closest('details')).toBeNull()
  })

  it('buttons: a page of the site, and an external one in another tab saying its host', () => {
    renderWidgets([BUTTONS])
    const links = card('Links')
    const dune = within(links).getByRole('link', { name: /Dune at dune\.com/ })
    expect(dune).toHaveAttribute('href', 'https://dune.com/x')
    expect(dune).toHaveAttribute('target', '_blank')
    expect(dune).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
    expect(within(links).getByRole('link', { name: 'DeFi' })).toHaveAttribute('href', '/hub/defi')
  })

  it('communities: each with its members, and Join only where the viewer is not a member', () => {
    renderWidgets([COMMUNITIES])
    const related = card('Related')
    expect(within(related).getByRole('link', { name: '#defi 12,880 members' })).toHaveAttribute(
      'href',
      '/hub/defi',
    )
    expect(within(related).getAllByRole('button', { name: /Join/ })).toHaveLength(1)
  })

  it('images: each with its description, the linked one leading to its page', () => {
    renderWidgets([IMAGES])
    const images = card('Images')
    expect(within(images).getByRole('img', { name: 'BTC held by whales' })).toBeInTheDocument()
    expect(within(images).getByRole('link', { name: 'SOL on exchanges' })).toHaveAttribute(
      'href',
      '/asset/SOL',
    )
  })

  it('calendar: the upcoming ones, the nearest first, with where and its link', () => {
    renderWidgets([CALENDAR])
    const events = card('Events')
    const items = within(events).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining('Flows review'),
      expect.stringContaining('FOMC decision'),
    ])
    expect(items[0]).toHaveTextContent('Asinko Live')
    expect(items[1]).toHaveTextContent('All day')
    expect(within(items[1]!).getByRole('link', { name: /FOMC decision/ })).toHaveAttribute(
      'target',
      '_blank',
    )
  })

  it('calendar: says so without upcoming events', () => {
    renderWidgets([{ ...CALENDAR, events: [CALENDAR.events[2]!] }])
    expect(card('Events')).toHaveTextContent('No upcoming events')
  })

  it('says the widgets could not load, keeping the details', () => {
    renderWithIntl(
      <CommunityWidgets page={GROUP} widgets={null} markdown={() => null} idPrefix="aside" />,
    )
    expect(card('Trading on-chain')).toBeInTheDocument()
    expect(screen.getByText("The widgets couldn't load.")).toBeInTheDocument()
  })
})
