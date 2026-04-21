/**
 * SpaceHero — header banner for a space feed page (§23 customization).
 *
 * Renders:
 *   1. Cover image (or gradient fallback when unset)
 *   2. Emoji + name overlay
 *   3. Optional `about_markdown` block below, piped through
 *      :mod:`MarkdownView`
 *
 * Hidden entirely when the space has no cover, about, or emoji — keep
 * the feed compact for spaces that haven't been customized yet.
 */
import { MarkdownView } from './MarkdownView'

interface Props {
  name: string
  emoji?: string | null
  coverUrl?: string | null
  about?: string | null
}

export function SpaceHero({ name, emoji, coverUrl, about }: Props) {
  const hasAny = Boolean(coverUrl) || Boolean(about) || Boolean(emoji)
  if (!hasAny) return null
  return (
    <section class="sh-space-hero" aria-label={`${name} header`}>
      <div class={`sh-space-hero-banner ${coverUrl ? 'sh-space-hero-banner--image' : 'sh-space-hero-banner--gradient'}`}>
        {coverUrl && (
          <img class="sh-space-hero-image"
               src={coverUrl}
               alt={`${name} cover`}
               loading="lazy" />
        )}
        <div class="sh-space-hero-overlay">
          {emoji && <span class="sh-space-hero-emoji">{emoji}</span>}
          <h1 class="sh-space-hero-name">{name}</h1>
        </div>
      </div>
      {about && (
        <div class="sh-space-hero-about">
          <MarkdownView src={about} />
        </div>
      )}
    </section>
  )
}
