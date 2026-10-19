import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithIntl } from '@/test/render-with-intl'
import { TextWidgetBody } from './text-widget'
vi.mock('@/i18n/navigation', () => import('@/test/navigation-mock'))

describe('TextWidgetBody (specs/community-widgets CW-06)', () => {
  it('shows the Markdown the page rendered', () => {
    renderWithIntl(<TextWidgetBody markdown={<strong>Share the data</strong>} />)
    expect(screen.getByText('Share the data').tagName).toBe('STRONG')
  })
})
