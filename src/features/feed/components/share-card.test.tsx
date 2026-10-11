import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ShareCard, type ShareCardData } from './share-card'

const data = (overrides: Partial<ShareCardData> = {}): ShareCardData => ({
  logoSrc: 'data:image/svg+xml;base64,AAAA',
  title: 'The Fed cuts 25 bps',
  community: { handle: '#macro', colorKey: 'macro', person: false },
  author: '@macropilar',
  stats: '642 votes · 6 comments',
  ...overrides,
})

describe('ShareCard (specs/share-preview SP-01, SP-07)', () => {
  it('shows the logo, the community with its initials, the title, the author and the numbers', () => {
    const { container } = render(<ShareCard {...data()} />)
    expect(container.querySelector('img')).toHaveAttribute('src', data().logoSrc)
    expect(screen.getByText('MA')).toBeInTheDocument()
    expect(screen.getByText('#macro')).toBeInTheDocument()
    expect(screen.getByText('The Fed cuts 25 bps')).toBeInTheDocument()
    expect(screen.getByText('@macropilar')).toBeInTheDocument()
    expect(screen.getByText('642 votes · 6 comments')).toBeInTheDocument()
  })

  it("draws a person's channel with a round avatar and no author line", () => {
    render(
      <ShareCard
        {...data({
          community: { handle: '@maria', colorKey: 'maria', person: true },
          author: null,
        })}
      />,
    )
    expect(screen.getByText('MA')).toHaveStyle({ borderRadius: '32px' })
    expect(screen.queryByText('·')).toBeNull()
  })

  it('leaves the community out when it is not known', () => {
    render(<ShareCard {...data({ community: null })} />)
    expect(screen.queryByText('#macro')).toBeNull()
  })

  it("draws the user's text as text, without reading HTML", () => {
    const { container } = render(<ShareCard {...data({ title: '<b>bold</b> & co' })} />)
    expect(screen.getByText('<b>bold</b> & co')).toBeInTheDocument()
    expect(container.querySelector('b')).toBeNull()
  })
})
