import { describe, expect, test } from 'vitest'
import { renderMarkdown } from './markdown'

describe('renderMarkdown', () => {
  test('escapes HTML to prevent XSS', () => {
    const out = renderMarkdown('<script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toContain('&lt;script&gt;')
  })

  test('renders bold with **', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>')
  })

  test('renders italic with *', () => {
    expect(renderMarkdown('a *italic* b')).toContain('<em>italic</em>')
  })

  test('renders inline code', () => {
    expect(renderMarkdown('a `x=1` b')).toContain(
      '<code class="sh-md-inline-code">x=1</code>',
    )
  })

  test('renders code blocks with triple-backtick', () => {
    const out = renderMarkdown('```\nfoo();\n```')
    expect(out).toContain('<pre class="sh-md-code">')
    expect(out).toContain('foo();')
  })

  test('renders safe links', () => {
    const out = renderMarkdown('[home](https://example.com)')
    expect(out).toContain('<a href="https://example.com"')
    expect(out).toContain('rel="noopener noreferrer"')
    expect(out).toContain('target="_blank"')
  })

  test('strips javascript: URLs as a security measure', () => {
    const out = renderMarkdown('[click](javascript:alert(1))')
    expect(out).not.toContain('javascript:')
    // Fall through to plain text.
    expect(out).toContain('click')
  })

  test('strips data: URLs as a security measure', () => {
    const out = renderMarkdown('[x](data:text/html,<script>alert(1)</script>)')
    expect(out).not.toContain('data:')
  })

  test('preserves newlines as <br>', () => {
    expect(renderMarkdown('line1\nline2')).toContain('line1<br>line2')
  })

  test('handles empty and null-ish input', () => {
    expect(renderMarkdown('')).toBe('')
  })

  test('bold and italic on separate runs both render', () => {
    const out = renderMarkdown('**bold** and *italic*')
    expect(out).toContain('<strong>bold</strong>')
    expect(out).toContain('<em>italic</em>')
  })
})
