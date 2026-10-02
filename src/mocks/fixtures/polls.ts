import type { RawPoll } from '@/lib/api/contract'
import { communityBySlug } from './communities'
import { daysAgo, hoursAgo, minutesAgo, mockId } from './ids'
import { summary } from './users'

function options(pollN: number, entries: Array<[label: string, votes: number | null]>) {
  return entries.map(([label, voteCount], index) => ({
    id: mockId(7, pollN * 10 + index),
    label,
    description: null,
    position: index,
    voteCount,
  }))
}

function communityId(slug: string) {
  const id = communityBySlug(slug)?.id
  if (!id) throw new Error(`Unknown mock community ${slug}`)
  return id
}

function creator(username: string) {
  const { accuracyRate: _omit, ...rest } = summary(username)
  return rest
}

// Covers: open with visible results, open with results hidden until voting, closed, and voted.
export const POLLS: RawPoll[] = [
  {
    id: mockId(5, 1),
    communityId: communityId('btc'),
    question: '¿Dónde cierra $BTC el 2026?',
    options: options(1, [
      ['Más de 150.000 USD', 412],
      ['Entre 100.000 y 150.000 USD', 892],
      ['Entre 60.000 y 100.000 USD', 341],
      ['Menos de 60.000 USD', 142],
    ]),
    closesAt: minutesAgo(-60 * 24 * 4),
    isClosed: false,
    allowVoteChange: true,
    resultsVisibility: 'ALWAYS',
    totalVotes: 1787,
    viewerOptionId: null,
    creator: null,
    creatorType: 'SYSTEM',
    publishedAt: hoursAgo(1),
    createdAt: hoursAgo(1),
  },
  {
    id: mockId(5, 2),
    communityId: communityId('defi'),
    question: '¿Qué porcentaje de tu portfolio está en DeFi?',
    options: options(2, [
      ['0%', null],
      ['1–10%', null],
      ['10–30%', null],
      ['Más de 30%', null],
    ]),
    closesAt: minutesAgo(-60 * 24 * 6),
    isClosed: false,
    allowVoteChange: true,
    resultsVisibility: 'ON_VOTE',
    // Hidden until the viewer votes (E03).
    totalVotes: null,
    viewerOptionId: null,
    creator: creator('esmev'),
    creatorType: 'USER',
    publishedAt: hoursAgo(6),
    createdAt: hoursAgo(6),
  },
  {
    id: mockId(5, 3),
    communityId: communityId('macro'),
    question: '¿Próximo movimiento de la Fed?',
    options: options(3, [
      ['Recorte de 50 bps', 98],
      ['Recorte de 25 bps', 741],
      ['Sin cambios', 412],
      ['Suba de 25 bps', 42],
    ]),
    closesAt: daysAgo(1),
    isClosed: true,
    allowVoteChange: false,
    resultsVisibility: 'ALWAYS',
    totalVotes: 1293,
    viewerOptionId: mockId(7, 31),
    creator: creator('macropilar'),
    creatorType: 'USER',
    publishedAt: daysAgo(3),
    createdAt: daysAgo(3),
  },
]

/** Real counts of polls whose results are hidden until voting (revealed by PUT /polls/:id/vote). */
export const HIDDEN_RESULTS: Record<string, number[]> = {
  [mockId(5, 2)]: [210, 540, 260, 90],
}

export function pollById(id: string) {
  return POLLS.find((each) => each.id === id)
}
