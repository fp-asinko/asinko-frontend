import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { AgreeBar } from './agree-bar'

describe('AgreeBar (specs/thesis-agree AG-04, AG-06)', () => {
  it('says both shares and the total in words, not only in color', () => {
    renderWithIntl(<AgreeBar yes={62} no={38} />)
    expect(screen.getByText('62% yes · 38% no · 100 votes')).toBeInTheDocument()
  })

  it('counts one vote in singular, and in another locale', () => {
    renderWithIntl(<AgreeBar yes={0} no={1} />, { locale: 'es' })
    expect(screen.getByText('0 % sí · 100 % no · 1 voto')).toBeInTheDocument()
  })

  it('says there are no votes yet instead of an empty bar', () => {
    renderWithIntl(<AgreeBar yes={0} no={0} />)
    expect(screen.getByText('No votes yet')).toBeInTheDocument()
    expect(screen.queryByText(/votes?$/)).toBeNull()
  })

  it('leaves the bar out with only the words, when the buttons draw the shares', () => {
    const { container } = renderWithIntl(<AgreeBar yes={3} no={1} display="words" />)
    expect(screen.getByText('75% yes · 25% no · 4 votes')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden]')).toBeNull()
  })
})
