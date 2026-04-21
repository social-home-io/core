/**
 * Minimal safe-subset markdown → HTML renderer (§23.43).
 *
 * Covers bold, italic, inline code, code blocks, links, line breaks.
 * No raw HTML passes through — every produced tag originates here, so
 * the output is XSS-safe by construction. Link hrefs are filtered to
 * ``http:`` / ``https:`` / ``mailto:`` — ``javascript:`` and data URLs
 * are stripped.
 *
 * This is deliberately tiny (no dep). When we need tables, footnotes,
 * or embed syntax we'll swap for ``marked`` + ``DOMPurify``.
 */

const _SAFE_SCHEMES = /^(https?:|mailto:|\/)/i

function _escape(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function _safeHref(href: string): string | null {
  const trimmed = href.trim()
  if (!_SAFE_SCHEMES.test(trimmed)) return null
  return trimmed
}

/** Render a markdown-ish string to safe HTML. */
export function renderMarkdown(input: string): string {
  if (!input) return ''
  // Escape first — everything we splice back in is intentional.
  let out = _escape(input)

  // Fenced code blocks ```…```
  out = out.replace(/```([\s\S]*?)```/g, (_m, body) => (
    `<pre class="sh-md-code"><code>${body}</code></pre>`
  ))
  // Inline code `…`
  out = out.replace(/`([^`\n]+)`/g, (_m, body) => (
    `<code class="sh-md-inline-code">${body}</code>`
  ))
  // Links [text](url) — reject unsafe schemes.
  out = out.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, text, href) => {
      const safe = _safeHref(href)
      if (safe === null) return _escape(text)
      return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${text}</a>`
    },
  )
  // Bold **…** (must come before italic so ** doesn't eat * greedily).
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  // Italic *…*
  out = out.replace(/(^|\s)\*([^*\n]+)\*(?=\s|$)/g, '$1<em>$2</em>')
  // Soft line breaks — preserve newlines inside a single paragraph.
  out = out.replace(/\n/g, '<br>')

  return out
}
