import type { CommunityPage, CommunityWidget } from '../../communities.types'

// Domain widgets for component tests (the mappers have their own tests against the mock fixtures).

export const GROUP: CommunityPage = {
  id: '00000000-0000-4000-8000-000000001009',
  slug: 'trading-on-chain',
  handle: '#trading-on-chain',
  path: '/hub/trading-on-chain',
  subtitle: 'Trading on-chain',
  description: 'Flows of wallets, exchanges and whales.',
  avatarUrl: null,
  bannerUrl: null,
  kind: 'group',
  memberCount: 1204,
  createdAt: '2026-06-03T12:00:00.000Z',
  rules: null,
  mainUrl: null,
  viewerMembership: 'MODERATOR',
  viewerIsFavorite: false,
}

export const TEXT: Extract<CommunityWidget, { type: 'TEXT' }> = {
  id: 'w-text',
  type: 'TEXT',
  title: 'Welcome',
  body: 'Share the data.',
}

export const RULES: Extract<CommunityWidget, { type: 'RULES' }> = {
  id: 'w-rules',
  type: 'RULES',
  title: 'Rules',
  rules: [
    { title: 'Data or it did not happen', description: 'Every claim with its source.' },
    { title: 'No paid signals', description: '' },
  ],
}

export const BUTTONS: Extract<CommunityWidget, { type: 'BUTTONS' }> = {
  id: 'w-buttons',
  type: 'BUTTONS',
  title: 'Links',
  buttons: [
    { label: 'Dune', link: { url: 'https://dune.com/x', external: true, host: 'dune.com' } },
    { label: 'DeFi', link: { url: '/hub/defi', external: false, host: null } },
  ],
}

export const COMMUNITIES: Extract<CommunityWidget, { type: 'COMMUNITIES' }> = {
  id: 'w-communities',
  type: 'COMMUNITIES',
  title: 'Related',
  communities: [
    {
      id: 'c1',
      slug: 'defi',
      handle: '#defi',
      name: 'DeFi',
      path: '/hub/defi',
      kind: 'group',
      avatarUrl: null,
      memberCount: 12880,
      viewerIsMember: false,
    },
    {
      id: 'c2',
      slug: 'BTC',
      handle: '$BTC',
      name: 'Bitcoin',
      path: '/asset/BTC',
      kind: 'asset',
      avatarUrl: null,
      memberCount: 48210,
      viewerIsMember: true,
    },
  ],
}

export const IMAGES: Extract<CommunityWidget, { type: 'IMAGES' }> = {
  id: 'w-images',
  type: 'IMAGES',
  title: '',
  images: [
    { src: '/mocks/chart-btc.svg', alt: 'BTC held by whales', link: null },
    {
      src: '/mocks/chart-sol.svg',
      alt: 'SOL on exchanges',
      link: { url: '/asset/SOL', external: false, host: null },
    },
  ],
}

export const CALENDAR: Extract<CommunityWidget, { type: 'CALENDAR' }> = {
  id: 'w-calendar',
  type: 'CALENDAR',
  title: 'Events',
  events: [
    {
      title: 'Flows review',
      startsAt: '2026-10-21T21:00:00.000Z',
      endsAt: '2026-10-21T22:00:00.000Z',
      allDay: false,
      location: 'Asinko Live',
      link: null,
    },
    {
      title: 'FOMC decision',
      startsAt: '2026-10-28T00:00:00.000Z',
      endsAt: null,
      allDay: true,
      location: null,
      link: { url: 'https://www.federalreserve.gov/', external: true, host: 'federalreserve.gov' },
    },
    {
      title: 'Last month recap',
      startsAt: '2026-09-29T20:00:00.000Z',
      endsAt: null,
      allDay: false,
      location: null,
      link: null,
    },
  ],
}
