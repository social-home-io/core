/**
 * Markdown rendering for the Pages feature (§23.58 / §23.72).
 *
 * Pipeline:
 *   raw markdown → wikilink pre-pass → marked (GFM + breaks) → DOMPurify
 *
 * DOMPurify is configured with a narrow allow-list so a hostile page body
 * cannot sneak in `<script>`, `<iframe>`, style/onclick attrs, or
 * `javascript:` URLs. Images + links resolve only `http:` / `https:` /
 * `mailto:`; anything else is stripped before rendering.
 *
 * Wikilinks: `[[Page Title]]` rewrites to an anchor pointing at
 * `/pages?title=Page+Title` — the Pages router reads the `title` query
 * param and opens the matching local page. Unresolved titles still land
 * on the Pages index, where the user can create the page.
 */

import DOMPurify from 'dompurify'
import { marked } from 'marked'

// Per-call renderer setup — marked is a singleton but we want a single
// clean configuration here so we don't leak options into other call
// sites in the app.
marked.use({
  gfm:       true,
  breaks:    true,
  pedantic:  false,
})

const WIKILINK_RE = /\[\[([^\]|]+)\]\]/g

const ALLOWED_TAGS = [
  'a', 'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'del', 's', 'u',
  'ul', 'ol', 'li',
  'code', 'pre',
  'blockquote',
  'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'input',  // input for GFM checklist items (<input type=checkbox>)
]

const ALLOWED_ATTR = [
  'href', 'title', 'alt', 'src', 'width', 'height',
  'colspan', 'rowspan', 'align',
  'type', 'checked', 'disabled',
  'class', 'id',
]

/** Pre-pass that converts `[[Page Title]]` into plain anchor markdown. */
function replaceWikilinks(src: string): string {
  return src.replace(WIKILINK_RE, (_m, title) => {
    const trimmed = String(title).trim()
    const href = `/pages?title=${encodeURIComponent(trimmed)}`
    return `[${trimmed}](${href})`
  })
}

/** Render and sanitise a Markdown body. Returns an HTML string safe to
 * splice into the DOM via `dangerouslySetInnerHTML`. */
export function renderMarkdown(src: string): string {
  const withLinks = replaceWikilinks(src || '')
  const rawHtml = marked.parse(withLinks, { async: false }) as string
  return DOMPurify.sanitize(rawHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: /^(?:https?|mailto|\/|#)/i,
    FORBID_TAGS:      ['style', 'script', 'iframe', 'object', 'embed'],
    FORBID_ATTR:      ['style', 'onerror', 'onload', 'onclick'],
    USE_PROFILES:     { html: true },
  })
}

/** Auto-generate a flat table of contents from ``##`` / ``###`` headings.
 * Returns `[{depth, text, slug}]` for the viewer's TOC rail. */
export function extractHeadings(
  src: string,
): { depth: number, text: string, slug: string }[] {
  const out: { depth: number, text: string, slug: string }[] = []
  const lines = (src || '').split('\n')
  for (const raw of lines) {
    const m = /^(#{2,3})\s+(.+?)\s*$/.exec(raw)
    if (!m) continue
    const depth = m[1].length
    const text = m[2].trim()
    const slug = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
    out.push({ depth, text, slug })
  }
  return out
}
