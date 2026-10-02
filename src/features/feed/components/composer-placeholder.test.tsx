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
})
