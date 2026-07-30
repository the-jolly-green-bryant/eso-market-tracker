import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import ExternalLink from './ExternalLink'

describe('ExternalLink', () => {
  it('opens safely in a new tab and displays an external-link icon', () => {
    const html = renderToStaticMarkup(
      <ExternalLink className="custom-link" href="https://example.com">
        Example
      </ExternalLink>,
    )

    expect(html).toContain('class="external-link custom-link"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('external-link-icon')
  })
})
