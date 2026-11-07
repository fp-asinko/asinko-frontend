import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import type { CounterThesis } from '../composer.types'
import { CounterThesisNote } from './counter-thesis-note'

const THESIS: CounterThesis = {
  id: '00000000-0000-4000-8000-000000000001',
  author: 'megas',
  symbol: 'NVDA',
  direction: 'above',
  targetPrice: 240,
  deadline: '2027-11-04T12:00:00.000Z',
}

describe('CounterThesisNote (specs/thesis-agree AG-11)', () => {
  it('says whose thesis it answers and its bet', () => {
    renderWithIntl(<CounterThesisNote thesis={THESIS} />)
    const note = screen.getByRole('complementary', { name: 'Answering megas' })
    expect(note).toHaveTextContent('$NVDA')
    expect(note).toHaveTextContent('Above $240 by Nov 4, 2027')
  })

  it('suggests the other way, without forcing it (TC-24)', () => {
    const { unmount } = renderWithIntl(<CounterThesisNote thesis={THESIS} />)
    expect(
      screen.getByText("If you think it won't reach $240, set your target below it."),
    ).toBeInTheDocument()
    unmount()
    renderWithIntl(<CounterThesisNote thesis={{ ...THESIS, direction: 'below' }} />, {
      locale: 'es',
    })
    expect(
      screen.getByText(/^Si creés que no baja a .*240.*, poné tu objetivo por encima.$/),
    ).toBeInTheDocument()
  })

  it('names a system thesis Asinko', () => {
    renderWithIntl(<CounterThesisNote thesis={{ ...THESIS, author: null }} />)
    expect(screen.getByRole('complementary', { name: 'Answering Asinko' })).toBeInTheDocument()
  })
})
