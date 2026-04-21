/**
 * MarkdownView — sanitised Markdown rendering for the Pages feature.
 *
 * Thin wrapper around `renderMarkdown` that spits the result into a
 * `<div>` via `dangerouslySetInnerHTML`. The div gets `.sh-markdown`
 * so typographic rules in `app.css` apply (heading hierarchy, code
 * font, list indent, table borders, blockquote rail).
 */
import { renderMarkdown } from '@/utils/markdown'

interface Props {
  src: string
  /** Override the outer class — defaults to `sh-markdown`. */
  class?: string
  /** When true, the container gets `aria-live="polite"` so screen
   * readers announce content changes (used by the live-preview pane).*/
  live?: boolean
}

export function MarkdownView({ src, class: klass, live }: Props) {
  const html = renderMarkdown(src || '')
  return (
    <div
      class={klass || 'sh-markdown'}
      aria-live={live ? 'polite' : undefined}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
