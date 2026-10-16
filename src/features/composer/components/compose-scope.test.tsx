import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ComposeContext } from '@/components/organisms/compose'
import { ComposeScope } from './compose-scope'

describe('ComposeScope (specs/post-create-detail PC-06, specs/submit-page SU-02)', () => {
  it("sets the page's community while the page is open, and clears it after", () => {
    const setScope = vi.fn()
    const { unmount, container } = render(
      <ComposeContext value={{ scope: null, setScope }}>
        <ComposeScope id="me" slug="demo" handle="@demo" name="demo" own />
      </ComposeContext>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(setScope).toHaveBeenLastCalledWith({
      id: 'me',
      slug: 'demo',
      handle: '@demo',
      name: 'demo',
      own: true,
    })
    unmount()
    expect(setScope).toHaveBeenLastCalledWith(null)
  })
})
