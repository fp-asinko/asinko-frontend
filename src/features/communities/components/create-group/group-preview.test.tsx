import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { GroupPreview } from './group-preview'

const group = {
  handle: 'options-flow',
  name: 'Options Flow',
  description: 'Calls, puts and spreads.',
  avatarUrl: null,
  bannerUrl: null,
}

describe('GroupPreview (specs/community-create CG-08)', () => {
  it('shows the handle, the name and the description, with the Joined its creator will see', () => {
    renderWithIntl(<GroupPreview {...group} />)
    const preview = screen.getByRole('region', { name: 'Preview' })
    expect(preview).toHaveTextContent('#options-flow')
    expect(preview).toHaveTextContent('Options Flow')
    expect(screen.getByText('Calls, puts and spreads.')).toHaveClass('line-clamp-3')
    expect(preview).toHaveTextContent('Joined')
  })

  it('without a handle yet, a placeholder in gray and no description', () => {
    renderWithIntl(<GroupPreview {...group} handle="" name="" description="" />)
    const preview = screen.getByRole('region', { name: 'Preview' })
    expect(preview).toHaveTextContent('#your-group')
    expect(screen.getByText('your-group')).toHaveClass('text-muted-foreground')
  })

  it('shows the images chosen, or the color of its handle', () => {
    const { rerender } = renderWithIntl(<GroupPreview {...group} />)
    expect(screen.getByTestId('identity-banner')).toHaveAttribute('data-color')
    rerender(<GroupPreview {...group} bannerUrl="blob:banner" avatarUrl="blob:photo" />)
    expect(screen.getByTestId('identity-banner')).not.toHaveAttribute('data-color')
    expect(screen.getByTestId('identity-banner').querySelector('img')).toHaveAttribute(
      'src',
      'blob:banner',
    )
  })
})
