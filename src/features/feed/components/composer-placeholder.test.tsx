import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { ComposerPlaceholder } from './composer-placeholder'

describe('ComposerPlaceholder (H-09)', () => {
  it('shows the input and the Post / Thesis / Live actions as coming soon', () => {
    renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    for (const name of ['What are you thinking?', 'Post', 'Thesis', 'Live']) {
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-disabled', 'true')
    }
  })

  it('colors the viewer avatar and keeps the guest placeholder neutral (FC-01)', () => {
    const { unmount } = renderWithIntl(<ComposerPlaceholder viewerName="demo" />)
    expect(screen.getByTestId('user-avatar')).toHaveAttribute('data-color')
    unmount()
    renderWithIntl(<ComposerPlaceholder viewerName={null} />)
    expect(screen.getByTestId('user-avatar')).not.toHaveAttribute('data-color')
  })
})
