/**
 * HereMention — @here rendering in post content (§23.42).
 * Highlights @here mentions so users know the post targets everyone.
 */
export function renderMentions(text: string): string {
  return text
    .replace(/@here\b/g, '<span class="sh-mention sh-mention--here">@here</span>')
    .replace(/@(\w+)/g, '<span class="sh-mention sh-mention--user">@$1</span>')
}

export function MentionBadge({ type }: { type: 'here' | 'user' }) {
  if (type === 'here') {
    return <span class="sh-mention-badge sh-mention-badge--here" title="Notifies all members">@here</span>
  }
  return null
}
