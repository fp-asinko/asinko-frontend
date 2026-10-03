import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FadeImage } from './fade-image'

describe('FadeImage (home-motion M-09, D-M1)', () => {
  it('starts transparent and fades in once the image has loaded', async () => {
    const onLoad = vi.fn()
    render(<FadeImage src="/mocks/chart.svg" alt="Chart" width={10} height={10} onLoad={onLoad} />)
    const image = screen.getByRole('img', { name: 'Chart' })
    expect(image).toHaveClass('opacity-0')
    expect(image).not.toHaveAttribute('data-loaded')

    fireEvent.load(image)
    // next/image calls onLoad after an async decode().
    await waitFor(() => expect(image).toHaveClass('opacity-100'))
    expect(image).toHaveAttribute('data-loaded', 'true')
    expect(onLoad).toHaveBeenCalledOnce()
  })
})
