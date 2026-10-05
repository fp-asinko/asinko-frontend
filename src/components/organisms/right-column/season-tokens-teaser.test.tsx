import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { SeasonTokensTeaser } from './season-tokens-teaser'

describe('SeasonTokensTeaser (RC-02)', () => {
  it('explains the season tokens as coming soon, under its own heading', () => {
    renderWithIntl(<SeasonTokensTeaser />)
    const region = screen.getByRole('region', { name: 'Season tokens' })
    expect(screen.getByRole('heading', { name: 'Season tokens' })).toBeInTheDocument()
    expect(region).toHaveTextContent('Coming soon')
    expect(screen.getByText('use it or lose it.').tagName).toBe('STRONG')
  })

  it('never shows a balance or a season number (Q1)', () => {
    renderWithIntl(<SeasonTokensTeaser />)
    expect(screen.getByRole('region', { name: 'Season tokens' }).textContent).not.toMatch(/\d/)
  })

  it('is translated', () => {
    renderWithIntl(<SeasonTokensTeaser />, { locale: 'es' })
    expect(screen.getByRole('heading', { name: 'Tokens de temporada' })).toBeInTheDocument()
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })
})
