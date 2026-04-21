import { describe, it, expect } from 'vitest'
import { renderMarkdown, extractHeadings } from './markdown'

describe('renderMarkdown', () => {
  it('renders bold + italic', () => {
    const html = renderMarkdown('**bold** _em_')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>em</em>')
  })

  it('renders GFM tables', () => {
    const html = renderMarkdown('| a | b |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>a</th>')
  })

  it('renders task lists (GFM)', () => {
    const html = renderMarkdown('- [x] done\n- [ ] todo')
    expect(html).toContain('<input')
    expect(html).toContain('checked')
    expect(html).toContain('disabled')
  })

  it('strips <script> and javascript: URLs', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script>\n[x](javascript:alert(1))',
    )
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('javascript:')
  })

  it('strips inline event handlers', () => {
    const html = renderMarkdown('<img src="x" onerror="alert(1)" />')
    expect(html).not.toContain('onerror')
  })

  it('keeps safe http(s) links + adds mailto', () => {
    const html = renderMarkdown(
      '[site](https://example.com) [mail](mailto:a@b.co)',
    )
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('href="mailto:a@b.co"')
  })

  it('rewrites [[Wikilinks]] to /pages?title=...', () => {
    const html = renderMarkdown('See [[Other Page]] for more.')
    expect(html).toContain('href="/pages?title=Other%20Page"')
    expect(html).toContain('>Other Page</a>')
  })

  it('escapes raw HTML it does not recognise', () => {
    const html = renderMarkdown('Hello <iframe src="http://evil"></iframe>')
    expect(html).not.toContain('<iframe')
  })
})

describe('extractHeadings', () => {
  it('collects ## and ### with slugs', () => {
    const src = '# H1\n## Section A\n### Sub\n## Section B'
    const out = extractHeadings(src)
    expect(out).toEqual([
      { depth: 2, text: 'Section A', slug: 'section-a' },
      { depth: 3, text: 'Sub',       slug: 'sub' },
      { depth: 2, text: 'Section B', slug: 'section-b' },
    ])
  })

  it('returns [] on empty input', () => {
    expect(extractHeadings('')).toEqual([])
  })
})
