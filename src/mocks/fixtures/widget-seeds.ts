import type { StoredWidget } from '../widgets'
import { communityBySlug } from './communities'

// Widgets of the groups (P-028, phase 3 of the backend): what each group shows in its right
// column until the backend builds them. The slugs are dev's real groups (#macro, #crypto,
// #acciones…) and the fixtures' (#defi, #latam, #memecoins), so they look alive both with the real
// backend (API_MOCKS=missing) and without it. A list of communities only names the fixtures' (the
// mock resolves them by id), all of which also exist in dev.

const DAY = 86_400_000
/** A day from today at an hour (UTC): the calendars always have something coming. */
const at = (days: number, hour: number) => {
  const date = new Date(Date.now() + days * DAY)
  date.setUTCHours(hour, 0, 0, 0)
  return date.toISOString()
}
const ids = (...slugs: string[]) => slugs.flatMap((slug) => communityBySlug(slug)?.id ?? [])

export const GROUP_WIDGETS: Record<string, StoredWidget[]> = {
  macro: [
    {
      id: 'w-macro-text',
      type: 'TEXT',
      title: 'About macro',
      body: 'Rates, inflation, jobs and central banks: how the macro moves **every asset**.\n\n**Cite your sources.** A chart without its source gets removed.',
    },
    {
      id: 'w-macro-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        {
          title: 'Source every number',
          description: 'FRED, the central bank or the statistics office.',
        },
        {
          title: 'Theses, not predictions in the dark',
          description: 'Say what would prove you wrong.',
        },
        { title: 'No politics for its own sake', description: 'Policy, yes; parties, no.' },
      ],
    },
    {
      id: 'w-macro-calendar',
      type: 'CALENDAR',
      title: 'Macro calendar',
      events: [
        {
          title: 'US CPI (September)',
          startsAt: at(1, 12),
          endsAt: null,
          allDay: false,
          location: null,
          url: 'https://www.bls.gov/cpi/',
        },
        {
          title: 'FOMC decision',
          startsAt: at(8, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: 'https://www.federalreserve.gov',
        },
        {
          title: 'Nonfarm payrolls',
          startsAt: at(12, 12),
          endsAt: null,
          allDay: false,
          location: null,
          url: null,
        },
        {
          title: 'Rates and the dollar, live',
          startsAt: at(3, 22),
          endsAt: at(3, 23),
          allDay: false,
          location: 'Asinko Live',
          url: null,
        },
      ],
    },
    {
      id: 'w-macro-images',
      type: 'IMAGES',
      title: 'Chart of the week',
      images: [
        {
          imageUrl: '/mocks/chart-m2.svg',
          alt: 'Global M2 money supply, last 24 months',
          linkUrl: null,
        },
      ],
    },
    {
      id: 'w-macro-buttons',
      type: 'BUTTONS',
      title: 'Useful links',
      buttons: [
        { label: 'FRED', url: 'https://fred.stlouisfed.org' },
        { label: 'Fed calendar', url: 'https://www.federalreserve.gov/newsevents/calendar.htm' },
        {
          label: 'CME FedWatch',
          url: 'https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html',
        },
      ],
    },
  ],
  crypto: [
    {
      id: 'w-crypto-text',
      type: 'TEXT',
      title: 'Welcome',
      body: 'Bitcoin, Ethereum and the rest of the ecosystem: **on-chain data, regulation and cycles**.\n\nNo shilling, no referral links.',
    },
    {
      id: 'w-crypto-communities',
      type: 'COMMUNITIES',
      title: 'Go deeper',
      communityIds: ids('BTC', 'ETH', 'SOL', 'defi'),
    },
    {
      id: 'w-crypto-images',
      type: 'IMAGES',
      title: 'On-chain this week',
      images: [
        {
          imageUrl: '/mocks/chart-btc.svg',
          alt: 'BTC held by whales, last 12 weeks',
          linkUrl: '/asset/BTC',
        },
        {
          imageUrl: '/mocks/chart-sol.svg',
          alt: 'SOL on exchanges, last 12 weeks',
          linkUrl: '/asset/SOL',
        },
      ],
    },
    {
      id: 'w-crypto-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        { title: 'No shilling', description: 'Your bags are your business.' },
        { title: 'No referral links', description: '' },
        {
          title: 'Scams get reported',
          description: 'Never share a seed phrase, never DM for "support".',
        },
      ],
    },
    {
      id: 'w-crypto-calendar',
      type: 'CALENDAR',
      title: 'Events',
      events: [
        {
          title: 'Spot ETF flows, weekly review',
          startsAt: at(2, 21),
          endsAt: at(2, 22),
          allDay: false,
          location: 'Asinko Live',
          url: null,
        },
        {
          title: 'Ethereum core devs call',
          startsAt: at(6, 14),
          endsAt: null,
          allDay: false,
          location: null,
          url: null,
        },
      ],
    },
  ],
  acciones: [
    {
      id: 'w-acciones-text',
      type: 'TEXT',
      title: 'About',
      body: 'US and world equities: **earnings, valuation and long-term theses**. Show the numbers behind the call.',
    },
    {
      id: 'w-acciones-calendar',
      type: 'CALENDAR',
      title: 'Earnings season',
      events: [
        {
          title: 'NVIDIA earnings',
          startsAt: at(4, 21),
          endsAt: null,
          allDay: false,
          location: null,
          url: null,
        },
        {
          title: 'Apple earnings',
          startsAt: at(9, 21),
          endsAt: null,
          allDay: false,
          location: null,
          url: null,
        },
        {
          title: 'Tesla earnings',
          startsAt: at(-3, 21),
          endsAt: null,
          allDay: false,
          location: null,
          url: null,
        },
      ],
    },
    {
      id: 'w-acciones-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        {
          title: 'A thesis has a valuation',
          description: 'Multiples, cash flow or a range: not just "to the moon".',
        },
        { title: 'Disclose your position', description: 'Long, short or none.' },
      ],
    },
    {
      id: 'w-acciones-buttons',
      type: 'BUTTONS',
      title: 'Research',
      buttons: [
        { label: 'SEC EDGAR', url: 'https://www.sec.gov/edgar/search/' },
        { label: 'Macro', url: '/hub/macro' },
      ],
    },
  ],
  argentina: [
    {
      id: 'w-argentina-text',
      type: 'TEXT',
      title: 'About',
      body: 'Argentine market: **bonds, ADRs, CEDEARs, the dollar** and the local macro.',
    },
    {
      id: 'w-argentina-calendar',
      type: 'CALENDAR',
      title: 'Local calendar',
      events: [
        {
          title: 'INDEC monthly inflation',
          startsAt: at(5, 19),
          endsAt: null,
          allDay: false,
          location: null,
          url: 'https://www.indec.gob.ar',
        },
        {
          title: 'BCRA market expectations survey (REM)',
          startsAt: at(10, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: 'https://www.bcra.gob.ar',
        },
        {
          title: 'Sovereign bond coupon payment',
          startsAt: at(15, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: null,
        },
      ],
    },
    {
      id: 'w-argentina-buttons',
      type: 'BUTTONS',
      title: 'Official sources',
      buttons: [
        { label: 'BCRA', url: 'https://www.bcra.gob.ar' },
        { label: 'INDEC', url: 'https://www.indec.gob.ar' },
        { label: 'BYMA', url: 'https://www.byma.com.ar' },
      ],
    },
    {
      id: 'w-argentina-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        {
          title: 'Say which dollar',
          description: 'Official, MEP or CCL: each rate means something else.',
        },
        {
          title: 'No politics for its own sake',
          description: 'Policy and its effect on prices, yes.',
        },
      ],
    },
  ],
  chile: [
    {
      id: 'w-chile-text',
      type: 'TEXT',
      title: 'About',
      body: 'The Santiago Stock Exchange, **copper, lithium** and the Chilean peso.',
    },
    {
      id: 'w-chile-calendar',
      type: 'CALENDAR',
      title: 'Calendar',
      events: [
        {
          title: 'Central Bank monetary policy meeting',
          startsAt: at(7, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: 'https://www.bcentral.cl',
        },
        {
          title: 'Monetary Policy Report (IPoM)',
          startsAt: at(14, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: null,
        },
      ],
    },
    {
      id: 'w-chile-buttons',
      type: 'BUTTONS',
      title: 'Links',
      buttons: [
        { label: 'Bolsa de Santiago', url: 'https://www.bolsadesantiago.com' },
        { label: 'Banco Central de Chile', url: 'https://www.bcentral.cl' },
      ],
    },
  ],
  ipos: [
    {
      id: 'w-ipos-text',
      type: 'TEXT',
      title: 'About',
      body: 'Going public: **prospectuses, valuations** and how they do after the first day.',
    },
    {
      id: 'w-ipos-calendar',
      type: 'CALENDAR',
      title: 'Upcoming pricings',
      events: [
        {
          title: 'Fintech IPO pricing (expected)',
          startsAt: at(3, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: null,
        },
        {
          title: 'Lock-up expiry, last quarter’s IPOs',
          startsAt: at(11, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: null,
        },
      ],
    },
    {
      id: 'w-ipos-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        { title: 'Link the S-1 or F-1', description: 'The prospectus, not a headline.' },
        {
          title: 'First day pops are not a thesis',
          description: 'Say what it is worth in a year.',
        },
      ],
    },
    {
      id: 'w-ipos-buttons',
      type: 'BUTTONS',
      title: 'Filings',
      buttons: [{ label: 'SEC EDGAR', url: 'https://www.sec.gov/edgar/search/' }],
    },
  ],
  'meme-stocks': [
    {
      id: 'w-meme-text',
      type: 'TEXT',
      title: 'Welcome, apes',
      body: 'Short squeezes, risky options and the WSB culture. **With humor, but with data.**\n\nNot financial advice. Obviously.',
    },
    {
      id: 'w-meme-images',
      type: 'IMAGES',
      title: 'Hall of fame',
      images: [
        {
          imageUrl: '/mocks/meme-doge.svg',
          alt: 'Doge looking at a chart going up',
          linkUrl: '/hub/memecoins',
        },
      ],
    },
    {
      id: 'w-meme-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        { title: 'Loss porn is welcome', description: 'Gain porn too, with proof.' },
        { title: 'No pump and dumps', description: 'Coordinating buys gets you banned.' },
        { title: 'Be kind to the new apes', description: '' },
      ],
    },
    {
      id: 'w-meme-communities',
      type: 'COMMUNITIES',
      title: 'Same energy',
      communityIds: ids('memecoins', 'BTC'),
    },
  ],
  'value-investing-arg': [
    {
      id: 'w-viarg-text',
      type: 'TEXT',
      title: 'Welcome',
      body: 'Fundamental analysis and value investing, **with a focus on the Argentine market**.\n\nPatience is the edge.',
    },
    {
      id: 'w-viarg-rules',
      type: 'RULES',
      title: 'Rules',
      rules: [
        { title: 'Show the numbers', description: 'Balance sheet, cash flow, a fair value range.' },
        { title: 'Long term', description: 'Day trading belongs elsewhere.' },
        { title: 'Disclose your position', description: '' },
      ],
    },
    {
      id: 'w-viarg-buttons',
      type: 'BUTTONS',
      title: 'Reading list',
      buttons: [
        {
          label: 'Berkshire letters',
          url: 'https://www.berkshirehathaway.com/letters/letters.html',
        },
        { label: 'CNV filings', url: 'https://www.cnv.gov.ar' },
      ],
    },
    {
      id: 'w-viarg-communities',
      type: 'COMMUNITIES',
      title: 'Related',
      communityIds: ids('macro', 'latam'),
    },
  ],
  defi: [
    {
      id: 'w-defi-text',
      type: 'TEXT',
      title: 'About DeFi',
      body: 'Lending, DEXs, stablecoins and yields. **Read the contract before the APY.**',
    },
    {
      id: 'w-defi-buttons',
      type: 'BUTTONS',
      title: 'Tools',
      buttons: [
        { label: 'DefiLlama', url: 'https://defillama.com' },
        { label: 'Trading on-chain', url: '/hub/trading-on-chain' },
      ],
    },
    {
      id: 'w-defi-communities',
      type: 'COMMUNITIES',
      title: 'Related communities',
      communityIds: ids('ETH', 'trading-on-chain'),
    },
  ],
  latam: [
    {
      id: 'w-latam-text',
      type: 'TEXT',
      title: 'About',
      body: 'Markets of Latin America: **Argentina, Brazil, Chile, Mexico**. Currencies, bonds and stocks.',
    },
    {
      id: 'w-latam-calendar',
      type: 'CALENDAR',
      title: 'Central banks',
      events: [
        {
          title: 'Banxico decision',
          startsAt: at(6, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: null,
        },
        {
          title: 'Copom decision (Brazil)',
          startsAt: at(13, 0),
          endsAt: null,
          allDay: true,
          location: null,
          url: null,
        },
      ],
    },
  ],
  memecoins: [
    {
      id: 'w-memecoins-text',
      type: 'TEXT',
      title: 'Read this first',
      body: 'Memecoins are lottery tickets. **Never more than you can lose.**',
    },
    {
      id: 'w-memecoins-images',
      type: 'IMAGES',
      title: 'Mascot',
      images: [
        {
          imageUrl: '/mocks/meme-doge.svg',
          alt: 'Doge looking at a chart going up',
          linkUrl: null,
        },
      ],
    },
  ],
}
