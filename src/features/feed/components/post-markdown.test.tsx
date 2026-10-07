import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { PostMarkdown } from './post-markdown'

vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('PostMarkdown', () => {
  it('renders the whitelisted Markdown', () => {
    const { container } = renderWithIntl(
      <PostMarkdown>
        {'Some **bold**, *italic* and `code`.\n\n- one\n- two\n\n> quoted'}
      </PostMarkdown>,
    )
    expect(screen.getByText('bold').tagName).toBe('STRONG')
    expect(screen.getByText('italic').tagName).toBe('EM')
    expect(screen.getByText('code').tagName).toBe('CODE')
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(container.querySelector('blockquote')).toHaveTextContent('quoted')
  })

  it('never renders raw HTML', () => {
    const { container } = renderWithIntl(
      <PostMarkdown>
        {'Hi <script>alert(1)</script><img src=x onerror=alert(1)> there'}
      </PostMarkdown>,
    )
    // The tags are dropped; text between them stays as escaped, harmless text.
    expect(container.querySelector('script, img')).toBeNull()
    expect(container.innerHTML).not.toMatch(/<script|onerror/)
    expect(container).toHaveTextContent(/^Hi .*there$/)
  })

  it('drops javascript: and data: links, keeping their text', () => {
    const { container } = renderWithIntl(
      <PostMarkdown>{'[click](javascript:alert(1)) and [data](data:text/html,x)'}</PostMarkdown>,
    )
    expect(container.querySelector('a')).toBeNull()
    expect(container).toHaveTextContent('click and data')
  })

  it('opens external links safely and shows their real domain', () => {
    renderWithIntl(<PostMarkdown>{'[the docs](https://www.example.com/path)'}</PostMarkdown>)
    const link = screen.getByRole('link', { name: /the docs/ })
    expect(link).toHaveAttribute('href', 'https://www.example.com/path')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer nofollow ugc')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveTextContent('(example.com)')
    expect(link).toHaveTextContent('(opens in a new tab)')
  })

  it('turns headings into bold text and drops images', () => {
    const { container } = renderWithIntl(
      <PostMarkdown>{'# Big title\n\n![alt](https://example.com/x.png)'}</PostMarkdown>,
    )
    expect(container.querySelector('h1')).toBeNull()
    expect(screen.getByText('Big title').tagName).toBe('STRONG')
    expect(container.querySelector('img')).toBeNull()
  })

  it('renders mentions: communities as Home filters, users and loose tickers highlighted (H-14)', () => {
    renderWithIntl(
      <PostMarkdown>
        {
          '[$BTC](asinko:community/BTC) [#defi](asinko:community/defi) [@maria](asinko:user) [$XYZ](asinko:ticker)'
        }
      </PostMarkdown>,
    )
    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/?community=BTC')
    expect(screen.getByRole('link', { name: '#defi' })).toHaveAttribute('href', '/?community=defi')
    expect(screen.queryByRole('link', { name: '@maria' })).toBeNull()
    expect(screen.getByText('@maria').tagName).toBe('STRONG')
    expect(screen.getByText('$XYZ').tagName).toBe('STRONG')
  })
})
